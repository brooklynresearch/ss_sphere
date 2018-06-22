package com.bkr.spherenative.Display360;

/*
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.net.Uri;
import android.os.Environment;
import android.support.annotation.AnyThread;
import android.support.annotation.MainThread;
import android.util.Log;
import android.view.Surface;

import com.bkr.spherenative.Display360.rendering.Mesh;
import com.bkr.spherenative.Display360.rendering.SceneRenderer;

import java.io.File;
import java.security.InvalidParameterException;

import io.reactivex.Completable;
import io.reactivex.Observable;
import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.disposables.Disposable;
import io.reactivex.schedulers.Schedulers;

import org.videolan.libvlc.IVLCVout;
import org.videolan.libvlc.LibVLC;
import org.videolan.libvlc.Media;
import org.videolan.libvlc.MediaPlayer;

import java.util.ArrayList;


/**
 * MediaLoader takes an Intent from the user and loads the specified media file.
 *
 * <p>The process to load media requires multiple threads since the media is read from disk on a
 * background thread, but it needs to be loaded into the GL scene only after GL initialization is
 * complete.
 *
 * <p>To keep the sample simple, this class doesn't have any support for handling multiple Intents
 * within a single Activity lifecycle.
 *
 * <p>The Intent used to launch {@link } or {@link } is parsed by this
 * class and the extra & data fields are extracted. The data field should have a URI useable by
 * {@link MediaPlayer} or {@link BitmapFactory}. There should also be an integer extra matching one
 * of the MEDIA_* types in {@link Mesh}.
 *
 * <p>Example intents compatible with adb are:
 *   <ul>
 *     <li>
 *       A top-bottom stereo image in the VR Activity.
 *       <b>adb shell am start -a android.intent.action.VIEW  \
 *          -n com.google.vr.sdk.samples.video360/.VrVideoActivity \
 *          -d "file:///sdcard/IMAGE.JPG" \
 *          --ei stereoFormat 2
 *       </b>
 *     </li>
 *     <li>
 *       A monoscopic video in the 2D Activity.
 *       <b>adb shell am start -a android.intent.action.VIEW  \
 *          -n com.google.vr.sdk.samples.video360/.VideoActivity \
 *          -d "file:///sdcard/VIDEO.MP4" \
 *          --ei stereoFormat 0
 *       </b>
 *     </li>
 *   </ul>
 *
 * <p>This sample does not validiate that a given file is readable by the Android media decoders.
 * You should validate that the file plays on your target devices via
 * <b>adb shell am start -a android.intent.action.VIEW -t video/mpeg -d "file:///VIDEO.MP4"</b>
 */
public class MediaLoader implements IVLCVout.Callback, IVLCVout.OnNewVideoLayoutListener {
    private static final String TAG = "MediaLoader";

    public static final String MEDIA_FORMAT_KEY = "stereoFormat";
    private static final int DEFAULT_SURFACE_HEIGHT_PX = 2048;

    /** A spherical mesh for video should be large enough that there are no stereo artifacts. */
    private static final int SPHERE_RADIUS_METERS = 50;

    /** These should be configured based on the video type. But this sample assumes 360 video. */
    private static final int DEFAULT_SPHERE_VERTICAL_DEGREES = 180;
    private static final int DEFAULT_SPHERE_HORIZONTAL_DEGREES = 360;

    /** The 360 x 180 sphere has 15 degree quads. Increase these if lines in your video look wavy. */
    private static final int DEFAULT_SPHERE_ROWS = 12;
    private static final int DEFAULT_SPHERE_COLUMNS = 24;

    private final Context context;
    // This can be replaced by any media player that renders to a Surface. In a real app, this
    // media player would be separated from the rendering code. It is left in this class for
    // simplicity.
    // This should be set or cleared in a synchronized manner.
    LibVLC mLibVLC;
    MediaPlayer mediaPlayer;
    Boolean isPaused = true;
    // This sample also supports loading images.
    Bitmap mediaImage;
    // If the video or image fails to load, a placeholder panorama is rendered with error text.
    String errorText;

    // Due to the slow loading media times, it's possible to tear down the app before mediaPlayer is
    // ready. In that case, abandon all the pending work.
    // This should be set or cleared in a synchronized manner.
    private boolean isDestroyed = false;

    // The type of mesh created depends on the type of media.
    Mesh mesh;
    // The sceneRenderer is set after GL initialization is complete.
    private SceneRenderer sceneRenderer;
    // The displaySurface is configured after both GL initialization and media loading.
    private Surface displaySurface;

    private CompositeDisposable disposables = new CompositeDisposable();

    private String mediaType;
    private int mediaWidth = 1280;
    private int mediaHeight = 720;

    private static File DOWNLOAD_DIR =
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);

    public MediaLoader(Context context) {
        this.context = context;
        final ArrayList<String> args = new ArrayList<>();
        args.add("-vvv");
        args.add("--no-spu"); // no subtitles
        args.add("--audio-time-stretch");
        args.add("--aout=opensles");
        args.add("--http-reconnect");
        args.add("--network-caching=" + 6 * 1000);

        mLibVLC = new LibVLC(context, args);
        mediaPlayer = new MediaPlayer(mLibVLC);
        mediaType = "image";
    }

    /**
     * Loads custom videos based on the Intent or load the default video. See the Javadoc for this
     * class for information on generating a custom intent via adb.
     */
    @SuppressLint("CheckResult")
    public void loadVideo(Uri uri) {
        resetMedia();
        // Load the bitmap in a background thread to avoid blocking the UI thread. This operation can
        // take 100s of milliseconds.
        // Note that this sample doesn't cancel any pending mediaLoaderTasks since it assumes only one
        // Intent will ever be fired for a single Activity lifecycle.
        //mediaLoaderTask = new MediaLoaderTask(uiView);
        //Log.d(TAG, uri.toString());
        //videoLoaderTask.execute(uri);
        Completable loadMediaTask = Completable.fromCallable(() -> {
            int stereoFormat = Mesh.MEDIA_MONOSCOPIC;

            mesh = Mesh.createUvSphere(
                    SPHERE_RADIUS_METERS, DEFAULT_SPHERE_ROWS, DEFAULT_SPHERE_COLUMNS,
                    DEFAULT_SPHERE_VERTICAL_DEGREES, DEFAULT_SPHERE_HORIZONTAL_DEGREES,
                    stereoFormat);

            //Log.d(TAG, "IN doInBackground: " + fileLocation[0].toString());

            try {

                //MediaPlayer mp = MediaPlayer.create(context, uri);
                synchronized (MediaLoader.this) {
                    // This needs to be synchronized with the methods that could clear mediaPlayer.
                    //mediaPlayer = mp;
                }
                //videoWidgetView.loadVideo(fileInformation[0].first, fileInformation[0].second);
            } catch (InvalidParameterException e) {
                // An error here is normally due to being unable to locate the file.
                // Since this is a background thread, we need to switch to the main thread to show a toast.
                Log.e(TAG, "Could not open video: " + e.getMessage());
            }
            //displayWhenReady();
            return true;
        });
        loadMediaTask.subscribeOn(Schedulers.io());
        loadMediaTask.subscribe(this::displayWhenReady,
                e -> Log.e(TAG, e.getMessage())
        );
    }

    public void loadImage(Uri uri) {
        resetMedia();
        mediaType = "image";
        int stereoFormat = Mesh.MEDIA_MONOSCOPIC;

        mesh = Mesh.createUvSphere(
                SPHERE_RADIUS_METERS, DEFAULT_SPHERE_ROWS, DEFAULT_SPHERE_COLUMNS,
                DEFAULT_SPHERE_VERTICAL_DEGREES, DEFAULT_SPHERE_HORIZONTAL_DEGREES,
                stereoFormat);

        Completable loadImageTask = Completable.fromCallable(() -> {
            mediaImage = BitmapFactory.decodeFile(uri.getPath());
            return true;
         }).subscribeOn(Schedulers.io());

         disposables.add(loadImageTask.subscribe(this::displayWhenReady));
    }

    public void clearScreen() {
        resetMedia();
    }

    public void stopVideo() {
        if (mediaPlayer != null) {
            synchronized (MediaLoader.this) {
                mediaPlayer.pause();
                //mediaPlayer.seekTo(0);
                isPaused = true;
            }
        }
    }

    public void startStream(String sdpUri) {
        resetMedia();

        mediaType = "video";
        mesh = Mesh.createUvSphere(
                SPHERE_RADIUS_METERS, DEFAULT_SPHERE_ROWS, DEFAULT_SPHERE_COLUMNS,
                DEFAULT_SPHERE_VERTICAL_DEGREES, DEFAULT_SPHERE_HORIZONTAL_DEGREES,
                Mesh.MEDIA_MONOSCOPIC);

        try {
            Log.e(TAG, "startStream()");
            //MediaPlayer mp = MediaPlayer.create(context, sdpUri);
            //MediaPlayer mp = new MediaPlayer();
            //Media media = new Media(mLibVLC, Uri.fromFile(new File(DOWNLOAD_DIR + "/stream.sdp" )));
            //Media media = new Media(mLibVLC, Uri.parse("http://192.168.0.174:3000/stream.sdp"));
            //media.setHWDecoderEnabled(true, true);
            //mediaPlayer.setMedia(media);
            //media.release();
            //MediaPlayer mp = MediaPlayer.create(this.context, Uri.parse("http://192.168.1.122:3000/stream.sdp"));
            //mp.setDataSource("http://192.168.1.122:3000/stream.sdp");
            //mp.setOnPreparedListener(MediaPlayer::start);
            //mp.prepare();
            displayWhenReady();
            //videoWidgetView.loadVideo(fileInformation[0].first, fileInformation[0].second);
        } catch (Exception e) {
            // An error here is normally due to being unable to locate the file.
            // Since this is a background thread, we need to switch to the main thread to show a toast.
            Log.e(TAG, "Could not open stream: " + e.getMessage());
            //startStream(uri);
        } /*catch (IOException e) {
            Log.e(TAG, "Could not open stream: " + e.getMessage());
        }*/
    }

    private void resetMedia() {
        if (mediaType.equals("video") && mediaPlayer != null) {
            synchronized (MediaLoader.this) {
                mediaPlayer.release();
                mediaPlayer = null;
                displaySurface.release();
                displaySurface = null;
            }
        }
        if (mediaType.equals("image") && mediaImage != null) {
            mediaImage.recycle();
            mediaImage = null;
            displaySurface.release();
            displaySurface = null;
        }
    }

    public void togglePlayback() {
        if (isPaused) {
            mediaPlayer.play();
        } else {
            mediaPlayer.pause();
        }
        isPaused = !isPaused;
    }

    /** Notifies MediaLoader that GL components have initialized. */
    public void onGlSceneReady(SceneRenderer sceneRenderer) {
        this.sceneRenderer = sceneRenderer;
        //displayWhenReady();
    }

    /**
     * Creates the 3D scene and load the media after sceneRenderer & mediaPlayer are ready. This can
     * run on the GL Thread or a background thread.
     */
    @MainThread
    private synchronized void displayWhenReady() {
        if (isDestroyed) {
            // This only happens when the Activity is destroyed immediately after creation.
            if (mediaPlayer != null) {
                mediaPlayer.release();
                mediaPlayer = null;
            }
            return;
        }

        if (displaySurface != null) {
            // Avoid double initialization caused by sceneRenderer & mediaPlayer being initialized before
            // displayWhenReady is executed.
            return;
        }

        if ((errorText == null && mediaImage == null &&
                mediaPlayer == null) || sceneRenderer == null) {
            // Wait for everything to be initialized.
            return;
        }

        // The important methods here are the setSurface & lockCanvas calls. These will have to happen
        // after the GLView is created.
        if (mediaType.equals("video") && mediaPlayer != null) {
            /*
            try {
                mediaPlayer.setDataSource(rtpUri);
                mediaPlayer.setOnErrorListener((mp, a, b) -> {
                    //displayWhenReady();
                    Log.e(TAG, "MP Error: (" + a + "," + b + ")");
                    return true;
                });
                mediaPlayer.setOnInfoListener((mp, what, extra) -> {
                    Log.e(TAG, "INFO: " + what + " EXTRA: " + extra);
                    return true;
                });
                displaySurface = sceneRenderer.createDisplay(
                        mediaPlayer.getVideoWidth(), mediaPlayer.getVideoHeight(), mesh);
                mediaPlayer.setSurface(displaySurface);
                mediaPlayer.prepare();
            } catch (Exception e) {
                Log.e(TAG, "Couldn't prepare stream: " + e.getMessage());
                //displayWhenReady();
            }*/
            // Start playback.
            //mediaPlayer.setLooping(true);

            //Media.VideoTrack track = mediaPlayer.getCurrentVideoTrack();
            /*
            displaySurface = sceneRenderer.createDisplay(
                    mediaWidth, mediaHeight, mesh);

            //mediaPlayer.setSurface(displaySurface);
            mediaPlayer.getVLCVout().setVideoSurface(displaySurface, null);
            mediaPlayer.getVLCVout().setWindowSize(mediaWidth, mediaHeight);
            mediaPlayer.getVLCVout().attachViews();*/

            //mediaPlayer.setVolume(0,0);
            //mediaPlayer.setOnCompletionListener((m) -> {
                //mediaPlayer.seekTo(0);
                //isPaused = true;
            //});

            Media media = new Media(mLibVLC, Uri.parse("http://192.168.1.123:3000/stream.sdp"));
            media.addOption(":no-spu");
            media.addOption(":start-time=0");
            media.parse();

            Log.e(TAG, "TRACKS: " + media.getTrackCount());

            displaySurface = sceneRenderer.createDisplay(
                    mediaWidth, mediaHeight, mesh);

            mediaPlayer.getVLCVout().setWindowSize(mediaWidth, mediaHeight);
            mediaPlayer.getVLCVout().setVideoSurface(displaySurface, null);
            mediaPlayer.getVLCVout().addCallback(this);
            mediaPlayer.getVLCVout().attachViews(this);
            mediaPlayer.setVideoTrackEnabled(true);

            //media.addOption(":codec=mediacodec_ndk,mediacodec_jni,none");

            //Media media = new Media(mLibVLC, Uri.fromFile(new File(DOWNLOAD_DIR + "/stream.sdp" )));

            //Media media = new Media(mLibVLC, Uri.parse("http://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_640x360.m4v"));

            mediaPlayer.setMedia(media);
            Log.e(TAG, "IS MEDIA PARSED?: " + media.isParsed());
            media.release();
            Log.d(TAG, "Mediaplayer loaded");
            mediaPlayer.play();
            /*
            Disposable d = Observable.timer(5, TimeUnit.SECONDS)
                .subscribe(i -> {
                    if (mediaPlayer.getVLCVout().areViewsAttached()) {
                        Log.e(TAG, "Play CMD");
                        mediaPlayer.play();
                    }
            });*/
            //mediaPlayer.pause();
        } else if (mediaType.equals("image") && mediaImage != null) {
            Log.d(TAG, "image loaded");
            // For images, acquire the displaySurface and draw the bitmap to it. Since our Mesh class uses
            // an GL_TEXTURE_EXTERNAL_OES texture, it's possible to perform this decoding and rendering of
            // a bitmap in the background without stalling the GL thread. If the Mesh used a standard
            // GL_TEXTURE_2D, then it's possible to stall the GL thread for 100+ ms during the
            // glTexImage2D call when loading 4k x 4k panoramas and copying the bitmap's data.
            displaySurface = sceneRenderer.createDisplay(
                    mediaImage.getWidth(), mediaImage.getHeight(), mesh);
            Canvas c = displaySurface.lockCanvas(null);
            c.drawBitmap(mediaImage, 0, 0, null);
            displaySurface.unlockCanvasAndPost(c);
        } else {
            // Handle the error case by creating a placeholder panorama.
            mesh = Mesh.createUvSphere(
                    SPHERE_RADIUS_METERS, DEFAULT_SPHERE_ROWS, DEFAULT_SPHERE_COLUMNS,
                    DEFAULT_SPHERE_VERTICAL_DEGREES, DEFAULT_SPHERE_HORIZONTAL_DEGREES,
                    Mesh.MEDIA_MONOSCOPIC);

            // 4k x 2k is a good default resolution for monoscopic panoramas.
            displaySurface = sceneRenderer.createDisplay(
                    2 * DEFAULT_SURFACE_HEIGHT_PX, DEFAULT_SURFACE_HEIGHT_PX, mesh);
            // Render placeholder grid and error text.
            Canvas c = displaySurface.lockCanvas(null);
            renderEquirectangularGrid(c, errorText);
            displaySurface.unlockCanvasAndPost(c);
        }
    }

    /**
     * Renders a placeholder grid with optional error text.
     */
    private static void renderEquirectangularGrid(Canvas canvas, String message) {
        // Configure the grid. Each square will be 15 x 15 degrees.
        final int width = canvas.getWidth();
        final int height = canvas.getHeight();
        // This assumes a 4k resolution.
        final int majorWidth = width / 256;
        final int minorWidth = width / 1024;
        final Paint paint = new Paint();

        // Draw a black ground & gray sky background
        paint.setColor(Color.BLACK);
        canvas.drawRect(0, height / 2, width, height, paint);
        paint.setColor(Color.GRAY);
        canvas.drawRect(0, 0, width, height / 2, paint);

        // Render the grid lines.
        paint.setColor(Color.WHITE);

        for (int i = 0; i < DEFAULT_SPHERE_COLUMNS; ++i) {
            int x = width * i / DEFAULT_SPHERE_COLUMNS;
            paint.setStrokeWidth((i % 3 == 0) ? majorWidth : minorWidth);
            canvas.drawLine(x, 0, x, height, paint);
        }

        for (int i = 0; i < DEFAULT_SPHERE_ROWS; ++i) {
            int y = height * i / DEFAULT_SPHERE_ROWS;
            paint.setStrokeWidth((i % 3 == 0) ? majorWidth : minorWidth);
            canvas.drawLine(0, y, width, y, paint);
        }

        // Render optional text.
        if (message != null) {
            paint.setTextSize(height / 64);
            paint.setColor(Color.RED);
            float textWidth = paint.measureText(message);

            canvas.drawText(
                    message,
                    width / 2 - textWidth / 2, // Horizontally center the text.
                    9 * height / 16, // Place it slightly below the horizon for better contrast.
                    paint);
        }
    }

    @MainThread
    public synchronized void pause() {
        disposables.dispose();
        if (mediaPlayer != null) {
            mediaPlayer.pause();
            isPaused = true;
        }
    }

    @MainThread
    public synchronized void resume() {
        if (mediaPlayer != null && !isPaused) {
            mediaPlayer.play();
        }
    }

    /** Tears down MediaLoader and prevents further work from happening. */
    @MainThread
    public synchronized void destroy() {
        mLibVLC.release();
        disposables.dispose();
        if (mediaPlayer != null) {
            mediaPlayer.stop();
            mediaPlayer.release();
            mediaPlayer = null;
        }
        isDestroyed = true;
    }

    @Override
    public void onSurfacesCreated(IVLCVout vlcVout) {

    }

    @Override
    public void onNewVideoLayout(IVLCVout vout, int width, int height, int visibleWidth, int visibleHeight, int sarNum, int sarDen) {
        Log.e(TAG, "NewLayout: " + width + " x " + height);
        if (width * height == 0)
            return;

        setSize(width, height);
    }

    @Override
    public void onSurfacesDestroyed(IVLCVout vlcVout) {

    }

    private void setSize(int width, int height) {
        mediaWidth = width;
        mediaHeight = height;
        if (mediaWidth * mediaHeight <= 1)
            return;

        if(displaySurface == null)
            return;

        // get screen size
        int w = 1440;
        int h = 2960;

        float videoAR = (float) mediaWidth / (float) mediaHeight;
        float screenAR = (float) w / (float) h;

        if (screenAR < videoAR)
            h = (int) (w / videoAR);
        else
            w = (int) (h * videoAR);

        mediaPlayer.getVLCVout().setWindowSize(w, h);
    }
}

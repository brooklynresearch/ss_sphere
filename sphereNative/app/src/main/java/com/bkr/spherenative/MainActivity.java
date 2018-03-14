package com.bkr.spherenative;

import android.Manifest;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.support.v4.app.ActivityCompat.OnRequestPermissionsResultCallback;
import android.support.v4.content.FileProvider;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AlertDialog;
import android.text.InputType;
import android.util.Log;
import android.support.v4.app.ActivityCompat;
import android.support.v7.app.AppCompatActivity;
import android.util.Pair;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.net.URISyntaxException;
import java.util.Date;
import java.util.concurrent.TimeUnit;

import io.reactivex.Observer;
import io.reactivex.Single;
import io.reactivex.SingleObserver;
import io.reactivex.android.schedulers.AndroidSchedulers;
import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.disposables.Disposable;

import io.reactivex.schedulers.Schedulers;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

public class MainActivity extends AppCompatActivity
        implements OnRequestPermissionsResultCallback {

    public static Activity activity;

    private long refId;
    private Socket socket;

    private MonoscopicView videoView;

    private SyncTimer timer = new SyncTimer();
    private CompositeDisposable disposables;

    private DatagramListener dgramListener;

    private String apk_filename;

    String TAG = "sphere-native";

    //*******************************************
    String SERVER_IP_ADDRESS = "192.168.1.123";
    //*******************************************

    int btnCounter = 0;
    private String spherePosition;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        activity = this;
        super.onCreate(savedInstanceState);
        //Remove title bar
        this.requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_main);

        final Button button = findViewById(R.id.secret_button);
        button.setVisibility(View.VISIBLE);
        button.setBackgroundColor(Color.TRANSPARENT);
        button.setOnClickListener(v -> {
            btnCounter++;
            if (btnCounter == 5) {
                Log.d(TAG, "Button Press");
                btnCounter = 0;
                showPositionDialog();
            }
        });

        disposables = new CompositeDisposable();

        timer.setServer(SERVER_IP_ADDRESS);
        //timer.startSync();

        dgramListener = new DatagramListener();

        videoView = (MonoscopicView) findViewById(R.id.video_view);
        videoView.initialize();

        String[] permissions = {Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE};

        if(!hasPermissions(this, permissions)) {
            ActivityCompat.requestPermissions(this, permissions, 1);
        } else {
            checkFile();
            startWebsocket();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == 1) {
            // Request for camera permission.
            if (grantResults.length >= 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permission has been granted. Start camera preview Activity.
                Log.d(TAG, "Permission Granted. Starting File check");
                checkFile();
            } else {
                // Permission request was denied.
                Log.e(TAG, "Permission Denied. Doing nothing");
            }
        }
    }

    BroadcastReceiver onComplete = new BroadcastReceiver() {
        public void onReceive(Context ctxt, Intent intent) {
            //long referenceId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            //Log.e("IN", "" + referenceId);

            Log.d(TAG,"Download Complete");
            checkFile();
        }
    };

    public static boolean hasPermissions(Context context, String... permissions) {
        if (context != null && permissions != null) {
            for (String permission : permissions) {
                if (ActivityCompat.checkSelfPermission(context, permission) != PackageManager.PERMISSION_GRANTED) {
                    return false;
                }
            }
        }
        return true;
    }

    private boolean checkFile() {
        File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!fileExists(downloadDir, "movie.mp4")) {
            Log.d(TAG, "File not found. Starting download...");
            startDownload();
            return false;
        } else {
            Log.d(TAG, "File found. Loading into videoview");

            Uri fileUri = Uri.fromFile(new File(downloadDir + "/movie.mp4"));

            videoView.loadMedia(fileUri);

            // FUCK IT
            Single<Long> timer = Single.timer(2000, TimeUnit.MILLISECONDS, Schedulers.newThread());
            timer.observeOn(AndroidSchedulers.mainThread());
            timer.subscribe(new SingleObserver<Long>() {
                @Override
                public void onSubscribe(Disposable d) {
                    disposables.add(d);
                }

                @Override
                public void onSuccess(Long aLong) {
                    startDgramListener();
                }

                @Override
                public void onError(Throwable e) {

                }
            });

            return true;
        }
    }

    private void startDownload() {
        DownloadManager downloadManager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        Uri download_uri = Uri.parse("http://" + SERVER_IP_ADDRESS + ":8081/moviefiles/movie.mp4");

        registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));

        DownloadManager.Request req = new DownloadManager.Request(download_uri);
        req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "/" + "movie" + ".mp4");

        refId = downloadManager.enqueue(req); // might need this who knows
    }

    private boolean fileExists(File path, String filename) {
        return new File(path, filename).exists();
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Prevent the view from rendering continuously when in the background.
        videoView.onPause();
        // If the video is playing when onPause() is called, the default behavior will be to pause
        // the video and keep it paused when onResume() is called.
        timer.stopSync();
    }

    @Override
    protected void onResume() {
        this.getSupportActionBar().hide();
        super.onResume();
        timer.startSync();

        //Hide status and action bars
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);

        // Resume the 3D rendering.
        videoView.onResume();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        socket.disconnect();
        dgramListener.stop();
        timer.stopSync();
        videoView.destroy();
        disposables.dispose();
        unregisterReceiver(onComplete);
    }

    private void showPositionDialog() {
        final EditText positionTxt = new EditText(this);

        // Set the default text to a link of the Queen
        positionTxt.setHint("0101");
        positionTxt.setInputType(InputType.TYPE_CLASS_NUMBER);

        new AlertDialog.Builder(this)
                .setTitle("Set Position")
                .setMessage("Enter four digits to set phone position")
                .setView(positionTxt)
                .setPositiveButton("Save", (dialog, whichButton) -> {
                    String position = positionTxt.getText().toString();
                    Log.d(TAG, "Setting position: " + position);
                    videoView.setSpherePosition(position);
                })
                .setNegativeButton("Cancel", (dialog, whichButton) -> {

                })
                .show();
    }

    private void togglePause() {
        videoView.togglePlayback();
    }

    private void startWebsocket() {
        try {
            socket = IO.socket("http://" + SERVER_IP_ADDRESS + ":8080");
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
        socket.on(Socket.EVENT_CONNECT, args -> {
            Log.d(TAG, "Websocket connected");
            //socket.emit("foo", "hi");
            //socket.disconnect();
        }).on("toggle-play", args -> {
            Log.d(TAG, "toggle-play message received");
            JSONObject data = (JSONObject) args[0];
            String serverTime;
            String delay;
            try {
                serverTime = data.getString("timestamp");
                delay = data.getString("delay");
            } catch (JSONException e) {
                Log.e(TAG, e.getMessage());
                return;
            }
            long triggerTarget = Long.parseLong(serverTime) + Integer.parseInt(delay);

            timer.setTrigger(triggerTarget, new SingleObserver<Long>() {
                @Override
                public void onSubscribe(Disposable d) {
                    disposables.add(d);
                }

                @Override
                public void onSuccess(Long aLong) {
                    togglePause();
                }

                @Override
                public void onError(Throwable e) {
                    Log.e(TAG, "Error in trigger observer: " + e.getMessage());
                }
            });
        }).on("newtable", args -> {
            videoView.setPositionTable( (JSONObject)args[0] );
        }).on("update-apk", args -> {
            Log.d(TAG, "CMD NEW APK");
            updateApk();
            //new ApkUpdateTask().execute("http://" + SERVER_IP_ADDRESS + ":3000/sphere.apk");
        }).on(Socket.EVENT_DISCONNECT, args -> Log.d(TAG, "Websocket disconnected"));
        socket.connect();
    }

    private void startDgramListener() {
        dgramListener.listen(new Observer<Integer>() {
            @Override
            public void onSubscribe(Disposable d) {
                disposables.add(d);
            }

            @Override
            public void onNext(Integer i) {
                Pair<Float, Float> srcRange = new Pair<>(0.0f, 39000.0f);
                Pair<Float,Float> dstRange = new Pair<>(0.0f, 360.0f);
                float angle = convertToRange(i, srcRange, dstRange) - 180.0f;
                //Log.d(TAG, "Setting yaw: " + Float.toString(angle));
                videoView.setYawAngle(angle);
            }

            @Override
            public void onError(Throwable e) {
                Log.e(TAG, e.getMessage());
            }

            @Override
            public void onComplete() {

            }
        });
    }

    private float convertToRange(float value, Pair<Float, Float> srcRange, Pair<Float, Float> dstRange) {
        float srcMax = srcRange.second - srcRange.first;
        float dstMax = dstRange.second - dstRange.first;
        float adjValue = value - srcRange.first;

        return  (adjValue * dstMax / srcMax) + dstRange.first;
    }

    private void updateApk() {
        //File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);

        DownloadManager downloadManager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
        Uri download_uri = Uri.parse("http://" + SERVER_IP_ADDRESS + ":3000/sphere.apk");

        registerReceiver(onApkComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));

        DownloadManager.Request req = new DownloadManager.Request(download_uri);
        long t = new Date().getTime();
        apk_filename = "/sphere-" + t + ".apk";
        req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, apk_filename);
        req.setTitle("sphere.apk");

        downloadManager.enqueue(req);
    }

    BroadcastReceiver onApkComplete = new BroadcastReceiver() {
        public void onReceive(Context ctxt, Intent intent) {
            //long referenceId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            //Log.e("IN", "" + referenceId);

            Log.d(TAG,"APK Download Complete");
            Log.d(TAG, "INSTALLING APK");

            //String path = Environment.getExternalStorageDirectory()+"/sphere.apk";


            File toInstall = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), apk_filename);
            Uri apkUri = FileProvider.getUriForFile(activity, BuildConfig.APPLICATION_ID + ".provider", toInstall);

            //String destination = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS) + "/";
            //String fileName = "sphere.apk";
            //destination += fileName;
            //final Uri apkUri = Uri.parse("file://" + destination);

            Intent newIntent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
            //Intent newIntent = new Intent(Intent.ACTION_VIEW);
            //newIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            newIntent.setData(apkUri);
            newIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            newIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(newIntent);

            unregisterReceiver(this);
            finish();
        }
    };
}

package com.bkr.spherenative.Display360;

import android.content.Context;
import android.net.Uri;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import android.support.annotation.AnyThread;
import android.support.annotation.BinderThread;
import android.support.annotation.UiThread;
import android.util.AttributeSet;
import android.util.Log;

import com.google.vr.sdk.base.Eye.Type;
import com.bkr.spherenative.Display360.rendering.SceneRenderer;

import org.json.JSONException;
import org.json.JSONObject;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/**
 * Created by tarvu on 2/19/18.
 */

public final class MonoscopicView extends GLSurfaceView {
    // We handle all the sensor orientation detection ourselves.
    //private SensorManager sensorManager;
    //private Sensor orientationSensor;
    //private PhoneOrientationListener phoneOrientationListener;
    String TAG = "MonoscopicView";

    private MediaLoader mediaLoader;
    private Renderer renderer;

    JSONObject positionTable;
    String position;

    //long and lat values in positionTable
    float positionYaw = 10;
    float positionPitch = 20;

    private boolean isPaused = true; // we start with video paused

    /** Inflates a standard GLSurfaceView. */
    public MonoscopicView(Context context, AttributeSet attributeSet) {
        super(context, attributeSet);
        setPreserveEGLContextOnPause(true);
    }

    public void togglePlayback() {
        mediaLoader.togglePlayback();
    }

    /**
     * Finishes initialization. This should be called immediately after the View is inflated.
     *
     *the video UI that should be bound to the underlying SceneRenderer
     */
    public void initialize() {
        //this.uiView = uiView;
        mediaLoader = new MediaLoader(getContext());

        // Configure OpenGL.
        renderer = new Renderer(mediaLoader);
        setEGLContextClientVersion(2);
        setRenderer(renderer);
        setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
    }

    /** Starts the sensor & video only when this View is active. */
    @Override
    public void onResume() {
        super.onResume();
        // Use the fastest sensor readings.
        //sensorManager.registerListener(
                //phoneOrientationListener, orientationSensor, SensorManager.SENSOR_DELAY_FASTEST);
        mediaLoader.resume();
    }

    /** Stops the sensors & video when the View is inactive to avoid wasting battery. */
    @Override
    public void onPause() {
        mediaLoader.pause();
        //sensorManager.unregisterListener(phoneOrientationListener);
        super.onPause();
    }

    /** Destroys the underlying resources. If this is not called, the MediaLoader may leak. */
    public void destroy() {
        //uiView.setMediaPlayer(null);
        mediaLoader.destroy();
    }

    /** Parses the Intent and loads the appropriate media. */

    public void loadVideo(Uri fileUri) {
        Log.d("Monoscopic", fileUri.toString());
        mediaLoader.loadVideo(fileUri);
    }

    public void loadImage(Uri fileUri) {
        mediaLoader.loadImage(fileUri);
    }

    public void initVideoStream(String uri) {
        mediaLoader.startStream(uri);
    }

    public void setPositionTable(JSONObject table) {
        positionTable = table;
        Log.d(TAG, "position table: " + positionTable.toString());
    }

    public void setSpherePosition(String pos) {
        position = pos;
        try {
            JSONObject positionEntry = positionTable.getJSONObject(pos);
            positionYaw += (float) positionEntry.getDouble("long");
            positionPitch += (float) positionEntry.getDouble("lat");
            renderer.setPitchOffset(positionPitch);
        } catch (JSONException e) {
            Log.e(TAG, "JSON Error: " + e.getMessage());
        }
    }

    public void setYawAngle(float angle) {
        renderer.setYawOffset(-positionYaw - angle);
    }

    /**
     * Standard GL Renderer implementation. The notable code is the matrix multiplication in
     * onDrawFrame and updatePitchMatrix.
     */
    static class Renderer implements GLSurfaceView.Renderer {
        private final SceneRenderer scene = SceneRenderer.createFor2D();

        // Arbitrary vertical field of view. Adjust as desired.
        private static final int FIELD_OF_VIEW_DEGREES = 15;
        private static final float Z_NEAR = .1f;
        private static final float Z_FAR = 100;
        private final float[] projectionMatrix = new float[16];

        // There is no model matrix for this scene so viewProjectionMatrix is used for the mvpMatrix.
        private final float[] viewProjectionMatrix = new float[16];

        // Device orientation is derived from sensor data. This is accessed in the sensor's thread and
        // the GL thread.
        private final float[] deviceOrientationMatrix = new float[16];

        // Optional pitch and yaw rotations are applied to the sensor orientation. These are accessed on
        // the UI, sensor and GL Threads.
        private final float[] touchPitchMatrix = new float[16];
        private final float[] touchYawMatrix = new float[16];
        private float touchPitch;
        private float deviceRoll;

        // viewMatrix = touchPitch * deviceOrientation * touchYaw.
        private final float[] viewMatrix = new float[16];
        private final float[] tempMatrix = new float[16];

        //private final VideoUiView uiView;
        private final MediaLoader mediaLoader;

        public Renderer(MediaLoader mediaLoader) {
            Matrix.setIdentityM(deviceOrientationMatrix, 0);
            Matrix.setIdentityM(touchPitchMatrix, 0);
            Matrix.setIdentityM(touchYawMatrix, 0);
            //this.uiView = uiView;
            this.mediaLoader = mediaLoader;
        }

        @Override
        public void onSurfaceCreated(GL10 gl, EGLConfig config) {
            scene.glInit();
            //if (uiView != null) {
              //  scene.setVideoFrameListener(uiView.getFrameListener());
            //}
            mediaLoader.onGlSceneReady(scene);
        }

        @Override
        public void onSurfaceChanged(GL10 gl, int width, int height) {
            GLES20.glViewport(0, 0, width, height);
            Matrix.perspectiveM(
                    projectionMatrix, 0, FIELD_OF_VIEW_DEGREES,
                    (float) width / height, Z_NEAR, Z_FAR);
        }

        @Override
        public void onDrawFrame(GL10 gl) {
            // Combine touch & sensor data.
            // Orientation = pitch * sensor * yaw since that is closest to what most users expect the
            // behavior to be.
            synchronized (this) {
                Matrix.multiplyMM(tempMatrix, 0, deviceOrientationMatrix, 0,
                        touchYawMatrix, 0);
                Matrix.multiplyMM(viewMatrix, 0, touchPitchMatrix, 0,
                        tempMatrix, 0);
            }

            Matrix.multiplyMM(viewProjectionMatrix, 0, projectionMatrix, 0,
                    viewMatrix, 0);
            scene.glDrawFrame(viewProjectionMatrix, Type.MONOCULAR);
        }

        /** Adjusts the GL camera's rotation based on device rotation. Runs on the sensor thread. */
        @BinderThread
        public synchronized void setDeviceOrientation(float[] matrix, float deviceRoll) {
            System.arraycopy(matrix, 0, deviceOrientationMatrix, 0,
                    deviceOrientationMatrix.length);

            this.deviceRoll = -deviceRoll;
            updatePitchMatrix();
        }

        /**
         * Updates the pitch matrix after a physical rotation or touch input. The pitch matrix rotation
         * is applied on an axis that is dependent on device rotation so this must be called after
         * either touch or sensor update.
         */
        @AnyThread
        private void updatePitchMatrix() {
            // The camera's pitch needs to be rotated along an axis that is parallel to the real world's
            // horizon. This is the <1, 0, 0> axis after compensating for the device's roll.
            Matrix.setRotateM(touchPitchMatrix, 0,
                    -touchPitch, (float) Math.cos(deviceRoll), (float) Math.sin(deviceRoll), 0);
        }

        /** Set the pitch offset matrix. */
        @UiThread
        public synchronized void setPitchOffset(float pitchDegrees) {
            touchPitch = pitchDegrees;
            updatePitchMatrix();
        }

        /** Set the yaw offset matrix. */
        @UiThread
        public synchronized void setYawOffset(float yawDegrees) {
            Matrix.setRotateM(touchYawMatrix, 0, -yawDegrees, 0, 1, 0);
        }
    }
}


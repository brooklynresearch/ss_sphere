package com.bkr.spherenative;

import android.content.Context;
import android.net.Uri;
import android.opengl.GLSurfaceView;
import android.util.AttributeSet;
import android.util.Log;
import android.util.Pair;

import org.json.JSONException;
import org.json.JSONObject;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class SurfaceView2D extends GLSurfaceView {

    private String TAG = "SufaceView2d";

    private Renderer renderer;

    private JSONObject parameterTable = null;
    private String position = "0601";

    private float MAX_ENCODER_VAL = 39000.0f;
    private float N_REPETITIONS = 1;
    private float HEIGHT_PROPORTION = 1/11f; //default full height
    private float WIDTH_SCALE = 0.75f; //default 4:3 ratio
    private String REPEAT_TYPE = "mirror";

    public SurfaceView2D(Context context, AttributeSet attributeSet) {
        super(context, attributeSet);
        setEGLContextClientVersion(2);
        setPreserveEGLContextOnPause(true);
    }

    public boolean initialize() {
        // Configure OpenGL.
        renderer = new Renderer();
        setRenderer(renderer);
        setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
        return true;
    }

    public void setParameterTable(JSONObject table) {
        parameterTable = table;
        Log.d(TAG, "parameter table: " + parameterTable.toString());
        try {
            N_REPETITIONS = table.getInt("num_repeats");
            REPEAT_TYPE = table.getString("repeat_type");
            MAX_ENCODER_VAL = (float)table.getDouble("encoder_max");
            HEIGHT_PROPORTION = (float)table.getDouble("height_proportion");
            WIDTH_SCALE = (float)table.getDouble("width_scale");
            renderer.setParams(HEIGHT_PROPORTION, WIDTH_SCALE);
        } catch (JSONException e) {
            Log.e(TAG, "JSON Error: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void updatePosition(String posStr, float newRow, float newCol) {
        // fix crash when reassigning same position
        if (!position.equals(posStr)) {
            position = posStr;
            renderer.setDevicePosition(newRow, newCol);
        }
    }

    public String getPosition() {
        return position;
    }

    public void updateRotation(float newRotation) {
        if (newRotation >= 0 && newRotation <= MAX_ENCODER_VAL) {
            renderer.setRotation(mapToRotationRange(newRotation));
        }
    }

    private float mapToRotationRange(float value) {
        Pair<Float, Float> srcRange = new Pair<>(0.0f, MAX_ENCODER_VAL);
        Pair<Float, Float> dstRange = new Pair<>(0.0f, N_REPETITIONS);
        float srcMax = srcRange.second - srcRange.first;
        float dstMax = dstRange.second - dstRange.first;
        float adjValue = value - srcRange.first;

        return  (adjValue * dstMax / srcMax) + dstRange.first;
    }

    public void setTexture(Uri fileUri) {
        //initialize();
        //Needs to run on gl thread
        queueEvent(() -> renderer.setTexture(fileUri, REPEAT_TYPE));
    }

    @Override
    public void onResume() {
        super.onResume();
    }

    @Override
    public void onPause() {
        super.onPause();
    }

    static class Renderer implements GLSurfaceView.Renderer {

        private GLCanvas canvas;
        private Uri textureUri;
        private String savedRepeatType;
        private float savedHeightProportion = 1/11f;
        private float savedWidthScale = 0.75f;
        private float savedRow = 6f;
        private float savedCol = 1f;

        @Override
        public void onSurfaceCreated(GL10 gl, EGLConfig config) {
            canvas = new GLCanvas(savedHeightProportion, savedWidthScale);
            if (textureUri != null) {
                canvas.loadTexture(textureUri, savedRepeatType);
            }

            if (savedRow > 0 && savedCol > 0) {
                canvas.setDevicePosition(savedRow, savedCol);
            }
        }

        @Override
        public void onSurfaceChanged(GL10 gl, int width, int height) {

        }

        @Override
        public void onDrawFrame(GL10 gl) {
            canvas.draw();
        }

        public void setTexture(Uri fileUri, String repeatType) {
            if (canvas != null) {
                canvas.loadTexture(fileUri, repeatType);
            } else {
                textureUri = fileUri;
                savedRepeatType = repeatType;
            }
        }

        public void setRotation(float newRotation) {
            canvas.setRotation(newRotation);
        }

        public void setParams(float heightProportion, float widthScale) {
            if (canvas != null) {
                canvas.setParams(heightProportion, widthScale);
            } else {
                savedHeightProportion = heightProportion;
                savedWidthScale = widthScale;
            }
        }

        public void setDevicePosition(float row, float col) {
            if (canvas != null) {
                canvas.setDevicePosition(row, col);
            } else { //In case the server sends a saved position for this device before canvas is ready
                savedRow = row;
                savedCol = col;
            }
        }
    }
}

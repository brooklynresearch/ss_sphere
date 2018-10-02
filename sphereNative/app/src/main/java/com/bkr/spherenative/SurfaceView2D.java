package com.bkr.spherenative;

import android.content.Context;
import android.net.Uri;
import android.opengl.GLSurfaceView;
import android.util.AttributeSet;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class SurfaceView2D extends GLSurfaceView {

    private String TAG = "SufaceView2d";

    private Renderer renderer;

    private JSONObject positionTable = null;
    private String position = "0601";

    public SurfaceView2D(Context context, AttributeSet attributeSet) {
        super(context, attributeSet);
        setEGLContextClientVersion(2);
        setPreserveEGLContextOnPause(true);
    }

    public void initialize() {
        // Configure OpenGL.
        renderer = new Renderer();
        setRenderer(renderer);
        setRenderMode(GLSurfaceView.RENDERMODE_CONTINUOUSLY);
    }

    public void setPositionTable(JSONObject table) {
        positionTable = table;
        Log.d(TAG, "position table: " + positionTable.toString());

        //updatePosition();
    }

    public void updatePosition(String newPos) {
        position = newPos;
        String rowStr = newPos.substring(0,2);
        String colStr = newPos.substring(2,4);
        renderer.setDevicePosition(Float.parseFloat(rowStr), Float.parseFloat(colStr));
    }

    public String getPosition() {
        return position;
    }

    public void updateRotation(float newRotation) {
        renderer.setRotation(newRotation);
    }

    public void setTexture(Uri fileUri) {
        renderer.setTexture(fileUri);
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
        private float savedRow = 0;
        private float savedCol = 0;

        @Override
        public void onSurfaceCreated(GL10 gl, EGLConfig config) {
            canvas = new GLCanvas();
            if (textureUri != null) {
                canvas.loadTexture(textureUri);
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

        public void setTexture(Uri fileUri) {
            textureUri = fileUri;
            //canvas.loadTexture(fileUri);
        }

        public void setRotation(float newRotation) {
            canvas.setRotation(newRotation);
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

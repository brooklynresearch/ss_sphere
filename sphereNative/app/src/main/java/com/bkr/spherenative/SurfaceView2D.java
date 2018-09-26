package com.bkr.spherenative;

import android.content.Context;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.util.AttributeSet;
import android.util.Log;

import com.bkr.spherenative.Display360.rendering.SceneRenderer;

import org.json.JSONException;
import org.json.JSONObject;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class SurfaceView2D extends GLSurfaceView {

    private String TAG = "SufaceView2d";

    private Renderer renderer;

    private JSONObject positionTable = null;
    private String position = "0101";

    //long and lat values in positionTable
    float startYaw = 10;
    float startPitch = 20;
    float positionYaw;
    float positionPitch;

    public SurfaceView2D(Context context, AttributeSet attributeSet) {
        super(context, attributeSet);
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

        updatePosition();
    }

    private void updatePosition() {
        if (positionTable == null) return;
        try {
            JSONObject positionEntry = positionTable.getJSONObject(position);
            //positionYaw = startYaw + (float) positionEntry.getDouble("long");
            //positionPitch = startPitch + (float) positionEntry.getDouble("lat");
            //renderer.setPitchOffset(positionPitch);
            //setYawAngle(positionYaw);
        } catch (JSONException e) {
            Log.e(TAG, "JSON Error: " + e.getMessage());
        }
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
        private final SceneRenderer scene = SceneRenderer.createFor2D();

        @Override
        public void onSurfaceCreated(GL10 gl, EGLConfig config) {

        }

        @Override
        public void onSurfaceChanged(GL10 gl, int width, int height) {

        }

        @Override
        public void onDrawFrame(GL10 gl) {

        }
    }
}

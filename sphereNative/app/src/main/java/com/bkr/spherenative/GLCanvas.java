package com.bkr.spherenative;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.opengl.GLES20;
import android.opengl.GLUtils;
import android.util.Log;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.nio.ShortBuffer;

import static android.opengl.GLES20.glCreateProgram;
import static android.opengl.GLES20.glGetError;

public class GLCanvas {
    private String TAG = "GLCanvas";

    private float DEVICE_ASPECT = 18.5f / 9f; // multiplying width by this would make square 1:1 aspect
    private float TEXTURE_WIDTH_SCALE = 0.75f;

    private float DEVICE_HEIGHT_PROPORTION;
    private float DEVICE_WIDTH_PROPORTION;

    private float DEVICE_ROW = 6f;
    private float DEVICE_COL = 1f;

    private int REPEAT_TYPE = GLES20.GL_MIRRORED_REPEAT;

    private int TEXTURE_ID = 0;

    private float ROTATION = 0; //set via rotary encoder

    private FloatBuffer vertexBuffer;
    private FloatBuffer texCoordBuffer;
    private ShortBuffer drawListBuffer;

    // number of coordinates per vertex in this array
    private static final int COORDS_PER_VERTEX = 3;
    private static float squareCoords[] = {
            -1.0f,  1.0f, 0.0f,   // top left
            -1.0f, -1.0f, 0.0f,   // bottom left
            1.0f, -1.0f, 0.0f,   // bottom right
            1.0f,  1.0f, 0.0f }; // top right

    private static float texCoords[] = {  //have to flip Y axis because bitmap coords go top -> bottom
        0.0f, 0.0f, // top left
        0.0f, 1.0f, // bottom left
        1.0f, 1.0f, // bottom right
        1.0f, 0.0f, // top right
    };

    private short drawOrder[] = { 0, 1, 2, 0, 2, 3 }; // order to draw vertices

    private int positionHandle;
    //private int colorHandle;
    private int texUniformHandle;
    private int texCoordHandle;

    //float color[] = { 0.63671875f, 0.22265625f, 0.76953125f, 1.0f };

    //Number of phone widths to indent on the left side. Indexed by row num
    private float rowOffsets[] = {3,2,1,0.5f,0.5f,0,0.5f,0.5f,1,2,3};

    private float LEFT_OFFSET = rowOffsets[Math.round(DEVICE_ROW)-1]/DEVICE_WIDTH_PROPORTION;

    private final int vertexCount = squareCoords.length / COORDS_PER_VERTEX;
    private final int vertexStride = COORDS_PER_VERTEX * 4; // 4 bytes per vertex


    private final String vertexShaderCode =
            "attribute vec4 vPosition;" +
            "attribute vec2 aTexCoordinate;" +
            "varying vec2 vTexCoordinate;" +
                    "void main() {" +
                    "  vTexCoordinate = aTexCoordinate;" +
                    "  gl_Position = vPosition;" +
                    "}";

    private final String fragmentShaderCode =
            "precision mediump float;" +
            "uniform sampler2D uTexture;" +
            "varying vec2 vTexCoordinate;" +
            //"uniform vec4 vColor;" +
                    "void main() {" +
                    "  gl_FragColor = texture2D(uTexture, vTexCoordinate);" +
                    "}";

    private final int program;
    private final int[] textureIds = new int[10];
    private int currentTexturepos = 0;

    public GLCanvas(float heightProportion, float widthScale) {
        DEVICE_HEIGHT_PROPORTION = heightProportion;
        TEXTURE_WIDTH_SCALE = widthScale;
        DEVICE_WIDTH_PROPORTION = heightProportion * (1/DEVICE_ASPECT) * TEXTURE_WIDTH_SCALE;
        // initialize vertex byte buffer for shape coordinates
        ByteBuffer bb = ByteBuffer.allocateDirect(
                // (# of coordinate values * 4 bytes per float)
                squareCoords.length * 4);
        // use the device hardware's native byte order
        bb.order(ByteOrder.nativeOrder());
        vertexBuffer = bb.asFloatBuffer();
        vertexBuffer.put(squareCoords);
        vertexBuffer.position(0);

        // initialize byte buffer for the draw list
        ByteBuffer dlb = ByteBuffer.allocateDirect(
                // (# of coordinate values * 2 bytes per short)
                drawOrder.length * 2);
        dlb.order(ByteOrder.nativeOrder());
        drawListBuffer = dlb.asShortBuffer();
        drawListBuffer.put(drawOrder);
        // set the buffer to read the first coordinate
        drawListBuffer.position(0);

        int vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, vertexShaderCode);

        int fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentShaderCode);

        //create empty GL ES program
        program = glCreateProgram();

        // add the vertex shader to program
        GLES20.glAttachShader(program, vertexShader);

        // add the fragment shader to program
        GLES20.glAttachShader(program, fragmentShader);

        // creates OpenGL ES program executables
        GLES20.glLinkProgram(program);
    }

    public void draw() {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT);

        float textureCoords[] = {
                LEFT_OFFSET+(DEVICE_COL-1)*DEVICE_WIDTH_PROPORTION+ROTATION, (DEVICE_ROW-1)*DEVICE_HEIGHT_PROPORTION,    //top left
                LEFT_OFFSET+(DEVICE_COL-1)*DEVICE_WIDTH_PROPORTION+ROTATION, DEVICE_ROW*DEVICE_HEIGHT_PROPORTION,       //bottom left
                LEFT_OFFSET+DEVICE_COL*DEVICE_WIDTH_PROPORTION+ROTATION, DEVICE_ROW*DEVICE_HEIGHT_PROPORTION,            //bottom right
                LEFT_OFFSET+DEVICE_COL*DEVICE_WIDTH_PROPORTION+ROTATION, (DEVICE_ROW-1)*DEVICE_HEIGHT_PROPORTION         //top right
        };
        ByteBuffer tbb = ByteBuffer.allocateDirect(textureCoords.length * 4);
        tbb.order(ByteOrder.nativeOrder());
        texCoordBuffer = tbb.asFloatBuffer();
        texCoordBuffer.put(textureCoords);
        texCoordBuffer.position(0);

        // Add program to OpenGL ES environment
        GLES20.glUseProgram(program);

        texUniformHandle = GLES20.glGetUniformLocation(program, "uTexture");
        // Set the active texture unit to texture unit 0.
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);

        // Bind the texture to this unit.
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, TEXTURE_ID);

        // Tell the texture uniform sampler to use this texture in the shader by binding to texture unit 0.
        GLES20.glUniform1i(texUniformHandle, 0);

        // get handle to vertex shader's vPosition member
        positionHandle = GLES20.glGetAttribLocation(program, "vPosition");

        // Enable a handle to the square vertices
        GLES20.glEnableVertexAttribArray(positionHandle);

        // Prepare the square coordinate data
        GLES20.glVertexAttribPointer(positionHandle, COORDS_PER_VERTEX,
                GLES20.GL_FLOAT, false,
                vertexStride, vertexBuffer);

        texCoordHandle = GLES20.glGetAttribLocation(program, "aTexCoordinate");
        GLES20.glEnableVertexAttribArray(texCoordHandle);

        GLES20.glVertexAttribPointer(texCoordHandle, 2, GLES20.GL_FLOAT, false,
                2*4, texCoordBuffer);

        // Draw the square
        GLES20.glDrawElements(GLES20.GL_TRIANGLES, drawOrder.length,
                GLES20.GL_UNSIGNED_SHORT, drawListBuffer);

        // Disable vertex array
        GLES20.glDisableVertexAttribArray(positionHandle);
    }

    public void setRotation(float newValue) {
        Log.d(TAG, "GLCANVAS: " + newValue);
        ROTATION = newValue;
    }

    public void setDevicePosition(float dRow, float dCol) {
        DEVICE_ROW = dRow;
        DEVICE_COL = dCol;

        LEFT_OFFSET = rowOffsets[Math.round(dRow)-1]*DEVICE_WIDTH_PROPORTION;
    }

    public void setParams(float heightProportion, float widthScale) {
        DEVICE_HEIGHT_PROPORTION = heightProportion;
        TEXTURE_WIDTH_SCALE = widthScale;
    }

    private static int loadShader(int type, String shaderCode) {
        // create a vertex shader type (GLES20.GL_VERTEX_SHADER)
        // or a fragment shader type (GLES20.GL_FRAGMENT_SHADER)
        int shader = GLES20.glCreateShader(type);

        // add the source code to the shader and compile it
        GLES20.glShaderSource(shader, shaderCode);
        GLES20.glCompileShader(shader);

        return shader;
    }

    public void loadTexture(Uri fileUri, String repeatType) {

        final BitmapFactory.Options options = new BitmapFactory.Options();
        options.inScaled = false;   // No pre-scaling

        // Read in the resource
        final Bitmap bitmap = BitmapFactory.decodeFile(fileUri.getPath(), options);

        if (TEXTURE_ID != 0) {
            updateTexture(TEXTURE_ID, bitmap, repeatType);
        } else {
            TEXTURE_ID = createTexture();
            updateTexture(TEXTURE_ID, bitmap, repeatType);
        }
        bitmap.recycle();
    }

    private int createTexture() {
        final int[] textureHandle = new int[1];
        GLES20.glGenTextures(1,textureHandle,0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureHandle[0]);
        return textureHandle[0];
    }

    private void updateTexture(int textureId, Bitmap bitmap, String repeatType) {
        GLES20.glActiveTexture(GLES20.GL_TEXTURE0);
        GLES20.glBindTexture(GLES20.GL_TEXTURE_2D, textureId);

        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR);

        // Set behavior for out-of-bounds texture coords
        if (repeatType.equals("mirror")) {REPEAT_TYPE = GLES20.GL_MIRRORED_REPEAT;}
        else if (repeatType.equals("tile")) {REPEAT_TYPE = GLES20.GL_REPEAT;}

        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_S, REPEAT_TYPE);
        GLES20.glTexParameteri(GLES20.GL_TEXTURE_2D, GLES20.GL_TEXTURE_WRAP_T, REPEAT_TYPE);

        // Load the bitmap into the bound texture.
        GLUtils.texImage2D(GLES20.GL_TEXTURE_2D, 0, bitmap, 0);
        Log.d(TAG, "GL error status: " + GLES20.glGetError());
    }

}

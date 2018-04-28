package com.bkr.spherenative;

import android.Manifest;


import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat.OnRequestPermissionsResultCallback;
import android.support.v7.app.AlertDialog;
import android.text.InputType;
import android.util.Log;
import android.support.v4.app.ActivityCompat;
import android.support.v7.app.AppCompatActivity;

import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;

public class MainActivity extends AppCompatActivity
        implements OnRequestPermissionsResultCallback {

    private Controller controller;

    private boolean initialized = false;

    String TAG = "sphere-native";

    //*******************************************
    String SERVER_IP_ADDRESS = "192.168.1.123";
    //*******************************************

    int btnCounter = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //Remove title bar
        this.requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_main);

        controller = new Controller(getApplicationContext());

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

        String[] permissions = {Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE};

        if(!hasPermissions(this, permissions)) {
            ActivityCompat.requestPermissions(this, permissions, 1);
        } else {
            initialized = controller.initialize(SERVER_IP_ADDRESS, findViewById(R.id.video_view));
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                           int[] grantResults) {
        if (requestCode == 1) {
            if (grantResults.length >= 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Permission Granted. Initializing...");

                initialized = controller.initialize(SERVER_IP_ADDRESS,
                        findViewById(R.id.video_view));
            } else {
                Log.e(TAG, "Permission Denied. Doing nothing");
            }
        }
    }

    public static boolean hasPermissions(Context context, String... permissions) {
        if (context != null && permissions != null) {
            for (String permission : permissions) {
                if (ActivityCompat.checkSelfPermission(context, permission) !=
                        PackageManager.PERMISSION_GRANTED) {
                    return false;
                }
            }
        }
        return true;
    }

    @Override
    protected void onPause() {
        super.onPause();
        Log.d(TAG, "MainActivity Pause");
        if (initialized) {
            controller.pause();
        }
    }

    @Override
    protected void onResume() {
        this.getSupportActionBar().hide();
        super.onResume();

        //Hide status and action bars
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);

        if (initialized) {
            controller.resume();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (initialized) {
            controller.destroy();
        }
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
                    controller.setSpherePosition(position);
                })
                .setNegativeButton("Cancel", (dialog, whichButton) -> {

                })
                .show();
    }
}
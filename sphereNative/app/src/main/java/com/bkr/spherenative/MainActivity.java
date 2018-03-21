package com.bkr.spherenative;

import android.Manifest;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.support.v4.app.ActivityCompat.OnRequestPermissionsResultCallback;
import android.support.v4.content.FileProvider;
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

import java.io.File;
import java.util.Date;


public class MainActivity extends AppCompatActivity
        implements OnRequestPermissionsResultCallback {

    private Controller controller;

    private long refId;
    //private Socket socket;

    //private MonoscopicView videoView;

    //private SyncTimer timer = new SyncTimer();
    //private CompositeDisposable disposables;

    //private DatagramListener dgramListener;

    private String apk_filename;

    private boolean initialized = false;

    String TAG = "sphere-native";

    //*******************************************
    String SERVER_IP_ADDRESS = "192.168.0.175";
    //*******************************************

    int btnCounter = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //Remove title bar
        this.requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        setContentView(R.layout.activity_main);

        controller = new Controller();

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

        //disposables = new CompositeDisposable(); // stream listeners to dispose

        String[] permissions = {Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE};

        if(!hasPermissions(this, permissions)) {
            ActivityCompat.requestPermissions(this, permissions, 1);
        } else {
            initialized = controller.initialize(SERVER_IP_ADDRESS, findViewById(R.id.video_view));
            //Log.d(TAG, "INTIALIZED: " + initialized);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == 1) {
            // Request for camera permission.
            if (grantResults.length >= 1 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permission has been granted. Start camera preview Activity.
                Log.d(TAG, "Permission Granted. Starting File check");
                //checkFile();
                initialized = controller.initialize(SERVER_IP_ADDRESS, findViewById(R.id.video_view));
            } else {
                // Permission request was denied.
                Log.e(TAG, "Permission Denied. Doing nothing");
            }
        }
    }
/*
    BroadcastReceiver onComplete = new BroadcastReceiver() {
        public void onReceive(Context ctxt, Intent intent) {
            //long referenceId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            //Log.e("IN", "" + referenceId);

            Log.d(TAG,"Download Complete");
            checkFile();
        }
    };*/

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

    /*
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
                    //startDgramListener();
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
    }*/

    @Override
    protected void onPause() {
        super.onPause();
        Log.d(TAG, "MainActivity Pause");
        if (initialized) {
            controller.pause();
        }
        // Prevent the view from rendering continuously when in the background.
       // videoView.onPause();
        // If the video is playing when onPause() is called, the default behavior will be to pause
        // the video and keep it paused when onResume() is called.
        //timer.stopSync();
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

        // Resume the 3D rendering.
        //videoView.onResume();
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
        //disposables.dispose();
        //unregisterReceiver(onComplete);
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
            Uri apkUri = FileProvider.getUriForFile(getApplicationContext(), BuildConfig.APPLICATION_ID + ".provider", toInstall);

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
            getApplicationContext().startActivity(newIntent);

            unregisterReceiver(this);
            finish();
        }
    };
}

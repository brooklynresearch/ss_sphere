package com.bkr.spherenative;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.support.v4.content.FileProvider;
import android.util.Log;
import android.util.Pair;

import com.bkr.spherenative.ClockSync.SyncTimer;
import com.bkr.spherenative.Comms.DatagramListener;
import com.bkr.spherenative.Comms.WebsocketClient;
import com.bkr.spherenative.Display360.MonoscopicView;
import com.bkr.spherenative.FileSync.FileManager;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.util.Date;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;

import io.reactivex.Observable;
import io.reactivex.android.schedulers.AndroidSchedulers;
import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.disposables.Disposable;
import io.reactivex.schedulers.Schedulers;

/**
 * Created by tarvu on 3/16/18.
 * Main App logic
 * Listens to Comms messages and MainActivity UI to control ClockSync, Display360, and FileSync classes
 */

class Controller {
    private String TAG = "Controller";
    private String hostIP;
    private String rtpHost;
    private Context appContext;
    private Boolean mediaLoaded = false;

    private MonoscopicView panoView;
    private DatagramListener dgramListener;
    private WebsocketClient wsClient;
    private SyncTimer timer;
    private CompositeDisposable disposables = new CompositeDisposable();
    private String websocketUrl;

    private Observable<Integer> dgramStream;
    private Observable<HashMap<String,String>> wSocketStream;
    private Disposable dgramDisposable;
    private Disposable wSocketDisposable;

    private static File DOWNLOAD_DIR =
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);

    Controller(Context context) {
        appContext = context;
    }

    public boolean initialize(String hostIpAddr, MonoscopicView viewElement) {
        hostIP = hostIpAddr;
        panoView = viewElement;
        rtpHost = "rtsp://" + hostIpAddr + ":8554/movie.mp4";

        return initPanoView() &&
                initComms(hostIpAddr) &&
                initFileSync() &&
                initClockSync(hostIpAddr);
    }

    private boolean initPanoView() {
        panoView.initialize();
        //startStream(rtpHost);
        //loadMedia();
        //loadImage();
        return true;
    }

    private void startStream(String uri) {
        Disposable d = Observable.timer(1, TimeUnit.SECONDS)
                .subscribe(i -> {
                    panoView.initVideoStream(uri);
                });
    }

    private void loadMedia(String type, String name) {
        switch(type) {
            case "image":
                if (checkFile("image", name)) {
                    Uri path = Uri.fromFile(new File(DOWNLOAD_DIR + "/" + name));
                    panoView.loadImage(path);
                }
                break;
            case "video":
                if (checkFile("video", name)) {
                    Uri path = Uri.fromFile(new File(DOWNLOAD_DIR + "/" + name));
                    panoView.loadVideo(path);
                }
                break;
            case "stream":
                //something here
                break;
        }
    }

    private boolean checkFile(String type, String name) {
        if (!FileManager.hasFile(name)) {
            BroadcastReceiver onComplete = new BroadcastReceiver() { //on download complete
                @Override
                public void onReceive(Context context, Intent intent) {
                    loadMedia(type, name);
                    context.unregisterReceiver(this);
                }
            };
            String folder = type.equals("video") ? "moviefiles/" : "imagefiles/";
            String remotePath = "http://" + hostIP + ":3000/" + folder + name;
            FileManager.getFileFromHost(appContext, remotePath, name, onComplete); //start download
            return false;
        } else { //we already have it. check for integrity here if necessary
            return true;
        }
    }

    private boolean initComms(String hostIpAddr) {
        Log.d(TAG, "Initializing comms...");
        websocketUrl = "http://" + hostIpAddr + ":8080";
        wsClient = new WebsocketClient();
        wSocketStream = wsClient.getStream().subscribeOn(Schedulers.io());

        dgramListener = new DatagramListener(55555, 1500);
        dgramStream = dgramListener.getStream().subscribeOn(Schedulers.io())
                        .map(p ->
                                // packet -> string -> int
                                Integer.parseInt(new String(p.getData()).trim())
                        )
                        .filter(i -> i >= 0 && i <= 39000); // drop out-of-range values;

        Log.d(TAG, "...Done.");
        return true;
    }

    private void startComms() {
        Log.d(TAG, "Starting websocket");
        wsClient.connect(websocketUrl);

        wSocketDisposable = wSocketStream.subscribe(this::handleSocketMessage);

        Log.d(TAG, "starting Dgram");
        dgramDisposable = dgramStream.subscribe(this::handleDgram);
    }


    private boolean initFileSync() {
        Log.d(TAG, "Initializing FileSync...");
        //do stuff
        Log.d(TAG, "...Done.");
        return true;
    }

    private boolean initClockSync(String hostIpAddr) {
        Log.d(TAG, "Initializing ClockSync...");
        timer = new SyncTimer();
        timer.setServer(hostIpAddr);
        Log.d(TAG, "...Done.");
        return true;
    }

    private void handleSocketMessage(HashMap<String, String> msgMap) {
        Log.d(TAG, "GOT WEBSOCKET: " + msgMap.toString());
        //get fields and pass to panoView or fileSync
        switch(msgMap.get("type")) {
            case "toggle-play":
                String serverTime = msgMap.get("serverTime");
                String delay = msgMap.get("delay");
                long triggerTarget = Long.parseLong(serverTime) + Integer.parseInt(delay);
                Disposable t = timer.setTrigger(triggerTarget)
                    .subscribeOn(AndroidSchedulers.mainThread())
                    .subscribe(l -> panoView.togglePlayback());
                disposables.add(t);
                break;
            case "pos":
                String pos = msgMap.get("value");
                if (!pos.equals("-1")) {
                    setSpherePosition(msgMap.get("value"));
                }
                break;
            case "newtable":
                try {
                    JSONObject table = new JSONObject(msgMap.get("table"));
                    panoView.setPositionTable(table);
                } catch (JSONException e) {
                    Log.e(TAG, "Error parsing pos table" + e.getMessage());
                }
                break;
            case "update-apk":
                newApk();
                break;
            case "load-image":
                loadMedia("image",msgMap.get("name") + ".png");
                break;
            case "load-video":
                loadMedia("video", msgMap.get("name") + ".mp4");
                break;
            default:
                Log.e(TAG, "Unknown message type: " + msgMap.toString());
        }
    }

    private void handleDgram(Integer n) {
        Pair<Float, Float> srcRange = new Pair<>(0.0f, 39000.0f);
        Pair<Float,Float> dstRange = new Pair<>(0.0f, 360.0f);
        panoView.setYawAngle(convertToRange(n.floatValue(), srcRange, dstRange) - 180.0f);
        //Log.d(TAG, "GOT DGRAM: " + n.toString());
    }

    private static float convertToRange(float value, Pair<Float, Float> srcRange,
                                        Pair<Float, Float> dstRange) {
        float srcMax = srcRange.second - srcRange.first;
        float dstMax = dstRange.second - dstRange.first;
        float adjValue = value - srcRange.first;

        return  (adjValue * dstMax / srcMax) + dstRange.first;
    }

    public void setSpherePosition(String pos) {
        //From MainActivity UI dialog or websocket message
        panoView.setSpherePosition(pos);
    }

    private void newApk() {
        long t = new Date().getTime();
        String apk_filename = "/sphere-" + t + ".apk";
        BroadcastReceiver onApkComplete = new BroadcastReceiver() {
            public void onReceive(Context ctxt, Intent intent) {
                installUpdate(apk_filename);
            }
        };
        String remotePath = "http://" + hostIP + ":3000/sphere.apk";
        FileManager.getFileFromHost(appContext, remotePath, apk_filename, onApkComplete);
    }

    private void installUpdate(String apk_filename) {
        Log.d(TAG,"APK Download Complete");
        Log.d(TAG, "INSTALLING APK");

        File toInstall = new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    apk_filename);

        Uri apkUri = FileProvider.getUriForFile(appContext,
                BuildConfig.APPLICATION_ID + ".provider", toInstall);

        Intent newIntent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
        newIntent.setData(apkUri);
        newIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        newIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        appContext.startActivity(newIntent);
    }

    public void pause() {
        Log.d(TAG, "Controller Pausing...");
        dgramDisposable.dispose();
        wSocketDisposable.dispose();
        timer.stopSync();
        panoView.onPause();
    }

    public void resume() {
        Log.d(TAG, "Controller Resuming...");
        timer.startSync();
        panoView.onResume();
        startComms();
    }

    public void destroy() {
        dgramDisposable.dispose();
        wSocketDisposable.dispose();
        wsClient.destroy();
        dgramListener.destroy();
        timer.stopSync();
        panoView.destroy();
    }
}

package com.bkr.spherenative;

import android.net.Uri;
import android.os.Environment;
import android.util.Log;

import com.bkr.spherenative.ClockSync.SyncTimer;
import com.bkr.spherenative.Comms.DatagramListener;
import com.bkr.spherenative.Comms.WebsocketClient;
import com.bkr.spherenative.Display360.MonoscopicView;

import java.io.File;
import java.util.HashMap;

import io.reactivex.Observer;
import io.reactivex.disposables.CompositeDisposable;
import io.reactivex.disposables.Disposable;

/**
 * Created by tarvu on 3/16/18.
 * Main App logic
 * Listens to Comms messages and MainActivity UI to control ClockSync, Display360, and FileSync classes
 */

public class Controller {
    private String TAG = "Controller";
    private Boolean mediaLoaded = false;
    private Boolean commsStarted = false;

    private MonoscopicView panoView;
    private DatagramListener dgramListener;
    private WebsocketClient wsClient;
    private SyncTimer timer;
    private CompositeDisposable disposables = new CompositeDisposable();
    private String websocketUrl;

    public boolean initialize(String hostIpAddr, MonoscopicView viewElement) {
        panoView = viewElement;

        return initPanoView() &&
                initComms(hostIpAddr) &&
                initFileSync() &&
                initClockSync(hostIpAddr);
    }

    private boolean initPanoView() {
        panoView.initialize();
        loadMedia();
        return true;
    }

    public void loadMedia() {
        Log.d(TAG, "Loading media");
        //TODO: should call filesync and wait for correct fileuri
        File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        Uri fileUri = Uri.fromFile(new File(downloadDir + "/movie.mp4"));

        panoView.loadMedia(fileUri);
        mediaLoaded = true;
    }

    private boolean initComms(String hostIpAddr) {
        Log.d(TAG, "Initializing comms...");
        websocketUrl = "http://" + hostIpAddr + ":8080";
        wsClient = new WebsocketClient();

        dgramListener = new DatagramListener();

        Log.d(TAG, "...Done.");
        return true;
    }

    public void startComms() {
        Log.d(TAG, "Starting comms");
        wsClient.connect(websocketUrl, createWsObserver());
        //dgramListener.listen(createDgramObserver());
        commsStarted = true;
    }


    private boolean initFileSync() {
        //do stuff
        Log.d(TAG, "Initializing FileSync...");
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


    private Observer<HashMap<String,String>> createWsObserver() {
        return new Observer<HashMap<String, String>>() {

            @Override
            public void onSubscribe(Disposable d) {
                disposables.add(d);
            }

            @Override
            public void onNext(HashMap<String, String> socketMsg) {
                //Log.d(TAG, "wsObserver onNext");
                handleSocketMessage(socketMsg);
            }

            @Override
            public void onError(Throwable e) {

            }

            @Override
            public void onComplete() {

            }
        };
    }

    private Observer<Integer> createDgramObserver() {
        return new Observer<Integer>() {

            @Override
            public void onSubscribe(Disposable d) {
                disposables.add(d);
            }

            @Override
            public void onNext(Integer integer) {
                handleDgram(integer);
            }

            @Override
            public void onError(Throwable e) {
                Log.e(TAG, e.getMessage());
            }

            @Override
            public void onComplete() {

            }
        };
    }

    private void handleSocketMessage(HashMap<String, String> msgMap) {
        Log.d(TAG, "GOT WEBSOCKET: " + msgMap.toString());
        //get fields and pass to panoView or fileSync
    }

    private void handleDgram(Integer n) {
        //check value and pass to panoView
        Log.d(TAG, "GOT DGRAM: " + n.toString());
    }

    public void setSpherePosition(String pos) {
        //From MainActivity UI dialog or websocket message
        panoView.setSpherePosition(pos);
    }

    public void pause() {
        Log.d(TAG, "Controller Pausing...");
        disposables.dispose();
        timer.stopSync();
        panoView.onPause();
        commsStarted = false;
    }

    public void resume() {
        Log.d(TAG, "Controller Resuming...");
        timer.startSync();
        panoView.onResume();
        if (!mediaLoaded) {
            loadMedia();
        }
        if (!commsStarted) {
            startComms();
        }
    }

    public void destroy() {
        disposables.dispose();
        wsClient.destroy();
        dgramListener.stop();
        timer.stopSync();
        panoView.destroy();
    }
}

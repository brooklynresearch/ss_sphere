package com.bkr.spherenative.Comms;

import android.util.Log;
import android.util.Pair;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.Map;

import io.reactivex.Observable;
import io.reactivex.ObservableEmitter;
import io.reactivex.ObservableOnSubscribe;
import io.reactivex.Observer;
import io.reactivex.Scheduler;
import io.reactivex.SingleObserver;
import io.reactivex.disposables.Disposable;
import io.reactivex.functions.Cancellable;
import io.reactivex.schedulers.Schedulers;
import io.socket.client.IO;
import io.socket.client.Socket;

/**
 * Created by tarvu on 3/16/18.
 */

public class WebsocketClient {
    private String TAG = "WebsocketClient";
    private Socket socket;

    public void connect(String url, Observer observer) {
        try {
            socket = IO.socket(url);
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }

        setEventHandlers(socket, observer);
        socket.connect();
    }

    private void setEventHandlers(Socket socket, Observer observer) {
        Observable<HashMap<String, String>> stream = Observable.create(new ObservableOnSubscribe<HashMap<String, String>>() {

            @Override
            public void subscribe(ObservableEmitter<HashMap<String, String>> emitter) throws Exception {
                emitter.setCancellable(new Cancellable() {
                    @Override
                    public void cancel() throws Exception {
                        if (socket.connected()) {
                            socket.close();
                        }
                    }
                });
                socket.on("toggle-play", args -> {
                    HashMap<String, String> msgMap = new HashMap<>();
                    msgMap.put("type", "toggle-play");
                    JSONObject data = (JSONObject) args[0];
                    try {
                        msgMap.put("serverTime", data.getString("timestamp"));
                        msgMap.put("delay", data.getString("delay"));
                    } catch (JSONException e) {
                        Log.e(TAG, e.getMessage());
                        return;
                    }
                    emitter.onNext(msgMap);
                });
                socket.on("newtable", args -> {
                    HashMap<String, String> msgMap = new HashMap<>();
                    msgMap.put("type", "newtable");
                    JSONObject data = (JSONObject) args[0];
                    msgMap.put("table", data.toString()); // TODO: add table items to map
                    emitter.onNext(msgMap);
                });
                socket.on("pos", args -> {
                    HashMap<String, String> msgMap = new HashMap<>();
                    msgMap.put("command", "pos");
                    msgMap.put("value", args[0].toString());
                    emitter.onNext(msgMap);
                });
                socket.on("filelist", args -> {
                    HashMap<String, String> msgMap = new HashMap<>();
                    JSONArray data = (JSONArray) args[0];
                    msgMap.put("type", "filelist");
                    msgMap.put("list", data.toString()); //  TODO: add list items to map
                    emitter.onNext(msgMap);
                });
            }
        });
        socket.on(Socket.EVENT_CONNECT, args -> {
            Log.d(TAG, "Websocket connected");
        }).on(Socket.EVENT_DISCONNECT, args -> {
            Log.d(TAG, "Websocket disconnected");
        });

        stream.subscribeOn(Schedulers.io());
        //stream.observeOn(Schedulers.io());
        stream.subscribe(observer);

        /*.on("toggle-play", args -> {
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

            /*
            timer.setTrigger(triggerTarget, new SingleObserver<Long>() {
                @Override
                public void onSubscribe(Disposable d) {
                    //disposables.add(d);
                }

                @Override
                public void onSuccess(Long aLong) {
                    //togglePause();
                }

                @Override
                public void onError(Throwable e) {
                    Log.e(TAG, "Error in trigger observer: " + e.getMessage());
                }
            });
        }).on("newtable", args -> {
            //videoView.setPositionTable( (JSONObject)args[0] );
        }).on("update-apk", args -> {
            Log.d(TAG, "CMD NEW APK");
            //updateApk();
            //new ApkUpdateTask().execute("http://" + SERVER_IP_ADDRESS + ":3000/sphere.apk");
        });*/
    }

    public void destroy() {
        socket.disconnect();
        socket.off(); //remove all listeners
    }
}

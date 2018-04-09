package com.bkr.spherenative.Comms;

import android.annotation.SuppressLint;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.URISyntaxException;
import java.util.HashMap;

import io.reactivex.Observable;
import io.reactivex.Observer;
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

    @SuppressLint("CheckResult")
    private void setEventHandlers(Socket socket, Observer observer) {
        Observable<HashMap<String, String>> stream = Observable.create(emitter -> {
            emitter.setCancellable(() -> {
                if (socket.connected()) {
                    socket.close();
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
            socket.on("filelist", args -> {
                HashMap<String, String> msgMap = new HashMap<>();
                msgMap.put("type", "filelist");
                JSONArray data = (JSONArray) args[0];
                msgMap.put("list", data.toString());
                //emitter.onNext(msgMap); //TODO: get this to fliesync
            });
            socket.on("pos", args -> {
                HashMap<String, String> msgMap = new HashMap<>();
                msgMap.put("type", "pos");
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
            socket.on("update-apk", args -> {
                HashMap<String, String> msgMap = new HashMap<>();
                //JSONArray data = (JSONArray) args[0];
                msgMap.put("type", "update-apk");
                emitter.onNext(msgMap);
            });
        });
        socket.on(Socket.EVENT_CONNECT, args -> {
            Log.d(TAG, "Websocket connected");
        }).on(Socket.EVENT_DISCONNECT, args -> {
            Log.d(TAG, "Websocket disconnected");
        });

        stream.subscribeOn(Schedulers.io());
        stream.subscribe(observer);
    }

    public void destroy() {
        socket.disconnect();
        socket.off(); //remove all listeners
    }
}

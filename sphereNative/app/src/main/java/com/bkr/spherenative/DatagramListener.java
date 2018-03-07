package com.bkr.spherenative;

import android.util.Log;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;

import io.reactivex.Observable;
import io.reactivex.ObservableEmitter;
import io.reactivex.ObservableOnSubscribe;
import io.reactivex.Observer;
import io.reactivex.android.schedulers.AndroidSchedulers;
import io.reactivex.functions.Cancellable;
import io.reactivex.schedulers.Schedulers;

/**
 * Created by tarvu on 2/20/18.
 */

public class DatagramListener {
    private String TAG = "DatagramListener";
    private boolean keepListening;

    public void listen(Observer observer) {
        Log.d(TAG, "Starting datagram listener");
        keepListening = true;
        Observable<Integer> stream = Observable.create(new ObservableOnSubscribe<Integer>() {
            @Override
            public void subscribe(ObservableEmitter<Integer> emitter) throws Exception {
                final DatagramSocket socket = new DatagramSocket(55555);
                emitter.setCancellable(new Cancellable() {
                    @Override
                    public void cancel() throws Exception {
                        if (!socket.isClosed()) {
                            socket.close();
                        }
                    }
                });
                while (keepListening) {
                    try {
                        //socket.setSoTimeout(1000);
                        byte[] recvBuf = new byte[15000];
                        DatagramPacket packet = new DatagramPacket(recvBuf, recvBuf.length);
                        //Log.e("UDP", "Waiting for UDP broadcast");
                        socket.receive(packet);
                        //String senderIP = packet.getAddress().getHostAddress();
                        String message = new String(packet.getData()).trim();
                        emitter.onNext(Integer.parseInt(message));
                    } catch (Exception e) {
                        emitter.onError(e);
                    }
                }
                socket.close();
            }
        });
        stream.subscribeOn(Schedulers.io());
        stream.observeOn(AndroidSchedulers.mainThread());
        stream.subscribe(observer);
    }

    public void stop() {
        Log.d(TAG, "Stopping datagram listener");
        keepListening = false;
    }
}

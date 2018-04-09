package com.bkr.spherenative.Comms;

import android.annotation.SuppressLint;
import android.provider.ContactsContract;
import android.util.Log;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.SocketException;

import io.reactivex.Observable;
import io.reactivex.Observer;
import io.reactivex.schedulers.Schedulers;

/**
 * Created by tarvu on 2/20/18.
 */

public class DatagramListener {
    private String TAG = "DatagramListener";
    private DatagramSocket socket;
    private boolean keepListening;
    private int port;
    private int packetSize;

    public DatagramListener(int port, int packetSize) {
        this.port = port;
        this.packetSize = packetSize;
    }

    @SuppressLint("CheckResult")
    public void startListening(Observer observer) {
        try {
            socket = new DatagramSocket(this.port);
        } catch (SocketException e) {
            e.printStackTrace();
        }
        Log.d(TAG, "listening...");
        keepListening = true;
        Observable<String> stream = Observable.create(emitter -> {
            byte[] recvBuf = new byte[this.packetSize];
            DatagramPacket packet = new DatagramPacket(recvBuf, recvBuf.length);
            while (keepListening) {
                try {
                    //socket.setSoTimeout(1000);
                    //Log.e("UDP", "Waiting for UDP broadcast");
                    socket.receive(packet);
                    //String senderIP = packet.getAddress().getHostAddress();
                    String message = new String(packet.getData()).trim();
                    emitter.onNext(message);
                } catch (IOException e) {
                    Log.e(TAG, "Discarding error: " + e.getMessage());;
                }
            }
        });

        stream.subscribeOn(Schedulers.io());

        stream.map(Integer::parseInt)
                .filter(i -> i >= 0 && i <= 36000) //ignore bad data
                .subscribe(observer);
    }

    public void stop() {
        Log.d(TAG, "Stopping datagram listener");
        keepListening = false;
        socket.close();
    }
}

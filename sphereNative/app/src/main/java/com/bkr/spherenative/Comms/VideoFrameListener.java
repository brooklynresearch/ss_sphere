package com.bkr.spherenative.Comms;

import android.util.Log;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.SocketException;

import io.reactivex.Observable;
import io.reactivex.schedulers.Schedulers;

public class VideoFrameListener {
    private String TAG = "VideoFrameListener";
    private DatagramSocket socket;
    private boolean keepListening;

    private int port;
    private int packetSize;

    public VideoFrameListener(int port, int packetSize) {
        this.port = port;
        this.packetSize = packetSize;
    }

    public Observable<DatagramPacket> getStream() {
        try {
            socket = new DatagramSocket(this.port);
        } catch (SocketException e) {
            e.printStackTrace();
        }
        keepListening = true;
        return Observable.create(emitter -> {
            byte[] recvBuf = new byte[this.packetSize];
            DatagramPacket packet = new DatagramPacket(recvBuf, recvBuf.length);
            while (keepListening) {
                try {
                    //socket.setSoTimeout(1000);
                    //Log.e("UDP", "Waiting for UDP broadcast");
                    socket.receive(packet);
                    emitter.onNext(packet);
                    //String senderIP = packet.getAddress().getHostAddress();
                    //String message = new String(packet.getData()).trim();
                    //emitter.onNext(message);
                } catch (IOException e) {
                    Log.e(TAG, "Discarding error: " + e.getMessage());;
                }
            }
        });
    }

    public void stop() {
        keepListening = false;
        socket.close();
    }
}

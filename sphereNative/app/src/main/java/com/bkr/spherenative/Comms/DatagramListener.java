package com.bkr.spherenative.Comms;

import android.util.Log;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.SocketException;

import io.reactivex.Observable;


/**
 * Created by tarvu on 2/20/18.
 */

public class DatagramListener {
    private String TAG = "DatagramListener";
    private DatagramSocket socket;
    private int port;
    private byte[] recvBuffer;

    public DatagramListener(int port, int packetSize) {
        this.port = port;
        this.recvBuffer = new byte[packetSize];
    }

    public Observable<DatagramPacket> getStream() {
        try {
            socket = new DatagramSocket(this.port);
        } catch (SocketException e) {
            e.printStackTrace();
        }

        return Observable.fromCallable( () -> {
            for (int i = 0; i < recvBuffer.length; i++)
                recvBuffer[i] = 0; // clear out the buffer

            DatagramPacket packet = new DatagramPacket(recvBuffer, recvBuffer.length);
            try {
                socket.receive(packet);
            } catch (IOException e) {
                Log.e(TAG, e.getMessage());
            }
            return packet;
        }).repeat();
    }

    public void destroy() {
        if (!socket.isClosed()) {
            socket.close();
        }
    }
}

package com.bkr.spherenative.ClockSync;

import android.util.Log;

import com.bkr.spherenative.ClockSync.SntpClient;

import java.util.concurrent.TimeUnit;

import io.reactivex.Observable;

import io.reactivex.Observer;
import io.reactivex.Single;
import io.reactivex.SingleObserver;
import io.reactivex.android.schedulers.AndroidSchedulers;
import io.reactivex.disposables.Disposable;
import io.reactivex.schedulers.Schedulers;

/**
 * Created by tarvu on 2/15/18.
 */

public class SyncTimer {
    private String TAG = "SyncTimer";
    private Long POLL_INTERVAL = 1L;
    private Disposable intervalDisposable;
    private SntpClient client = new SntpClient();
    private String ntpHost = "";
    private long clockOffset;

    public void setServer(String ntpServer) {
        ntpHost = ntpServer;
    }

    public void startSync() {
        Observable<Long> interval = Observable.interval(POLL_INTERVAL, TimeUnit.SECONDS, Schedulers.io());
        interval.subscribe(new Observer<Long>() {
            @Override
            public void onSubscribe(Disposable d) {
                intervalDisposable = d;
                Log.d(TAG, "Starting ntp polling");
            }

            @Override
            public void onNext(Long aLong) {
                if (!ntpHost.isEmpty() && client.requestTime(ntpHost, 1000)) {
                    clockOffset = client.getClockOffset();
                    Log.d(TAG, "Got offset: " + clockOffset);
                } else {
                    Log.e(TAG, "Could not request time. NTP host: " + ntpHost);
                }
            }

            @Override
            public void onError(Throwable e) {
                Log.e(TAG, "Error in startSync: " + e.getMessage());
            }

            @Override
            public void onComplete() {

            }
        });
    }

    public void stopSync() {
        Log.d(TAG, "Stopping clock update cycle");
        intervalDisposable.dispose();
    }

    public void setTrigger(long targetTime, SingleObserver observer) {
        long serverTime = System.currentTimeMillis() + clockOffset;
        Single<Long> timer = Single.timer(targetTime - serverTime, TimeUnit.MILLISECONDS, Schedulers.io());
        timer.observeOn(AndroidSchedulers.mainThread());
        timer.subscribe(observer);
    }
}

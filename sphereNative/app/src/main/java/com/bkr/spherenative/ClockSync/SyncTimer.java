package com.bkr.spherenative.ClockSync;

import android.util.Log;

import java.util.concurrent.TimeUnit;

import io.reactivex.Observable;
import io.reactivex.Single;
import io.reactivex.disposables.Disposable;
import io.reactivex.schedulers.Schedulers;

/**
 * Created by tarvu on 2/15/18.
 */

public class SyncTimer {
    private String TAG = "SyncTimer";
    private Disposable intervalDisposable;
    private SntpClient client = new SntpClient();
    private String ntpHost = "";
    private long clockOffset;

    public void setServer(String ntpServer) {
        ntpHost = ntpServer;
    }

    public void startSync() {
        final Long POLL_INTERVAL = 1L;
        Observable<Long> interval = Observable.interval(POLL_INTERVAL, TimeUnit.SECONDS,
                                        Schedulers.io());

        intervalDisposable = interval.subscribe(
                l -> {
                    if (!ntpHost.isEmpty() && client.requestTime(ntpHost, 1000)) {
                        clockOffset = client.getClockOffset();
                        Log.d(TAG, "Got offset: " + clockOffset);
                    } else {
                        Log.e(TAG, "Could not request time. NTP host: " + ntpHost);
                    }
                }, e -> Log.e(TAG, "Error in startSync: " + e.getMessage())
        );
    }

    public void stopSync() {
        Log.d(TAG, "Stopping clock update cycle");
        intervalDisposable.dispose();
    }

    public Single<Long> setTrigger(long targetTime) {
        long serverTime = System.currentTimeMillis() + clockOffset;
        return Single.timer(targetTime - serverTime, TimeUnit.MILLISECONDS, Schedulers.io());
    }
}

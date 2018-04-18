package com.bkr.spherenative.FileSync;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;

import java.io.File;

/**
 * Created by tarvu on 4/4/18.
 */

public class FileManager {
    private String TAG = "FileManager";
    public static boolean hasFile(String filename) {
        File downloadDir = Environment
                            .getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        return new File(downloadDir, filename).exists();
    }

    public static void getFileFromHost(Context ctx, String fileLocation, String localFilename,
                                       BroadcastReceiver onDownloadComplete) {

        DownloadManager downloadManager =
                (DownloadManager) ctx.getSystemService(Context.DOWNLOAD_SERVICE);

        ctx.registerReceiver(onDownloadComplete,
                new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));

        Uri download_uri = Uri.parse(fileLocation);
        DownloadManager.Request req = new DownloadManager.Request(download_uri);
        req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, localFilename);
        req.setTitle(localFilename);
        try {
            downloadManager.enqueue(req);
        } catch (NullPointerException e) {
            Log.e("FileManager", e.getMessage());
        }
    }
}

package com.bkr.spherenative.FileSync;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Environment;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

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

    private BroadcastReceiver onComplete = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            Log.d(TAG, "Download complete");
        }
    };

    public int syncFiles(Context ctx, JSONArray list) {
        int count = 0;
        JSONObject fileEntry;
        String filedir = "";
        String filename = "";
        for (int i = 0; i < list.length(); i++) {
            try {
                fileEntry = (JSONObject) list.get(i);
                filename = (String) fileEntry.get("name");
                filedir = (String) fileEntry.get("dir");
            } catch (JSONException e) {
                Log.e(TAG, e.getMessage());
            }
            if (!hasFile(filename)) {
                count++;
                String filepath = "http://192.168.1.123:3000/" + filedir + "/" + filename;
                getFileFromHost(ctx, filepath, filename, onComplete);
            }
        }
        return count;
    }
}

#!/bin/bash

function updateAppFile {

    appFile=./public/app/index.js
    oldFile=$(cat $appFile | grep -m 1 .mp4 | awk '{print $4}')
    newFile="\"$VIDEO_FILE\";"
    echo -n "[+]    $appFile: Replace $oldFile with $newFile? (y for yes):"
    read ans
    if [ $ans = "y" ]
    then
        python ./scripts/replace.py "$appFile" "$oldFile" "$newFile";
        echo "[+]   Making /newconfig request";
        python ./scripts/request.py "http://localhost:3000/newconfig";
        sleep 5;
        echo "[+]   Making /reload request";
        python ./scripts/request.py "http://localhost:3000/reload";
    else
        echo "[-]    No changes made. Exiting"
        exit 1
    fi
}

echo "[+]   Reading videofile.config"
source ./videofile.config

echo "[+]   loaded video config..."
echo "[+]   video file: $VIDEO_FILE"
echo "[+]   video positions: $VIDEO_POSITIONS"
echo "[+]   position names: $POSITION_NAMES"

updateAppFile
exit 0


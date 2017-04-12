#!/bin/bash
#sign jar file
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
      platforms/android/build/output/apk/android-release-unsigned.apk myapp \
      -keystore ../../bin/keystore \
      -storepass 123456
#remove old signed version
# rm -rfv myapp.apk
#pack new apk
$ANDROID_HOME/build-tools/25.0.2/zipalign 4 platforms/android/build/output/apk/android-release-unsigned.apk myapp \
       platforms/android/build/output/apk/myapp.apk 

# zipalign 4 release-unsigned.apk myapp.apk
#remove old unsigned version
rm -rfv release-unsigned.apk
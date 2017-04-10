# Sphere Display

Displays are cool.

## Running locally
This application needs node and cordova installed. For Android, it will also need the android platform and sdk installed. Please see the instructions for installation of these packages here:

https://cordova.apache.org/docs/en/latest/guide/cli/

After installing the android sdk, to install cordova's android platform

```bash
cordova platform add android
```

For debugging quickly, we also install cordova's browser platform

```bash
cordova platform add browser
```

This cordova app uses multiple plugins, you should see them and install them

```bash
cordova plugin list
```

Not yet added, but we may need to add the Insomnia plugin.

```bash
cordova plugin add https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git
```

We may need to prepare that plugin via

```bash
cordova prepare
```

Further questions or instructions for this platform might be found here:
https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin

To run:

```bash
cordova run android
```

If you have only the android platform installed, this should then run it with either an android device attached, or in absence of that, an android emulator

## What It Does
This app connects with the sphereServer node server.
A websocket connection with the server is started when this page is loaded and works in tandem with the controller page that the node server provides. This app uses the video.js panorama plugin in order to process spherical videos. Each device has a set viewport as a part of larger "grid" of devices.

A device can register its wall position (1 - 122) with the server via the hidden menu

On registering a position, the server responds with a command to change the FOV, Lat, Lon for the viewport of the spherical video player

The app receives UDP messages from the server over Wifi to determine what Longitude its viewport should be set at for the panorama player

The app also needs to receive messages of which video to load and when to start playing the video. The videos are located within the device's Movies/sphere folder and NOT packaged within the device. The app accesses these through the cordova file plugin.
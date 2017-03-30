# Tablet Display

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

This cordova app uses the status bar plugin. To install:

```bash
cordova plugin add cordova-plugin-statusbar
```

It also runs the insomnia cordova plugin that keeps the device on.

```bash
cordova plugin add https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin.git
```

We need to prepare that plugin via

```bash
cordova prepare
```

Further questions or instructions for this platform might be found here:
https://github.com/EddyVerbruggen/Insomnia-PhoneGap-Plugin

To run:

```bash
cordova run
```

If you have only the android platform installed, this should then run it with either an android device attached, or in absence of that, an android emulator

## What It Does
This app connects with the tabletwall node server.
A websocket connection with the server is started when this page is loaded and works in tandem with the controller page that the node server provides.

A device can register its wall position (1 - 50) with the server via the dropdown
menu and button on the index page.
On registering a position, the server responds with a command to display the new
position for the device.

Once a position has been set to 'active,' the server finds the socket connections
of any devices that registered themselves in that position, if there are any, and 
sends individual commands to toggle their state. Right now this just activates a listener 
on the index view to toggle text between "Active" and "Not Active."

## Todo
Migrate logic and assets from the page currently served by the node server to a cordova native app
# Sphere v2

## Overview

Sphere consists of a mobile app and a control server that allow multiple android devices connected via ethernet 
to function together as a single 360-degreee panoramic image or video display. The server receives serial input
from a rotary encoder to allow panning through the image or video. The server also handles time synchronization
of video playback, distribution of media files to the devices, and serves a control page to allow users to select
from among available media options.

## Setup

### Network

The network consists of a control server, router, and enough ethernet switches for
all of the phones.

The router subnet should be 192.168.1.0/24 and the control server should have the static IP
192.168.1.123 assigned to it. The phones can all have dynamic IPs.

For streaming video, the network needs to be able to handle multicast traffic.

### Server

The server computer needs to be running an NTP (Network Time Protocol) service and have UDP port 123 open for the
phones to be able to synchronize with one another.

The server also needs a PostgreSQL installed.

Create a database named 'sphere' and a new user with the same name. This new login will be used by the app.
At psql prompt:

    > CREATE DATABASE <appName>;
    > CREATE USER <appName> WITH PASSWORD '<password>';


For database name and credentials, the server app looks for a '.env' file
inside the root sphereServer folder. Note that '.env' is the entire filename,
**NOT** just any file ending with .env
It needs this one line:

```bash
DATABASE_URL=postgres://user:password@localhost:5432/sphere
```
Where 'user' and 'password' are for the new postgres user from above.

Then, in the sphereServer directory, install the dependencies

```bash
npm install
```

Migrate the database schema

```bash
npm run migrate
```

If the migration fails, there is a problem with the database setup or the '.env' file

Finally you can run the app

```bash
npm run dev
```

## Usage

### Controller

The controller route ('/controller') loads a page that allows another device to set the media for the phones to display.

By default a list of available images are shown. clicking/tapping 'Images' will switch to 'Videos'

The options shown on this page are populated from the directories `public/imagefiles` and `public/moviefiles.`
For each media item, if there is an image in `public\controller\thumbs` with the same name (minus extension), it will
be used as a thumbnail for that item.

Images are PNGs and videos are MP4s. They must have extensions '.png' and '.mp4' respectively.

There is also a dev route ('/moviecontrol') with buttons mostly used for testing. One important button on this page is
'New Apk' which sends a command to each phone to download the android app at '<server-ip>:3000/sphere.apk'
and prompt for install. This allows for a reasonably fast mass-update when changes are needed in the android code.

### Phones

A device can register its wall position (1 - 122) with the server via a dialog box opened by tapping the upper right
corner 4 times.
On registering a position, the server saves this number and the IP of the phone in its database so this position setting
will persist after restart.

### Streaming

Streaming video from the server computer has been successfully tested using VLC to pass a stream to Wowza Streaming Engine
which uses RTSP to push the stream to a multicast address. In order for the phones to access the stream, an SDP file generated
by Wowza needs to be placed in the 'sphereServer/public' directory.

Steps for streaming a video source:

* In the Wowza Engine Manager, set the incoming media source as "127.0.0.1:<port-num>" and a stream target as
    a multicast address (i.e. 230.0.0.1)

* In VLC start a stream via Media -> Stream via the GUI. I've tested using local files and webcam (Capture Device). For the
    destination, select UDP(Legacy). Make sure to click 'Add' and enter the same ip and port number as the Wowza input source.
    Next it will prompt for transcoding, I used the Android HD option. Click 'Stream'

* Once Wowza shows that it is receiving the stream, copy the SDP file that it generates. For my install this is located at
    '/usr/local/WowzaStreamingEngine/<stream-name>.sdp'. Paste this file in 'sphereServer/public' as 'stream.sdp'

* Finally, go to the debug page at '/moviecontrol' and click 'start-stream'

## Test Hardware

* Control Server: Lenovo Thinkpad (OS: Ubuntu )

* Router: Ubiquiti Edgerouter Pro 8-Port

* Switches: (1) Cisco SG100D-08, (4) Cisco SG112-24

* Android Devices: Samsung Galaxy S8, Samsung Galaxy S8+

* Device Ethernet Adapters: Cable Matters USB-C Multiport Video Adapter with Power Delivery [serial: 201048-BLK]

## Software Versions

### Server

* Target SDK: 26

* Node.js: 8.9.3

* npm: 6.0.1

* PostgreSQL: 9.6.9

### Android App

* Gradle: 3.1.0

* Google VR SDK: 1.120.0

* LibVLC: 3.0.0

* RxJava: 2.1.9

* RxAndroid: 2.0.2

## Further Work / Potential Improvements

* Controller page interface for selecting live streams

* Ability to set video dimensions via the controller (right now they are hardcoded). Wrong values cause the media
    to be poorly mapped onto the panorama surface.

* Viewport calculations are generated using the 'pos-generator.js' script. These calculations will need to
    be adjusted based on media dimensions.

* Proper interface for debug/dev page ("/moviecontrol").

* Since VLC is used as the android media player, it should be possible to use VLC for streaming on both ends
   without Wowza. The possible complication could be the SDP file which I have been relying on Wowza to generate.


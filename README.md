# Sphere v2

## Overview

Sphere consists of an Android app and a control server that allow multiple android devices connected via ethernet 
to function together to display a single image. The server receives serial input from a rotary encoder to allow panning
through the image. The server also handles distribution of media files to the devices, and serves a control page to allow
users to select from among available media options.

## Setup

### Network

The network consists of a control server, router, and enough ethernet switches for
all of the phones.

The router subnet should be 192.168.1.0/24 and the control server should have the static IP
192.168.1.123 assigned to it. The phones can all have dynamic IPs.

### Server
The server needs PostgreSQL installed.

Create a database named 'sphere' and a new user with the same name. This new login will be used by the app.
At psql prompt (look up how to get here for your OS and postgres version):

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

By default a list of available images are shown.

The options shown on this page are populated from the directory `public/imagefiles`.
For each media item, if there is an image in `public\controller\thumbs` with the same name (minus extension), it will
be used as a thumbnail for that item.

Images are JPEGs. They must have extension '.jpeg'.

There is also a dev route ('/moviecontrol') with buttons mostly used for testing. One important button on this page is
'New Apk' which sends a command to each phone to download the android app at '<server-ip>:3000/sphere.apk'
and prompt for install. This allows for a reasonably fast mass-update when changes are needed in the android code.

### Phones

A device can register its position (row 01-11; col 01-11) with the server via a dialog box opened by tapping the upper right
corner 4 times.
Examples:
* The phone on the top row furthest to the left should be set to ‘0101’
* The phone on the bottom row furthest to the right should be set to ‘1105’

On registering a position, the server saves this number and the IP of the phone in its database so this position setting
will persist after restart.

## Test Hardware

* Control Server: Lenovo Thinkpad (OS: Ubuntu 17.10)

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

* RxJava: 2.1.9

* RxAndroid: 2.0.2

## Troubleshooting

* ISSUE: The image on one or a few of the phones stays still when the sphere is rotated.
        * Check hardware connection. Unplugging and then replugging the phone(s) usually fixes this. We have seen this happen with some of them when the power to the sphere is unplugged and then replugged.

* ISSUE: One or more phones is responding to rotation but is showing the wrong thing.
        * Most likely the phone needs to have its position set. This can be done by tapping the upper right corner of the screen 4 times and entering the position number in the window that pops up.
            * Every position is 4 numbers long
            * The first two numbers are the row number. 01 through 11
            * The second two numbers are the column number. 01 through 11
            * Examples:
                    * The phone on the top row furthest to the left is set to ‘0101’
                    * The phone on the bottom row furthest to the right is set to ‘1105’

        * If the position is already set correctly, it is probably displaying a different image from the other phones. Try setting an image (either the same one or a different one) 
                with the controller phone. If the problem remains, close the app and start it again from the home screen. It has a green android icon and is named  “Sphere Native.”

* ISSUE:  All of the phone images stay still. None respond to rotation.
        * This means there is no connection to the mac mini which lives on top of the sphere.
        Try restarting the mac by holding down the power button on the back corner until the white light on front turns off and then
        pressing the power button again, making sure the white light comes on again.

* ISSUE: setting an image from the controller phone has no effect.
        * Make sure the controller phone is connected to the correct network
        * SSID: spherenet
        * PASS: pizza247
        * Refresh the controller page by swiping downward to re-establish connection with the sphere.

* ISSUE: Controller phone is not displaying the controller page.
        * The page is bookmarked on the homescreen with the name ‘sphere’

## Further Work / Potential Improvements

* Better handling of different aspect ratios.


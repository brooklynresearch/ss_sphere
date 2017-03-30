# Tablet Wall

Walls are cool.

## Running locally
This application needs a PostgreSQL database to run.
A database named 'tabletwall' needs to exist before it can run.

You also need to create a '.env' file inside the root notesforkids folder.
It needs to look like this:

```
DATABASE_URL=postgres://user:password@localhost:5432/tabletwall
```
Where 'user' and 'password' correspond to a postgres user with the privilege
to access and modify the database.

Then install the dependencies

```bash
npm install
```

Then migrate the database schema

```bash
npm run migrate
```

Finally you can run the app

```bash
npm run dev
```

## What It Does
The main route serves the index page, which is for the wall tablets.
A websocket connection with the server is started when this page is loaded.

A device can register its wall position (1 - 50) with the server via the dropdown
menu and button on the index page.
On registering a position, the server responds with a command to display the new
position for the device.

A controller route ('/controller') loads a page that allows another device to
set any position to active or inactive via a menu and button.
This is also done with a websocket connection.
The controller view also has a button to reset all positions to 'inactive'

Once a position has been set to 'active,' the server finds the socket connections
of any devices that registered themselves in that position, if there are any, and 
sends individual commands to toggle their state. Right now this just activates a listener 
on the index view to toggle text between "Active" and "Not Active."

## Problems / Weird Stuff
None! I think...

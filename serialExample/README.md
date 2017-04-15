# Serial Example

Receiving Serial Comms from an encoder through Node.
Hardware needed:

	- Teensy 3.2
	- Accu-Coder : 716*-1200-S-S-6-D-S-N


## Packages:
Install package : serialport.  Assumes express is already installed.
```bash
npm install serailport --save
```

## Serial Port
Change the serial port in app.js if using a different Teensy.
```bash
"/dev/tty.usbmodem2037431"
```

## Serial Commands
Once a new serial command has been sent it will be saved in the EEPROM of the Teensy.  
So when the Teensy get turned off it will revert to the last setting sent to it.
### Changing the Timing Interval in Milliseconds
Enter the command below with a newline and carriage return into the serial port
```bash
TIME 50
```
This will save the timing interval to update every 50 milliseconds

Enter the command below with a newline and carriage return into the serial port
```bash
SENS 20
```
This will save the encoder resolution to 20.  So it will return a value only after at least 20 steps have been counted.


Enter the command below with a newline and carriage return into the serial port
```bash
MAX 70000
```
This will save the maximum amount of steps the encoder can rotate before reverting back to 0.


Enter the command below with a newline and carriage return into the serial port
```bash
STAT
```
This command will return the current position, timing interval, encoder resolution, and maximum steps in JSON format.
Example:
```json
{"status": {
	"position": 25667,
	"interval": 30,
	"resolution": 10,
	"max_steps": 36000
}}
```




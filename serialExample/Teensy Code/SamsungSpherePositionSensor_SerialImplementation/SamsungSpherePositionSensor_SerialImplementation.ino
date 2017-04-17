#include <Ethernet.h>
#include <EthernetUdp.h>
#include <SPI.h>    
#include <OSCBundle.h>
#include <OSCTiming.h>
#include <Encoder.h>
#include <EEPROM.h>

EthernetUDP Udp;

//the Teensy's IP
IPAddress ip(192, 168, 1, 201);
//IPAddress ip(192, 168, 0, 201);
//destination IP
IPAddress outIp(192, 168, 1, 200);
//IPAddress outIp(192, 168, 0, 126);
const unsigned int outPort = 12345;

byte mac[] = {  
  0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };

//====================================================================================================
// Serial Callback Command Setup
//====================================================================================================
//#define SERIALCOMMANDDEBUG        // Debug Mode. Use this define statement for Serial Print out readings.
#define SERIALCOMMAND Serial      // Which UART will we be sending/receiving commands from

#define SERIALCOMMANDBUFFER 256   // Buffer size of the command Serial port
#define MAXSERIALCOMMANDS  10     // 
#define MAXDELIMETER 2
#define SERIALBAUDRATE 115200

char inChar;                              // A character read from the serial stream 
char serialBuffer[SERIALCOMMANDBUFFER];   // Buffer of stored characters while waiting for terminator character
int  bufPos;                              // Current position in the buffer
char delim[MAXDELIMETER];                 // null-terminated list of character to be used as delimeters for tokenizing (default " ")
char terminator = '\r';                   // Character that signals end of command (default '\r')
char *token;                              // Returned token from the command buffer as returned by strtok_r
char *last;                               // State variable used by strtok_r during processing
typedef struct _callback {
  char serialCommand[SERIALCOMMANDBUFFER];
  void (*function)();
} SerialCommandCallback;            // Data structure to hold Command/Handler function key-value pairs
int numCommand;
SerialCommandCallback CommandList[MAXSERIALCOMMANDS];   // Actual definition for command/handler array
void (*defaultHandler)();   

Encoder myEnc(2, 3);

// EEPROM ADDRESSES //
long timeIntervalAddress = 0;
long maxStepsAddress = 4;
long encoderResolutionAddress = 8;

uint32_t TIME_INTERVAL = 30;
uint32_t FULL_ROTATION = 36000;
uint32_t STEP_RESOLUTION = 10;
uint32_t lastRecordedTiming = 0;

bool firstTime = true;

long oldPosition  = 0;

void setup() {
  Ethernet.begin(mac,ip);
  Udp.begin(8888);
  Serial.begin(115200);

  strncpy(delim," ",MAXDELIMETER);  // strtok_r needs a null-terminated string
  numCommand=0;    // Number of callback handlers installed
  clearSerialBuffer();
  
  addSerialCommand("TIME",changeTiming);             // Change encoder update timing
  addSerialCommand("SENS", changeEncoderResolution); // Change encoder resoution
  addSerialCommand("MAX", changeMaxSteps);           // Change the maximum amount of steps
  addSerialCommand("STAT", returnJSONStatus);     // Echos the string argument back
  addDefaultHandler(unrecognized);  // Handler for command that isn't matched  (says "What?") 

  initializeGlobals();

  #ifdef SERIALCOMMANDDEBUG
  Serial.println(F("ENCODER CONTROLLER:"));
  Serial.println(F("\t\"COMMANDS LIST"));
  Serial.println(F("\t\"TIME\" - Changes how fast you get updates from the encoder "));
  Serial.println(F("\t\"SENS\" - Changes how much resolution you want from the encoder "));
  Serial.println(F("\t\"MAX\"  - Changes the maximum amount of steps per full revolution"));
  Serial.println(F("\t\"STAT\" - Get back what the current position, timing, resolution, and max steps "));
  Serial.println(F("==================================================================="));
  Serial.print("CURRENT STATUS: ");printCurrentStatus();
  Serial.println(F("==================================================================="));
  #endif
  lastRecordedTiming = millis();
}


void loop() {
  readSerialCommand();
  if(millis() - lastRecordedTiming > TIME_INTERVAL){
    lastRecordedTiming = millis();
    long currentReading = myEnc.read();
    /* Check to see if the encoder has gone to the negative value.
     * If it has decrease the values from the Full Rotation.
     * So if you start seeing a -1 value send the FULL_ROTATION Value.
     * If you see a -100 value send FULL_ROTATION - 99, etc.
     * And Modulo that shit, so you don't go over the FULL_ROTATION value.
     */
    if(currentReading < 0){
      currentReading = FULL_ROTATION - ((currentReading * -1)%FULL_ROTATION);
    }
    
    long newPosition = abs(currentReading % FULL_ROTATION);
    if ((newPosition >= oldPosition + STEP_RESOLUTION)||(newPosition <= oldPosition - STEP_RESOLUTION)) {
      oldPosition = newPosition;
      //sendOutPosition(newPosition);
      if(newPosition){
        firstTime = false;
      }
      if(!firstTime){
        Serial.println(newPosition);
      }
      //Serial.print("NEW POS: ");Serial.println(newPosition);
    }
  }
}

void sendOutPosition(int32_t encoderPosition){
  OSCMessage msg("/pos/encoder/");
  msg.add((int32_t)encoderPosition);
  Udp.beginPacket(outIp, outPort);
  msg.send(Udp); // send the bytes to the SLIP stream
  Udp.endPacket(); // mark the end of the OSC Packet
  msg.empty(); // free space occupied by message
}

void addSerialCommand(const char *command, void (*function)())
{
 if (numCommand < MAXSERIALCOMMANDS) {
    #ifdef SERIALCOMMANDDEBUG
    Serial.print(numCommand); 
    Serial.print("-"); 
    Serial.print("Adding command for "); 
    Serial.println(command); 
    #endif
    
    strncpy(CommandList[numCommand].serialCommand,command,SERIALCOMMANDBUFFER); 
    CommandList[numCommand].function = function; 
    numCommand++; 
  } else {
    // In this case, you tried to push more commands into the buffer than it is compiled to hold.  
    // Not much we can do since there is no real visible error assertion, we just ignore adding
    // the command
    #ifdef SERIALCOMMANDDEBUG
    Serial.println("Too many handlers - recompile changing MAXSERIALCOMMANDS"); 
    #endif 
  }
}

void readSerialCommand() 
{
 // If we're using the Hardware port, check it.   Otherwise check the user-created SoftwareSerial Port
  while (SERIALCOMMAND.available() > 0) 
  {
    int i; 
    boolean matched; 
    inChar = SERIALCOMMAND.read();   // Read single available character, there may be more waiting
    #ifdef SERIALCOMMANDDEBUG
    SERIALCOMMAND.print(inChar);   // Echo back to serial stream
    #endif
    if (inChar == terminator) {     // Check for the terminator (default '\r') meaning end of command
      #ifdef SERIALCOMMANDDEBUG
      SERIALCOMMAND.print("Received: "); 
      SERIALCOMMAND.println(serialBuffer);
        #endif
      bufPos=0;           // Reset to start of buffer
      token = strtok_r(serialBuffer,delim,&last);   // Search for command at start of buffer
      if (token == NULL) return; 
      matched=false; 
      for (i=0; i<numCommand; i++) {
        #ifdef SERIALCOMMANDDEBUG
        Serial.print("Comparing ["); 
        Serial.print(token); 
        Serial.print("] to [");
        Serial.print(CommandList[i].serialCommand);
        Serial.println("]");
        #endif
        // Compare the found command against the list of known commands for a match
        if (strncmp(token,CommandList[i].serialCommand,SERIALCOMMANDBUFFER) == 0) 
        {
          #ifdef SERIALCOMMANDDEBUG
          Serial.print("Matched Command: "); 
          Serial.println(token);
          #endif
          // Execute the stored handler function for the command
          (*CommandList[i].function)(); 
          clearSerialBuffer(); 
          matched=true; 
          break; 
        }
      }
      if (matched==false) {
        (*defaultHandler)(); 
        clearSerialBuffer(); 
      }

    }
    if (isprint(inChar))   // Only printable characters into the buffer
    {
      serialBuffer[bufPos++]=inChar;   // Put character into buffer
      serialBuffer[bufPos]='\0';  // Null terminate
      if (bufPos > SERIALCOMMANDBUFFER-1) bufPos=0; // wrap buffer around if full  
    }
  }
}

char *nextArgument() 
{
 char *nextToken;
  nextToken = strtok_r(NULL, delim, &last); 
  return nextToken; 
}

void clearSerialBuffer()
{
  for (int i=0; i<SERIALCOMMANDBUFFER; i++) 
  {
    serialBuffer[i]='\0';
  }
  bufPos=0; 
}

void addDefaultHandler(void (*function)())
{
  defaultHandler = function;
}

void changeTiming() {
  char *arg;  
  arg = nextArgument();    // Get the next argument from the SerialCommand object buffer
  if (arg != NULL)      // As long as it existed, take it
  {
    int newTiming = atoi(arg);
    #ifdef SERIALCOMMANDDEBUG
    Serial.print("Timing Interval changes to: "); 
    Serial.println(newTiming); 
    #endif
    TIME_INTERVAL = newTiming;
    writeLongToEEPROM(timeIntervalAddress, TIME_INTERVAL);
  } 
  else {
    Serial.println("No argument supplied.  Please enter a number between 0 - Whatever"); 
  }
}

void changeEncoderResolution() {
  char *arg;  
  arg = nextArgument();    // Get the next argument from the SerialCommand object buffer
  if (arg != NULL)         // As long as it existed, take it
  {
    int newResolution = atoi(arg);
    #ifdef SERIALCOMMANDDEBUG
    Serial.print("Encoder Resolution changes to: "); 
    Serial.println(newResolution); 
    #endif
    STEP_RESOLUTION = newResolution;
    writeLongToEEPROM(encoderResolutionAddress, STEP_RESOLUTION);
  } 
  else {
    Serial.println("No argument supplied.  Please enter a number between 0 - Whatever"); 
  }
}

void changeMaxSteps() {
  char *arg;  
  arg = nextArgument();    // Get the next argument from the SerialCommand object buffer
  if (arg != NULL)         // As long as it existed, take it
  {
    int maxSteps = atoi(arg);
    #ifdef SERIALCOMMANDDEBUG
    Serial.print("Maxium amount of steps changes to: "); 
    Serial.println(maxSteps); 
    #endif
    FULL_ROTATION = maxSteps;
    writeLongToEEPROM(maxStepsAddress, FULL_ROTATION);
  } 
  else {
    Serial.println("No argument supplied.  Please enter a number between 0 - Whatever"); 
  }
}

void returnJSONStatus() {
  Serial.println(F("{\"status\": {"));
    Serial.print(F("\t\"position\": "));Serial.print(oldPosition);Serial.println(F(","));
    Serial.print(F("\t\"interval\": "));Serial.print(TIME_INTERVAL);Serial.println(F(","));
    Serial.print(F("\t\"resolution\": "));Serial.print(STEP_RESOLUTION);Serial.println(F(","));
    Serial.print(F("\t\"max_steps\": "));Serial.print(FULL_ROTATION);Serial.println();
  Serial.println(F("}}"));

  
}

void printCurrentStatus(){
  Serial.print("\tPOS: ");Serial.print(oldPosition);
  Serial.print("\tTIME_INT: ");Serial.print(TIME_INTERVAL);
  Serial.print("\tENC_RES: ");Serial.print(STEP_RESOLUTION);
  Serial.print("\tMAX_STEPS: ");Serial.print(FULL_ROTATION);
  Serial.println();
}

void unrecognized(){
  Serial.println("¿QUE?");
}

void writeLongToEEPROM(int startAddr, long newValue){
  //Decomposition from a long to 4 bytes by using bitshift.
  //One = Most significant -> Four = Least significant byte
  byte four = (newValue & 0xFF);
  byte three = ((newValue >> 8) & 0xFF);
  byte two = ((newValue >> 16) & 0xFF);
  byte one = ((newValue >> 24) & 0xFF);

  //Write the 4 bytes into the eeprom memory.
  EEPROM.write(startAddr, four);
  EEPROM.write(startAddr + 1, three);
  EEPROM.write(startAddr + 2, two);
  EEPROM.write(startAddr + 3, one);
}

long readLongFromEEPROM(long startAddr){
  //Read the 4 bytes from the eeprom memory.
  long four = EEPROM.read(startAddr);
  long three = EEPROM.read(startAddr + 1);
  long two = EEPROM.read(startAddr + 2);
  long one = EEPROM.read(startAddr + 3);

  //Return the recomposed long by using bitshift.
  return ((four << 0) & 0xFF) + ((three << 8) & 0xFFFF) + ((two << 16) & 0xFFFFFF) + ((one << 24) & 0xFFFFFFFF);
}

// Check the last saved values of the EEPROM
void initializeGlobals(){
  uint32_t newValue = readLongFromEEPROM(timeIntervalAddress);
  if(newValue != -1){ // Make sure a value has been saved.
    TIME_INTERVAL = newValue;
  }
  
  newValue = readLongFromEEPROM(maxStepsAddress);
  if(newValue != -1){ // Make sure a value has been saved.
    FULL_ROTATION = newValue;
  }
  
  newValue = readLongFromEEPROM(encoderResolutionAddress);
  if(newValue != -1){ // Make sure a value has been saved.
    STEP_RESOLUTION = newValue;
  }
}


#include <Ethernet.h>
#include <EthernetUdp.h>
#include <SPI.h>    
#include <OSCBundle.h>
#include <OSCTiming.h>
#include <Encoder.h>

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

Encoder myEnc(2, 3);


const int32_t FULL_ROTATION = 36000;
const int32_t STEP_RESOLUTION = 10;

void setup() {
  Ethernet.begin(mac,ip);
  Udp.begin(8888);
  Serial.begin(115200);
  Serial.println("Basic Encoder Test:");
}

long oldPosition  = -999;

void loop() {
  long newPosition = abs(myEnc.read() % FULL_ROTATION);
  if ((newPosition >= oldPosition + STEP_RESOLUTION)||(newPosition <= oldPosition - STEP_RESOLUTION)) {
    oldPosition = newPosition;
    //sendOutPosition(newPosition);
    Serial.println(newPosition);
    //Serial.print("NEW POS: ");Serial.println(newPosition);
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


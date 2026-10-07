// Library
#include <SoftwareSerial.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <MPU6050.h>

//Create software serial object to communicate with A6
SoftwareSerial mySerial(10, 11);
Stream* stream = &mySerial;

// Your GPRS credentials, if any
#define apn "telkomsel"

// MODEM
// The API key can be obtained from Firebase console > Project Overview > Project settings.
#define FIREBASE_AUTH "FIREBASE_API"

// User Email and password that already registerd or added in your project.
// #define USER_EMAIL "USER_EMAIL"
// #define USER_PASSWORD "USER_PASSWORD"
#define DATABASE_URL "iot-behaviour-driving-default-rtdb.asia-southeast1.firebasedatabase.app"

unsigned long ms = 0;
int UTC_Offset = 7;

// Variable for MPU6050
float gravityX = 0, gravityY = 0, gravityZ = 0;
const float smoothingFactor = 0.3;

// Set rentang akselerometer dan giroskop
mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
mpu.setGyroRange(MPU6050_RANGE_250_DEG);
mpu.setFilterBandwidth(MPU6050_BAND_94_HZ);

// Dapatkan pembacaan sensor baru
sensors_event_t a, g, temp;
mpu.getEvent(&a, &g, &temp);

// Aplikasi filter low-pass untuk mendapatkan komponen gravitasi
gravityX = (1 - smoothingFactor) * gravityX + smoothingFactor * a.acceleration.x;
gravityY = (1 - smoothingFactor) * gravityY + smoothingFactor * a.acceleration.y;
gravityZ = (1 - smoothingFactor) * gravityZ + smoothingFactor * a.acceleration.z;

// Hapus komponen gravitasi dari pembacaan akselerometer 
float linearAccelerationX = a.acceleration.x - gravityX;
float linearAccelerationY = a.acceleration.y - gravityY;
float linearAccelerationZ = a.acceleration.z - gravityZ;
float gyroX=g.gyro.x;
float gyroY=g.gyro.y;
float gyroZ=g.gyro.z;
//int16_t ax, ay, az;
//int16_t gx, gy, gz;

// Pembacaan Karakter Pengemudi
float karakter[]={linearAccelerationX,linearAccelerationY,linearAccelerationZ,gyroX,gyroY,gyroZ};
int nilaikarakter = predict(Karakter);
String hasil = convertToString(nilaikarakter);
char buffer[7];
String PIN = "772632";

// Initialize Instance MPU6050
MPU6050 mpu6050;

bool gprsInit();
bool gprsConnect();
bool gprsDisconnect();

void setup()
{
    mySerial.begin(9600);
    Serial.begin(9600);
    // Initialize MPU6050
    Wire.begin();
    mpu6050.initialize();
    
    Serial.print("MPU6050 module connection ");
    Serial.println(mpu6050.testConnection() ? "successful." : "failed.");
    // Initialize SIM808
    while(!SIMInit()){
      Serial.println("Not Connected");
      delay(5000);
    }
    Serial.println("SIM CONNECTED");
    // Connecting GSM to Internet
    gprsInit();
    gprsConnect();
    Connect_Server("/" + PIN +String(".json?auth=") + FIREBASE_AUTH); // Connecting to Firebase Server
}

void loop()
{
  String response;
  String testdata;
  testdata = Data_Upload();
  Upload_Server("POST", testdata, response);
  delay(4000);
}


/**************************************************************
 * AT commands stuff
 **************************************************************/

typedef const __FlashStringHelper* GsmConstStr;

void sendAT(const String& cmd) {
  stream->print("AT");
  stream->println(cmd);
}

uint8_t waitResponse(uint32_t timeout, GsmConstStr r1,
                     GsmConstStr r2 = NULL, GsmConstStr r3 = NULL)
{
  String data;
  data.reserve(64);
  int index = 0;
  for (unsigned long start = millis(); millis() - start < timeout; ) {
    while (stream->available() > 0) {
      int c = stream->read();
      if (c < 0) continue;
      data += (char)c;
      if (data.indexOf(r1) >= 0) {
        index = 1;
        goto finish;
      } else if (r2 && data.indexOf(r2) >= 0) {
        index = 2;
        goto finish;
      } else if (r3 && data.indexOf(r3) >= 0) {
        index = 3;
        goto finish;
      }
    }
  }
finish:
  return index;
}


uint8_t waitResponse(GsmConstStr r1,
                     GsmConstStr r2 = NULL, GsmConstStr r3 = NULL)
{
  return waitResponse(1000, r1, r2, r3);
}

uint8_t waitOK_ERROR(uint32_t timeout = 1000) {
  return waitResponse(timeout, F("OK\r\n"), F("ERROR\r\n"));
}

bool SIMInit(){
    sendAT("");
    if (waitResponse(1000L, F("")) != 1) {
      return false;
    }
    sendAT(F("+CFUN=1"));
    waitOK_ERROR();
    return true;
}

bool gprsInit()
{
  gprsDisconnect();
  sendAT(F("E0"));
  waitOK_ERROR();

  sendAT(F("+SAPBR=3,1,\"Contype\",\"GPRS\""));
  waitOK_ERROR();

  sendAT(F("+SAPBR=3,1,\"APN\",\"" apn "\""));
  waitOK_ERROR();

  sendAT(F("+CGDCONT=1,\"IP\",\"" apn "\""));
  waitOK_ERROR();
  return true;
}

// Start the GSM connection
bool gprsConnect()
{
  Serial.println("Connecting to GSM...");

  sendAT(F("+CGACT=1,1"));
  waitOK_ERROR(1000L);

  // Open a GPRS context
  sendAT(F("+SAPBR=1,1"));
  waitOK_ERROR(1000L);
  // Query the GPRS context
  sendAT(F("+SAPBR=2,1"));
  if (waitOK_ERROR(1000L) != 1)
    return false;
  Serial.println("GSM connected");
  return true;
}

// Disconnect GSM Connection
bool gprsDisconnect() {
  sendAT(F("+SAPBR=0,1"));
  if (waitOK_ERROR(1000L) != 1)
    return;
  sendAT(F("+CGACT=0"));
  Serial.println("GSM disconnected");
  return true;
}

/**************************************************************
 * Firebase commands stuff
 **************************************************************/

int Connect_Server(const String& url)
{
  Serial.print(F("  Request: "));
  Serial.print(DATABASE_URL);
  Serial.println(url);

  sendAT(F("+HTTPTERM"));
  waitOK_ERROR();

  sendAT(F("+HTTPINIT"));
  waitOK_ERROR();

  sendAT(F("+HTTPPARA=\"CID\",1"));
  waitOK_ERROR();

  sendAT(String(F("+HTTPPARA=\"URL\",\"https://")) + DATABASE_URL + url + "\"");
  waitOK_ERROR();
  
  sendAT(F("+HTTPPARA=\"REDIR\",1"));
  waitOK_ERROR();
  
  sendAT(F("+HTTPSSL=1"));
  waitOK_ERROR();
}

int Upload_Server(const String& method,
                const String& request,
                String&       response){
  if (request.length()) {
    sendAT(F("+HTTPPARA=\"CONTENT\",\"application/json\""));
    waitOK_ERROR();
    sendAT(String(F("+HTTPDATA=")) + request.length() + "," + 10000);
    waitResponse(F("DOWNLOAD\r\n"));
    stream->print(request);
    waitOK_ERROR();
  }

  if (method == "GET") {
    sendAT(F("+HTTPACTION=0"));
  } else if (method == "POST") {
    sendAT(F("+HTTPACTION=1"));
  } else if (method == "HEAD") {
    sendAT(F("+HTTPACTION=2"));
  } else if (method == "DELETE") {
    sendAT(F("+HTTPACTION=3"));
  }
  waitOK_ERROR();

  if (waitResponse(10000L, F("+HTTPACTION:")) != 1) {
    Serial.println("HTTPACTION Timeout Action");
    return false;
  }
  stream->readStringUntil(',');
  int code = stream->readStringUntil(',').toInt();
  size_t len = stream->readStringUntil('\n').toInt();

  if (code != 200) {
    delay(10000);
    Serial.print("Error Code:");
    Serial.println(code);
    Connect_Server(String("/.json?auth=") + FIREBASE_AUTH);
    return false;
  }

  response = "";

  if (len > 0) {
    response.reserve(len);

    sendAT(F("+HTTPREAD"));
    if (waitResponse(10000L, F("+HTTPREAD: ")) != 1) {
      Serial.println("HTTPREAD Timeout Read");
      return false;
    }
    len = stream->readStringUntil('\n').toInt();

    while (len--) {
      while (!stream->available()) {
        delay(1);
      }
      response += (char)(stream->read());
    }
    waitOK_ERROR();
  }

  return true;                  
}

/**************************************************************
 * Data Collecting stuff
 **************************************************************/



String Data_Upload(){
  JsonDocument doc;
  int len = 8;
  String dated;
  
  sendAT("+CGNSPWR=1");
  waitOK_ERROR();
  sendAT("+CGNSINF");
  stream->readStringUntil(',');
  
  while(!stream->readStringUntil(',').toInt()){
    delay(1000);
    sendAT("+CGNSINF");
    stream->readStringUntil(','); 
  }
  
  while (len--) {
      while (!stream->available()) {
        delay(1);
      }
      dated += (char)(stream->read());
    }
    
  String datetime = stream->readStringUntil(',');
  datetime.trim();
  int year_1 = dated.toInt() /10000; 
  int month_1  = (dated.toInt() / 100) % 100;
  int day_1 = dated.toInt() % 100;
  int hour_1     =  datetime.toInt() / 10000;
  hour_1 += UTC_Offset;
  if (hour_1 > 24){
    hour_1 -= 24;
    day_1 += 1;
  }
  int minute_1  = (datetime.toInt() / 100) % 100;
  int second_1 = datetime.toInt() % 100;
  
  float latloc = stream->readStringUntil(',').toFloat();  
  float lonloc = stream->readStringUntil(',').toFloat();
  stream->readStringUntil(',');  
  float wspeed = stream->readStringUntil(',').toFloat() * 1.852;
  stream->readStringUntil('\n');
  waitOK_ERROR();
  sendAT("+CGNPSPWR=0");
  waitOK_ERROR();

  int sign;
  sendAT("+CSQ");
  stream->readStringUntil(' ');
  sign = stream->readStringUntil(',').toInt();
  stream->readStringUntil('\n'); 
  sign = ((sign-2)*2)-109;  
  
  char datime[20];
  sprintf(datime,"%02d/%02d/%02d %02d:%02d:%02d", year_1, month_1, day_1, hour_1, minute_1, second_1);
  if (wspeed < 5){
    wspeed = 0;
  }
  
  doc["Timestamp"] = datime;
  doc["Latitude"]  = latloc;
  doc["Longitude"] = lonloc;
  doc["Kecepatan"] = wspeed;
  doc["Karakter"]  = "Tenang";
  doc["Battery Level"]     = "50%";
  doc["Cellular Strength"] = sign;
  
  Serial.println("No Time");
  serializeJsonPretty(doc, Serial);
  Serial.println("Nothing Here");
  delay(1000);
  String sendtoserver;
  serializeJson(doc, sendtoserver);
  return sendtoserver;
}

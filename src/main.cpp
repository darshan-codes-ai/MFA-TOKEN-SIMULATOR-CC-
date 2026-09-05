#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include "esp_system.h"
#include "secrets.h"

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define BUTTON_PIN 4

#define OTP_VALIDITY_MS 30000UL
#define DEBOUNCE_MS 250UL

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
WiFiClientSecure net;
PubSubClient client(net);

bool otpActive = false;
uint32_t otpValue = 0;
unsigned long otpGeneratedAt = 0;
int lastSecondsLeft = -1;

bool lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;

void drawIdleScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("MFA Token Simulator");
  display.setCursor(0, 20);
  display.println("Ready. Press button");
  display.println("to generate OTP.");
  display.display();
}

void drawOtpScreen(uint32_t otp, int secondsLeft) {
  char otpStr[7];
  snprintf(otpStr, sizeof(otpStr), "%06u", otp);

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Your OTP:");

  display.setTextSize(2);
  display.setCursor(10, 20);
  display.println(otpStr);

  display.setTextSize(1);
  display.setCursor(0, 50);
  display.print("Valid: ");
  display.print(secondsLeft);
  display.println("s");

  display.display();
}

void drawResultScreen(bool verified) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Cloud says:");

  display.setTextSize(2);
  display.setCursor(0, 28);
  display.println(verified ? "VERIFIED" : "REJECTED");

  display.display();
}

// Called automatically by PubSubClient whenever a message arrives on mfa/result
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Result received: ");
  Serial.println(message);

  bool verified = message.indexOf("\"verified\": true") != -1;

  otpActive = false; // stop the countdown, we're showing the result instead
  drawResultScreen(verified);
  delay(3000); // hold the result on screen briefly before returning to idle
  drawIdleScreen();
}

void connectWiFi() {
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected. IP: " + WiFi.localIP().toString());
}

void connectAWS() {
  net.setCACert(AWS_CERT_CA);
  net.setCertificate(AWS_CERT_CRT);
  net.setPrivateKey(AWS_CERT_PRIVATE);
  client.setServer(AWS_IOT_ENDPOINT, 8883);
  client.setCallback(mqttCallback);

  Serial.print("Connecting to AWS IoT Core");
  while (!client.connected()) {
    if (client.connect(THING_NAME)) {
      Serial.println("\nConnected to AWS IoT Core!");
      client.subscribe(MQTT_SUB_TOPIC);
    } else {
      Serial.print(".");
      delay(1000);
    }
  }
}

void publishOtpToCloud(uint32_t otp) {
  if (!client.connected()) {
    Serial.println("MQTT not connected, skipping publish.");
    return;
  }
  char payload[128];
  snprintf(payload, sizeof(payload),
           "{\"deviceId\":\"%s\",\"otp\":\"%06u\",\"timestamp\":%lu}",
           THING_NAME, otp, millis());
  client.publish(MQTT_PUB_TOPIC, payload);
  Serial.print("Published: ");
  Serial.println(payload);
}

uint32_t generateOtp() {
  return esp_random() % 1000000UL;
}

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED init failed");
    while (true) delay(10);
  }

  drawIdleScreen();

  connectWiFi();
  connectAWS();

  Serial.println("Setup complete. Waiting for button press...");
}

void loop() {
  if (!client.connected()) {
    connectAWS();
  }
  client.loop();

  bool reading = digitalRead(BUTTON_PIN);
  unsigned long now = millis();

  if (reading == LOW && lastButtonState == HIGH && (now - lastDebounceTime) > DEBOUNCE_MS) {
    lastDebounceTime = now;

    otpValue = generateOtp();
    otpGeneratedAt = now;
    otpActive = true;
    lastSecondsLeft = -1;

    Serial.print("Generated OTP: ");
    Serial.println(otpValue);

    publishOtpToCloud(otpValue);
  }
  lastButtonState = reading;

  if (otpActive) {
    unsigned long elapsed = now - otpGeneratedAt;
    if (elapsed >= OTP_VALIDITY_MS) {
      otpActive = false;
      Serial.println("OTP expired.");
      drawIdleScreen();
    } else {
      int secondsLeft = (OTP_VALIDITY_MS - elapsed) / 1000 + 1;
      if (secondsLeft != lastSecondsLeft) {
        lastSecondsLeft = secondsLeft;
        drawOtpScreen(otpValue, secondsLeft);
      }
    }
  }
}
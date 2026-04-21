#include <WiFi.h>
#include <WebServer.h>

// Update these before uploading.
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const uint16_t HTTP_PORT = 80;

WebServer server(HTTP_PORT);

void printBody(const char* routeName) {
  const String body = server.arg("plain");
  Serial.printf("[%s] Body length: %u\n", routeName, static_cast<unsigned int>(body.length()));
  Serial.println(body);
}

void handleCopilotProgress() {
  if (!server.hasArg("plain")) {
    server.send(400, "text/plain", "Expected request body.");
    return;
  }

  Serial.println();
  Serial.println("=== POST /copilot/progress ===");
  printBody("/copilot/progress");
  Serial.println("==============================");

  server.send(204, "text/plain", "");
}

void handlePrintText() {
  if (!server.hasArg("plain")) {
    server.send(400, "text/plain", "Expected request body.");
    return;
  }

  Serial.println();
  Serial.println("=== POST /print-text ===");
  printBody("/print-text");
  Serial.println("========================");

  server.send(204, "text/plain", "");
}

void handleNotFound() {
  String message = "Route not found. Use POST /copilot/progress or POST /print-text.\n";
  message += "Method: ";
  message += (server.method() == HTTP_POST) ? "POST" : "OTHER";
  message += "\nURI: ";
  message += server.uri();
  message += "\n";
  server.send(404, "text/plain", message);
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.printf("Connecting to Wi-Fi SSID '%s'", WIFI_SSID);
  unsigned long startMs = millis();

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');

    if (millis() - startMs > 30000) {
      Serial.println("\nWi-Fi connection timeout. Rebooting...");
      ESP.restart();
    }
  }

  Serial.println("\nWi-Fi connected.");
  Serial.print("ESP32-S3 IP: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  Serial.begin(115200);
  delay(500);

  connectWiFi();

  server.on("/copilot/progress", HTTP_POST, handleCopilotProgress);
  server.on("/print-text", HTTP_POST, handlePrintText);
  server.onNotFound(handleNotFound);

  server.begin();
  Serial.printf("HTTP server listening on port %u\n", HTTP_PORT);
}

void loop() {
  server.handleClient();
}

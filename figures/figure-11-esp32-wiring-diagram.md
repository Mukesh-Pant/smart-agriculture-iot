# Figure 11: ESP32 Sensor Wiring Diagram (Wokwi)

**Report location:** Appendix C — ESP32 Wiring Guide
**Tool:** Wokwi (https://wokwi.com) — free, browser-based, simulatable
**Output:** screenshot of the Wokwi canvas
**Caption to use in report:** *Figure 11: ESP32 Sensor Wiring Diagram*

## Important: what Wokwi can and cannot show
Wokwi has a real **ESP32** and a real **DHT22**, but it has **no** PH-4502C module and **no** capacitive soil-moisture module. Those two analog sensors are represented by **potentiometers**, which is the standard Wokwi stand-in for an analog sensor: the wiper feeds a 0–3.3 V analog signal into the ESP32 ADC pin, exactly as the real sensor output would. The wiring (which GPIO, power, ground) is therefore 100% accurate; only the sensor *body* differs visually.

Pin mapping matches Table 14 of the report:

| Signal | ESP32 pin | Wokwi part | Notes |
|---|---|---|---|
| DHT22 data | GPIO 4 | `wokwi-dht22` | 10 kΩ pull-up to 3V3 included |
| Soil moisture (analog) | GPIO 34 (ADC1_CH6, input-only) | potentiometer `soil` | stand-in for capacitive sensor |
| pH (analog) | GPIO 35 (ADC1_CH7, input-only) | potentiometer `ph` | stand-in for PH-4502C |

> Note on pH power: the real PH-4502C is powered at **5 V** (onboard regulator, output 0–3.3 V) per Table 14. The Wokwi potentiometer stand-in is wired to **3V3** so the simulated analog voltage stays within the ESP32 ADC range. Mention this in your figure caption or text if you want to be precise.

## Steps
1. Go to https://wokwi.com → **New Project** → choose **ESP32** (MicroPython or Arduino — either is fine for a wiring screenshot).
2. Click the **`diagram.json`** tab and replace its entire contents with the JSON below.
3. The canvas will render the ESP32, DHT22, the pull-up resistor, and the two potentiometers, fully wired.
4. (Optional) paste the MicroPython code so the simulation runs and shows live values for a more convincing screenshot.
5. Drag parts if you want a tidier layout, then take a clean screenshot of the canvas.

## diagram.json (paste into the diagram.json tab)
```json
{
  "version": 1,
  "author": "Smart Agriculture IoT",
  "editor": "wokwi",
  "parts": [
    { "type": "board-esp32-devkit-c-v4", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    { "type": "wokwi-dht22", "id": "dht", "top": -120, "left": 260, "attrs": {} },
    { "type": "wokwi-resistor", "id": "r1", "top": -40, "left": 210, "rotate": 90, "attrs": { "value": "10000" } },
    { "type": "wokwi-potentiometer", "id": "soil", "top": 110, "left": 250, "attrs": {} },
    { "type": "wokwi-potentiometer", "id": "ph", "top": 270, "left": 250, "attrs": {} }
  ],
  "connections": [
    [ "esp:3V3", "dht:VCC", "red", [] ],
    [ "esp:GND.1", "dht:GND", "black", [] ],
    [ "esp:4", "dht:SDA", "green", [] ],
    [ "r1:1", "dht:SDA", "limegreen", [] ],
    [ "r1:2", "esp:3V3", "red", [] ],

    [ "esp:3V3", "soil:VCC", "red", [] ],
    [ "esp:GND.2", "soil:GND", "black", [] ],
    [ "esp:34", "soil:SIG", "blue", [] ],

    [ "esp:3V3", "ph:VCC", "red", [] ],
    [ "esp:GND.3", "ph:GND", "black", [] ],
    [ "esp:35", "ph:SIG", "purple", [] ]
  ]
}
```

## Optional simulation code (NOT needed for a wiring screenshot)

You only need this if you want the sim to run and show live values. **For the figure itself, skip it** — the diagram renders from `diagram.json` alone.

> IMPORTANT — language must match the project type:
> - The Python below is **MicroPython**; it only runs in a Wokwi **MicroPython ESP32** project, where the code lives in **`main.py`**.
> - If your project was created as an **Arduino** project (file **`sketch.ino`**), pasting Python will fail to compile (`stray '#'`, `'from' does not name a type`, ...). In that case use the **Arduino/C++ version** further below instead.

### MicroPython version (for a MicroPython ESP32 project → `main.py`)
```python
from machine import Pin, ADC
import dht, time

d = dht.DHT22(Pin(4))
soil = ADC(Pin(34)); soil.atten(ADC.ATTN_11DB)   # 0..4095 over 0..3.3 V
ph   = ADC(Pin(35)); ph.atten(ADC.ATTN_11DB)

while True:
    try:
        d.measure()
        t, h = d.temperature(), d.humidity()
    except OSError:
        t = h = -1
    print("T={:.1f}C  H={:.1f}%  soil_adc={}  ph_adc={}".format(t, h, soil.read(), ph.read()))
    time.sleep(2)
```

### Arduino/C++ version (for an Arduino `sketch.ino` project)
Add the **DHT sensor library** in Wokwi's **Library Manager** tab first, then:
```cpp
#include "DHT.h"
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34
#define PH_PIN 35
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  analogReadResolution(12);                 // 0..4095
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);
  analogSetPinAttenuation(PH_PIN, ADC_11db);
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int soil = analogRead(SOIL_PIN);
  int ph   = analogRead(PH_PIN);
  Serial.printf("T=%.1fC  H=%.1f%%  soil_adc=%d  ph_adc=%d\n", t, h, soil, ph);
  delay(2000);
}
```

## Troubleshooting
- If a wire endpoint is underlined red, Wokwi didn't recognise the pin name. Click the part, hover its pins to read the exact names, and use Wokwi's autocomplete in `diagram.json`. ESP32 GPIOs are named `esp:4`, `esp:34`, `esp:35`; the board has three grounds: `esp:GND.1`, `esp:GND.2`, `esp:GND.3`.
- Wire colours are cosmetic (red = power, black = ground, others = signal).

---

## Recommended upgrade: labeled version (still 100% Wokwi, still free)

The plain potentiometers can read as "just knobs." Adding `wokwi-text` parts (a built-in, free Wokwi element) labels each analog stand-in with the real sensor name and its GPIO, directly on the canvas. This keeps the exact `diagram.json` workflow and makes the figure self-explanatory for an examiner. Paste this version instead of the one above:

```json
{
  "version": 1,
  "author": "Smart Agriculture IoT",
  "editor": "wokwi",
  "parts": [
    { "type": "board-esp32-devkit-c-v4", "id": "esp", "top": 0, "left": 0, "attrs": {} },
    { "type": "wokwi-dht22", "id": "dht", "top": -120, "left": 260, "attrs": {} },
    { "type": "wokwi-resistor", "id": "r1", "top": -40, "left": 210, "rotate": 90, "attrs": { "value": "10000" } },
    { "type": "wokwi-potentiometer", "id": "soil", "top": 110, "left": 250, "attrs": {} },
    { "type": "wokwi-potentiometer", "id": "ph", "top": 280, "left": 250, "attrs": {} },

    { "type": "wokwi-text", "id": "t_dht",  "top": -150, "left": 250, "attrs": { "text": "DHT22 — Temperature / Humidity (GPIO4)", "fontSize": "13", "color": "#dc2626" } },
    { "type": "wokwi-text", "id": "t_soil", "top": 120,  "left": 410, "attrs": { "text": "Capacitive Soil Moisture Sensor (analog) -> GPIO34", "fontSize": "13", "color": "#16a34a" } },
    { "type": "wokwi-text", "id": "t_ph",   "top": 290,  "left": 410, "attrs": { "text": "PH-4502C pH Sensor (analog) -> GPIO35", "fontSize": "13", "color": "#9333ea" } },
    { "type": "wokwi-text", "id": "t_note", "top": 380,  "left": 250, "attrs": { "text": "Analog sensors shown as potentiometers (Wokwi stand-in). Wiring & GPIO mapping are exact.", "fontSize": "12", "color": "#475569" } }
  ],
  "connections": [
    [ "esp:3V3", "dht:VCC", "red", [] ],
    [ "esp:GND.1", "dht:GND", "black", [] ],
    [ "esp:4", "dht:SDA", "green", [] ],
    [ "r1:1", "dht:SDA", "limegreen", [] ],
    [ "r1:2", "esp:3V3", "red", [] ],

    [ "esp:3V3", "soil:VCC", "red", [] ],
    [ "esp:GND.2", "soil:GND", "black", [] ],
    [ "esp:34", "soil:SIG", "blue", [] ],

    [ "esp:3V3", "ph:VCC", "red", [] ],
    [ "esp:GND.3", "ph:GND", "black", [] ],
    [ "esp:35", "ph:SIG", "purple", [] ]
  ]
}
```

Adjust each label's `top`/`left` so it sits neatly beside its sensor, then screenshot. If a label overlaps a wire, just nudge its coordinates.

### Suggested report caption (states the convention honestly)
> *Figure 11: ESP32 sensor wiring. The capacitive soil-moisture sensor (GPIO 34) and PH-4502C pH sensor (GPIO 35) provide analog voltages to the ESP32 ADC; they are represented in the Wokwi simulator by potentiometers, which produce the same 0–3.3 V analog signal. Wiring and GPIO mapping are identical to the physical build.*

## If you later want a true schematic look
Use **EasyEDA** (free, browser-based) for a formal schematic, or a Wokwi **community custom chip** if you want labeled sensor blocks instead of potentiometers. Both are more effort for a modest visual gain; the labeled version above is sufficient and accepted for an academic report.

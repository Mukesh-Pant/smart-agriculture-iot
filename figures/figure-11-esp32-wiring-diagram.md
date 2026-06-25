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

## Optional MicroPython code (sketch.py / main.py) so the sim runs
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

## Troubleshooting
- If a wire endpoint is underlined red, Wokwi didn't recognise the pin name. Click the part, hover its pins to read the exact names, and use Wokwi's autocomplete in `diagram.json`. ESP32 GPIOs are named `esp:4`, `esp:34`, `esp:35`; the board has three grounds: `esp:GND.1`, `esp:GND.2`, `esp:GND.3`.
- Wire colours are cosmetic (red = power, black = ground, others = signal).

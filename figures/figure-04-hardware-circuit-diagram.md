# Figure 4: Hardware Circuit Diagram

**Report location:** Section 5.1.5 — Power Supply (Hardware Implementation)
**Tool:** Wokwi for the sensor interface + a power-subsystem inset (Fritzing or hand-drawn)
**Caption to use in report:** *Figure 4: Hardware Circuit Diagram*

Figure 4 is the **full** hardware circuit: ESP32 + the three sensors **plus** the TP4056 charging module, 18650 battery, and solar panel. Wokwi can render the sensor-interface portion accurately but **cannot** represent the power subsystem (no TP4056 / 18650 / solar parts exist in Wokwi). So this figure is best assembled in two parts.

## Part A — Sensor interface (Wokwi)
Use the exact same Wokwi project and `diagram.json` as **Figure 11** (see `figure-11-esp32-wiring-diagram.md`). The ESP32 + DHT22 + two analog stand-in potentiometers (soil moisture on GPIO 34, pH on GPIO 35) cover the entire sensor side of the circuit.

## Part B — Power subsystem (cannot be done in Wokwi)
Draw this as a small inset/block (Fritzing has TP4056, 18650, and solar-panel parts; a clean block diagram also works). Exact wiring:

```
[6V 5W Solar Panel] + ──────► TP4056  IN+
                    - ──────► TP4056  IN-

[TP4056]  B+ ──────► 18650 Li-ion (+)            (battery charge/protect)
          B- ──────► 18650 Li-ion (-)
          OUT+ ─────► 3.3 V regulator  VIN
          OUT- ─────► common GND

[3.3 V regulator] VOUT (3.3 V) ──► ESP32 3V3  and  sensor VCC rails
                  GND          ──► ESP32 GND  (common ground with TP4056 OUT-)
```

Key facts (from the report):
- Solar panel: 6 V, 5 W → TP4056 input.
- TP4056: Li-ion charge controller with overcharge/over-discharge protection.
- Battery: 18650, 3.7 V, 2600 mAh (≈ 8–10 h on battery alone).
- A voltage regulator steps the TP4056 output to **3.3 V** for the ESP32 and sensors.
- Note: the PH-4502C module is powered at **5 V** in the real build (onboard regulator → 0–3.3 V output); everything else runs at 3.3 V.

## Assembly
1. Generate the Wokwi sensor-interface screenshot (Part A).
2. Add the power-subsystem block (Part B) either as a Fritzing drawing or a simple labelled block diagram beside/below the Wokwi capture.
3. Combine into one figure (side-by-side or stacked) and use the caption above.

> If you'd prefer a single fully-faithful image (all real component bodies + power), Fritzing is the better tool for Figure 4 — let me know and I'll write a Fritzing part/wiring spec instead.

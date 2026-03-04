# ESP32 Sensor Wiring Guide
## Smart Agriculture Project — Hardware Setup Reference

---

## ESP32 Pinout Reference (Used Pins)

```
                    ┌─────────────────┐
               3.3V │ 3V3         GND │ GND
                    │ EN          D23 │
                    │ D36 (VP)    D22 │
               PH ──│ D35 (VN)    TX0 │
       SOIL_ADC ────│ D34         RX0 │
                    │ D32         D21 │
                    │ D33         D19 │
                    │ D25         D18 │
                    │ D26          D5 │
                    │ D27         TX2 │
                    │ D14         RX2 │
                    │ D12          D4 │── DHT22 DATA
               GND │ GND          D2 │
                    │ D13         D15 │
                    │ SD2          D8 │
                    │ SD3          D7 │
                    │ CMD          D6 │
               5V  │ 5V          GND │ GND
                    └─────────────────┘
```

---

## Sensor 1: DHT22 (Temperature & Humidity)

### Wiring Table

| DHT22 Pin | Wire Color | ESP32 Pin     | Notes                          |
|-----------|------------|---------------|--------------------------------|
| VCC (1)   | Red        | 3.3V          | Can also use 5V                |
| DATA (2)  | Yellow     | GPIO 4 (D4)   | Signal pin — defined in config |
| NC (3)    | —          | Not connected | Leave floating                 |
| GND (4)   | Black      | GND           |                                |

### Required Component
- **10kΩ resistor** between DATA pin and VCC (pull-up)

### Wiring Diagram
```
DHT22
 ┌──────────┐
 │ VCC ─────┼──────────────── 3.3V
 │          │        │
 │ DATA ────┼────────┤──── GPIO 4
 │          │       [10kΩ]
 │ NC  ─────┼── (not connected)
 │ GND ─────┼──────────────── GND
 └──────────┘
```

### Notes
- DHT22 minimum sampling interval is **2 seconds** — code respects this
- If readings fail, check the pull-up resistor first
- Sensor face (grid side) should face airflow direction in field

---

## Sensor 2: Resistive Soil Moisture Sensor

### Components
- Probe board (2 metal tines)
- Control board (with LM393 comparator, potentiometer)

### Wiring Table (Use ANALOG output — not digital)

| Sensor Pin | Wire Color | ESP32 Pin       | Notes                            |
|------------|------------|-----------------|----------------------------------|
| VCC        | Red        | 3.3V            | Do NOT use 5V — ADC is 3.3V max  |
| GND        | Black      | GND             |                                  |
| AO         | Green      | GPIO 34 (ADC)   | Analog output — use this one     |
| DO         | Blue       | Not connected   | Digital threshold — not used     |

### Wiring Diagram
```
Soil Moisture Control Board
 ┌──────────────────┐
 │ VCC ─────────────┼──── 3.3V
 │ GND ─────────────┼──── GND
 │ AO  ─────────────┼──── GPIO 34   ← use this
 │ DO  ─────────────┼──── (not connected)
 └──────────────────┘
        │  │
      Probe tines (insert into soil)
```

### Important Notes
- Always use **AO** (analog output), not DO (digital) — gives full range
- GPIO 34 is **INPUT ONLY** — perfect for ADC, never connect to output
- **Power the sensor only during readings** in production (extend probe life)
  - Add a transistor switch on VCC for duty-cycle power control
- Calibrate `SOIL_DRY_VALUE` and `SOIL_WET_VALUE` in config.py:
  - Read ADC in completely dry air → save as `SOIL_DRY_VALUE`
  - Read ADC with probe submerged in water → save as `SOIL_WET_VALUE`

---

## Sensor 3: DIY MORE PH-4502C pH Sensor

### Components
- BNC probe (glass electrode)
- PH-4502C amplifier/control board

### Wiring Table

| PH-4502C Pin | Wire Color | ESP32 Pin       | Notes                         |
|--------------|------------|-----------------|-------------------------------|
| VCC (+)      | Red        | 3.3V or 5V      | Board works on both           |
| GND (-)      | Black      | GND             |                               |
| Po (analog)  | Yellow     | GPIO 35 (ADC)   | Main analog output            |
| Do (digital) | Blue       | Not connected   | High/low threshold — not used |
| To           | Orange     | Not connected   | Temperature comp. — not used  |

### Wiring Diagram
```
PH-4502C Board
 ┌──────────────────────┐
 │ VCC ─────────────────┼──── 3.3V (or 5V)
 │ GND ─────────────────┼──── GND
 │ Po  ─────────────────┼──── GPIO 35   ← analog output
 │ Do  ─────────────────┼──── (not connected)
 │ To  ─────────────────┼──── (not connected)
 └──────────────────────┘
        │
    BNC probe connector
        │
    Glass pH electrode
    (submerge tip in soil sample / water solution)
```

### Important Notes
- GPIO 35 is **INPUT ONLY** — correct for ADC use
- **Calibration is essential before taking real readings:**
  1. Prepare pH 7.0 buffer solution → measure ADC voltage → set `PH_NEUTRAL_VOLTAGE`
  2. Prepare pH 4.0 buffer solution → measure ADC voltage → set `PH_ACID_VOLTAGE`
- Rinse probe with distilled water between measurements
- Store probe tip in KCl storage solution (or pH 7.0 buffer) when not in use
- Warm up the sensor for **2–3 minutes** before reading for stable output

---

## Full Wiring Summary Table

| ESP32 Pin | Connects To              | Sensor              |
|-----------|--------------------------|---------------------|
| 3.3V      | VCC — DHT22              | DHT22               |
| 3.3V      | VCC — Soil moisture board| Soil Moisture       |
| 3.3V/5V   | VCC — PH-4502C board     | pH Sensor           |
| GND       | GND — all sensors        | All (common ground) |
| GPIO 4    | DATA — DHT22             | DHT22               |
| GPIO 34   | AO — Soil moisture board | Soil Moisture (ADC) |
| GPIO 35   | Po — PH-4502C board      | pH Sensor (ADC)     |

---

## Power Notes

- All sensors share **common GND** with ESP32 — this is required
- ESP32 powered via USB from laptop during development
- **Never exceed 3.3V** on GPIO 34 or 35 — they have no overvoltage protection
- If using 5V for pH sensor board, ensure its **output (Po) stays below 3.3V**
  (the PH-4502C output is typically ≤ 3.3V regardless of supply voltage)

---

## Quick Connection Checklist

- [ ] DHT22 VCC → 3.3V
- [ ] DHT22 DATA → GPIO 4 with 10kΩ pull-up to 3.3V
- [ ] DHT22 GND → GND
- [ ] Soil sensor VCC → 3.3V
- [ ] Soil sensor AO → GPIO 34
- [ ] Soil sensor GND → GND
- [ ] pH board VCC → 3.3V or 5V
- [ ] pH board Po → GPIO 35
- [ ] pH board GND → GND
- [ ] All GND pins connected together
- [ ] pH probe BNC connected to pH board
- [ ] Soil probe tines connected to soil sensor board

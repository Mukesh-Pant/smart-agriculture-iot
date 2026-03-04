# =============================================================
# sensors/ph_sensor.py — DIY MORE PH-4502C pH Sensor Reader
# The PH-4502C outputs an analog voltage proportional to pH.
# We take multiple samples and average them to reduce noise,
# then convert voltage to pH using a linear calibration formula.
# =============================================================

import machine
import time
import config


class PHSensor:
    """
    Reads soil pH from the PH-4502C analog sensor module.

    The PH-4502C has a built-in op-amp circuit. Its output voltage
    at pH 7.0 is approximately 2.5V (may vary by board — calibrate!).
    The relationship is roughly linear: higher voltage = lower pH.

    Calibration note:
        Use two known buffer solutions (e.g., pH 4.0 and pH 7.0)
        to accurately determine slope and intercept for your board.
    """

    SAMPLES      = 10     # number of ADC readings to average per measurement
    SAMPLE_DELAY = 10     # milliseconds between each sample

    # ESP32 ADC reference voltage (3.3V supply)
    ADC_VREF     = 3.3
    ADC_MAX      = 4095   # 12-bit ADC

    def __init__(self):
        self._adc = machine.ADC(machine.Pin(config.PH_PIN))
        self._adc.atten(machine.ADC.ATTN_11DB)   # 0–3.6V range

    def _read_average_voltage(self):
        """
        Takes SAMPLES readings and returns the average voltage.
        Averaging reduces noise from the analog circuit.
        """
        total = 0
        for _ in range(self.SAMPLES):
            total += self._adc.read()
            time.sleep_ms(self.SAMPLE_DELAY)
        avg_raw = total / self.SAMPLES
        voltage = (avg_raw / self.ADC_MAX) * self.ADC_VREF
        return round(voltage, 4)

    def _voltage_to_ph(self, voltage):
        """
        Converts measured voltage to pH value using a linear model.

        Linear formula:
            pH = 7.0 + ((neutral_voltage - measured_voltage) / slope)

        slope ≈ (neutral_voltage - acid_voltage) / (7.0 - 4.0)
              = (2.5 - 3.0) / 3.0  ≈ -0.1667 V/pH

        Adjust config.PH_NEUTRAL_VOLTAGE and config.PH_ACID_VOLTAGE
        after calibrating with buffer solutions.
        """
        neutral = config.PH_NEUTRAL_VOLTAGE
        acid    = config.PH_ACID_VOLTAGE
        slope   = (neutral - acid) / (7.0 - 4.0)

        if slope == 0:
            return 7.0  # fallback to neutral if misconfigured

        ph = 7.0 + ((neutral - voltage) / slope)
        return round(max(0.0, min(14.0, ph)), 2)

    def _classify_ph(self, ph):
        """Returns a human-readable soil pH category."""
        if ph < 5.5:
            return "strongly_acidic"
        elif ph < 6.5:
            return "acidic"
        elif ph <= 7.5:
            return "neutral"
        elif ph <= 8.5:
            return "alkaline"
        else:
            return "strongly_alkaline"

    def read(self):
        """
        Returns averaged voltage, calculated pH, and soil classification.

        Returns:
            dict: {
                "ph_value":    float,
                "ph_voltage":  float,
                "ph_category": str,
                "status":      "ok" | "error"
            }
        """
        try:
            voltage = self._read_average_voltage()
            ph      = self._voltage_to_ph(voltage)

            if config.DEBUG_MODE:
                print(f"[pH] Voltage: {voltage}V → pH: {ph}")

            return {
                "ph_value":    ph,
                "ph_voltage":  voltage,
                "ph_category": self._classify_ph(ph),
                "status":      "ok"
            }
        except Exception as e:
            if config.DEBUG_MODE:
                print(f"[pH] Read error: {e}")
            return {
                "ph_value":    None,
                "ph_voltage":  None,
                "ph_category": None,
                "status":      "error"
            }

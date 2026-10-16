"""Bruit de gifle de Zinzin (éditeur de perso), synthétisé maison : claquement bref + petit choc grave.
Usage : python3 slap-synth.py <fichier.wav>"""
import numpy as np, wave, sys
from scipy.signal import butter, lfilter
SR = 44100
n = int(SR * 0.32); t = np.arange(n) / SR
rng = np.random.default_rng(7)
noise = rng.standard_normal(n)
b, a = butter(2, [900 / (SR / 2), 5200 / (SR / 2)], btype="band")
crack = lfilter(b, a, noise) * np.exp(-t / 0.018)
b2, a2 = butter(2, 260 / (SR / 2))
thud = lfilter(b2, a2, rng.standard_normal(n)) * np.exp(-t / 0.05) * 2.2
body = np.sin(2 * np.pi * 150 * t * (1 - 0.4 * t)) * np.exp(-t / 0.04) * 0.5
x = crack * 1.0 + thud + body
x[: int(SR * 0.002)] *= np.linspace(0, 1, int(SR * 0.002))
x = x / (np.max(np.abs(x)) * 1.1)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes())

"""Boucle disco de Zinzin (secret de la boule à facettes), composée et synthétisée maison :
grosse caisse 4 temps, clap, charleston ouvert, basse octaviée et accords. 124 BPM, ~9 s.
Usage : python3 disco-synth.py <fichier.wav>"""
import numpy as np, wave, sys
from scipy.signal import butter, lfilter
SR = 44100; BPM = 124; BEAT = 60 / BPM; BARS = 4
N = int(SR * (BEAT * 4 * BARS + 0.6)); out = np.zeros(N)
rng = np.random.default_rng(3)
def add(x, t):
    s = int(t * SR); e = min(N, s + len(x)); out[s:e] += x[: e - s]
def kick():
    t = np.arange(int(0.3 * SR)) / SR
    f = 50 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.9
def clap():
    t = np.arange(int(0.2 * SR)) / SR
    b, a = butter(2, [900 / (SR / 2), 3000 / (SR / 2)], "band")
    return lfilter(b, a, rng.standard_normal(len(t))) * np.exp(-t * 22) * 0.6
def hat(open_=False):
    t = np.arange(int((0.18 if open_ else 0.05) * SR)) / SR
    b, a = butter(2, 7000 / (SR / 2), "high")
    return lfilter(b, a, rng.standard_normal(len(t))) * np.exp(-t * (14 if open_ else 60)) * 0.22
def tone(freq, dur, kind="bass"):
    t = np.arange(int(dur * SR)) / SR
    ph = 2 * np.pi * freq * t
    if kind == "bass":
        x = np.sign(np.sin(ph)) * 0.25 + np.sin(ph) * 0.5
        b, a = butter(2, 900 / (SR / 2)); x = lfilter(b, a, x)
        env = np.minimum(1, t / 0.005) * np.exp(-t * 6)
    else:
        x = sum(np.sin(ph * k) / k for k in (1, 2, 3, 4)) * 0.5
        env = np.minimum(1, t / 0.01) * np.exp(-t * 5)
    return x * env
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
# Progression (la mineur, fa, do, sol) : basse octaviée en croches, accords sur les contretemps
prog = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]
for bar, (root, chord) in enumerate(prog):
    t0 = bar * 4 * BEAT
    for b in range(4):
        tb = t0 + b * BEAT
        add(kick(), tb)
        if b % 2 == 1: add(clap(), tb)
        add(hat(), tb); add(hat(True), tb + BEAT / 2)
        for k, m in enumerate((root, root + 12)):
            add(tone(midi(m), BEAT / 2 * 0.9) * 0.55, tb + k * BEAT / 2)
        for m in chord:
            add(tone(midi(m), BEAT / 2 * 0.8, "chord") * 0.12, tb + BEAT / 2)
fo = int(0.6 * SR); out[-fo:] *= np.linspace(1, 0, fo)
out = out / np.max(np.abs(out)) * 0.9
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())

"""Sons d'Halloween de Zinzin, synthétisés maison (aucun droit tiers) :
ghost-boo.wav (« bouuuh » de fantôme) et croak.wav (crapaud du sort).
Usage : python3 halloween-synth.py <dossier de sortie>"""
import numpy as np, wave, sys, os
from scipy.signal import lfilter, butter
SR = 44100
def save(path, x):
    x = x / (np.max(np.abs(x)) * 1.12)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
def formant(x, f, bw):
    r = np.exp(-np.pi * bw / SR); th = 2 * np.pi * f / SR
    return lfilter([1 - r], [1, -2 * r * np.cos(th), r * r], x)
def reverb(x, g=0.6):
    out = x.copy()
    for d in [0.031, 0.043, 0.057]:
        n = int(SR * d); a = np.zeros(n + 1); a[0] = 1; a[n] = -g * 0.5
        out = out + 0.35 * lfilter([1], a, x)
    return out
out = sys.argv[1]
# Fantôme : voyelle « ou » (F1 ~320, F2 ~800) sur une voix grave qui glisse, souffle + vibrato
d = 1.1; n = int(SR * d); t = np.arange(n) / SR
f0 = np.interp(t, [0, 0.25, d], [190, 230, 120]) * (1 + 0.035 * np.sin(2 * np.pi * 5.5 * t))
ph = 2 * np.pi * np.cumsum(f0) / SR
src = sum(np.sin(k * ph) / k for k in range(1, 18)) + 0.35 * np.random.default_rng(1).standard_normal(n)
v = formant(src, 320, 80) + 0.6 * formant(src, 800, 120) + 0.15 * formant(src, 2400, 200)
env = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.35)
save(os.path.join(out, "ghost-boo.wav"), reverb(v * env))
# Crapaud : deux « crôa » graves et rugueux (pulsations rapides sur une note basse)
def croak(dur, f):
    n = int(SR * dur); t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f * (1 - 0.15 * t / dur)) / SR
    buzz = np.sign(np.sin(ph)) * 0.6 + np.sin(2 * ph) * 0.4
    am = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 38 * t))
    x = formant(buzz * am, 450, 150) + 0.5 * formant(buzz * am, 1100, 250)
    return x * np.minimum(1, t / 0.01) * np.minimum(1, (dur - t) / 0.05)
a = croak(0.22, 120); b = croak(0.3, 105)
gap = np.zeros(int(SR * 0.09))
save(os.path.join(out, "croak.wav"), np.concatenate([a, gap, b, np.zeros(int(SR * 0.1))]))

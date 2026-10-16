import numpy as np, wave, sys
from scipy.signal import lfilter
SR=44100; DUR=2.7
N=int(SR*DUR); out=np.zeros(N)
def f(note):  # midi -> Hz
    return 440*2**((note-69)/12)
def organ(midi, t0, d, amp=0.25, rel=0.18):
    n=int((d+rel)*SR); t=np.arange(n)/SR
    fr=f(midi)
    # léger vibrato/trémolo d'orgue d'église
    ph=2*np.pi*fr*t + 0.004*np.sin(2*np.pi*5.5*t)*fr/5.5*0.0
    w=np.zeros(n)
    for h,a in [(0.5,0.35),(1,1),(2,0.6),(3,0.35),(4,0.3),(6,0.15),(8,0.12)]:
        w+=a*np.sin(h*ph)
    env=np.ones(n)
    att=int(0.012*SR); env[:att]=np.linspace(0,1,att)
    r0=int(d*SR); env[r0:]=np.exp(-np.arange(n-r0)/(rel*SR/4))
    w*=env*(1+0.06*np.sin(2*np.pi*6*t))
    s=int(t0*SR); e=min(N,s+n); out[s:e]+=amp*w[:e-s]/3.2
# Motif de la Toccata en ré mineur (Bach, BWV 565, domaine public), en octaves
def note(m,t0,d,amp=0.25):
    for o,a in [(-12,0.7),(0,1),(12,0.45)]: organ(m+o,t0,d,amp*a)
A4,G4,F4,E4,D4,Cs4=69,67,65,64,62,61
note(A4,0.00,0.09); note(G4,0.09,0.09); note(A4,0.18,0.62)
t=0.92
for m in [G4,F4,E4,D4]:
    note(m,t,0.085); t+=0.085
note(Cs4,t,0.36); t+=0.36
# Accord final ré mineur + pédale grave
for m,a in [(D4,0.25),(F4-12+12,0.12),(A4-12,0.14),(38,0.22),(26,0.18)]:
    organ(m,t,DUR-t-0.45,a,rel=0.4)
# Fantôme « ouuuh » : sinus glissé avec vibrato
n=int(1.3*SR); tt=np.arange(n)/SR
fr=np.interp(tt,[0,0.5,1.3],[520,820,480])*(1+0.03*np.sin(2*np.pi*6.5*tt))
ph=2*np.pi*np.cumsum(fr)/SR
g=np.sin(np.pi*np.clip(tt/1.3,0,1))**2
ghost=0.07*g*(np.sin(ph)+0.25*np.sin(2*ph))
s=int(1.15*SR); out[s:s+n]+=ghost[:N-s]
# Réverbe (Schroeder : 4 peignes + 2 passe-tout)
def comb(x,dms,g):
    d=int(SR*dms/1000); a=np.zeros(d+1); a[0]=1; a[d]=-g
    return lfilter([1],a,x)
def allpass(x,dms,g):
    d=int(SR*dms/1000); b=np.zeros(d+1); b[0]=-g; b[d]=1; a=np.zeros(d+1); a[0]=1; a[d]=-g
    return lfilter(b,a,x)
wet=sum(comb(out,dm,0.78) for dm in [29.7,37.1,41.1,43.7])/4
wet=allpass(allpass(wet,5,0.7),1.7,0.7)
mix=out*0.75+wet*0.45
# fondu final
fo=int(0.35*SR); mix[-fo:]*=np.linspace(1,0,fo)
mix/=np.max(np.abs(mix))*1.12
pcm=(mix*32767).astype(np.int16)
with wave.open(sys.argv[1],"wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

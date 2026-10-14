"""
Icônes alternatives de Zinzin (réservées à Zinzin+) : Or, Nuit, Néon.
Même dessin que l'icône classique (resources/icon.png), recoloré : le blob et le fond
changent de teinte, les yeux, la bouche et la langue restent.
Usage : python3 resources/app-icons/recolor.py  → or.png, nuit.png, neon.png (1024×1024, sans alpha)
puis copier dans ios/App/App/Assets.xcassets/AppIcon-{Or,Nuit,Neon}.appiconset/.
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
import numpy as np, sys
from PIL import Image
src = np.asarray(Image.open(os.path.join(HERE, '..', 'icon.png')).convert('RGB')).astype(np.float32)/255
H,W,_ = src.shape
r,g,b = src[...,0],src[...,1],src[...,2]
mx = src.max(-1); mn = src.min(-1); d = mx-mn+1e-6
hue = np.where(mx==r, ((g-b)/d)%6, np.where(mx==g, (b-r)/d+2, (r-g)/d+4))*60
sat = np.where(mx>0, d/mx, 0); val = mx
lum = 0.299*r+0.587*g+0.114*b
yy,xx = np.mgrid[0:H,0:W]
# Silhouette du blob : rose franc, puis on bouche les trous (yeux, bouche) par remplissage depuis l'extérieur
from PIL import ImageFilter, ImageDraw
hue_ok = np.clip(1-np.abs(((hue-328+180)%360)-180)/30, 0, 1)
core = (hue_ok > 0.5) & (sat > 0.15) & (val > 0.66)
m = Image.fromarray((core*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
ImageDraw.floodfill(m, (0,0), 128)
sil = (np.asarray(m) != 128).astype(np.float32)
hl = ((((xx-325)/85)**2 + ((yy-310)/60)**2) < 1) & (sil < 0.5)
sil = np.asarray(Image.fromarray((sil*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)/255
tongue = (((xx-515)/70)**2 + ((yy-745)/40)**2 < 1) & (lum > 0.52)
# dans le blob : seulement le rose (les yeux blancs, l'encre, la langue restent)
inner = np.asarray(Image.fromarray((sil*255).astype(np.uint8)).filter(ImageFilter.MinFilter(13))).astype(np.float32)/255
band = 1 - inner  # bord du blob : tout y passe (pas de liseré rose)
body = sil * np.where(tongue, 0, np.clip((sat-0.02)/0.08,0,1) * np.clip(np.maximum(hue_ok*3, band),0,1))
bgw = (1-sil) * np.clip((sat-0.03)/0.15,0,1)

def grad(stops, t):
    t = np.clip(t,0,1); xs=[s[0] for s in stops]; out=np.zeros(t.shape+(3,),np.float32)
    for c in range(3): out[...,c]=np.interp(t, xs, [s[1][c]/255 for s in stops])
    return out
def hexs(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))

V = {
 'or':   dict(body=[(0,'#6E3F00'),(0.3,'#B97800'),(0.55,'#F2B200'),(0.75,'#FFD84A'),(0.9,'#FFEFA8'),(1,'#FFFCEB')],
              bg=[(0,'#0A0612'),(0.3,'#1C1026'),(0.55,'#3A2414'),(0.8,'#7A5416'),(1,'#B98A2E')]),
 'nuit': dict(body=[(0,'#101A52'),(0.3,'#22389E'),(0.55,'#3A62E8'),(0.75,'#6E92FF'),(0.9,'#B9CBFF'),(1,'#F0F4FF')],
              bg=[(0,'#02030C'),(0.3,'#060A22'),(0.55,'#0D1640'),(0.8,'#1B2A6E'),(1,'#33489E')]),
 'neon': dict(body=[(0,'#06582E'),(0.3,'#0FA855'),(0.55,'#1EE87A'),(0.75,'#5CFFA6'),(0.9,'#B8FFD8'),(1,'#F2FFF8')],
              bg=[(0,'#020206'),(0.3,'#08050F'),(0.55,'#1E0838'),(0.8,'#5A0E78'),(1,'#C42BD8')]),
}
for name, v in V.items():
    stops_b=[(a,hexs(c)) for a,c in v['body']]; stops_g=[(a,hexs(c)) for a,c in v['bg']]
    nb = grad(stops_b, (lum-0.18)/0.7)
    ng = grad(stops_g, lum/0.55)
    out = src.copy()
    bgm = np.clip(bgw,0,1)[...,None]; bm = body[...,None]
    out = out*(1-bgm) + ng*bgm
    out = out*(1-bm) + nb*bm
    # reflet qui déborde du blob : blanc doux sur le nouveau fond
    k = (np.clip((lum-0.3)/0.45,0,1)*hl)[...,None]
    out = np.where(hl[...,None], ng*(1-k) + np.array([1,1,1])*k*0.9 + ng*k*0.1, out)
    if name == 'neon':
        # halo néon autour du blob
        glow = np.asarray(Image.fromarray((sil*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(38))).astype(np.float32)/255
        gk = (np.clip(glow*1.6,0,1)*(1-sil)*0.55)[...,None]
        out = out + np.array([0.12,1.0,0.55])*gk
    if name == 'nuit':
        rng = np.random.default_rng(7)
        for _ in range(40):
            x,y = rng.integers(20,1004,2)
            if np.hypot(x-512,y-530) < 430: continue
            rad = rng.uniform(1.5,4.2); a = rng.uniform(0.35,0.95)
            m = np.clip(rad-np.hypot(xx-x,yy-y)+1,0,1)[...,None]*a
            out = out*(1-m) + np.array([1,0.97,0.88])*m
    Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8)).save(os.path.join(HERE, f'{name}.png'))

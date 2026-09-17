import os
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
import numpy as np, json
from PIL import Image, ImageDraw
G=json.load(open(os.path.join(W,"glyphs.json")))

def cubic_pts(p0,c1,c2,p1,n=6):
    t=np.linspace(0,1,n,endpoint=False)[:,None]
    return (1-t)**3*p0+3*(1-t)**2*t*c1+3*(1-t)*t**2*c2+t**3*p1

def shape_polygon(sh,n=6):
    v=np.array(sh["v"]); i=np.array(sh["i"]); o=np.array(sh["o"])
    N=len(v); pts=[]
    segs = N if sh["c"] else N-1
    for k in range(segs):
        k2=(k+1)%N
        p0=v[k]; p1=v[k2]; c1=p0+o[k]; c2=p1+i[k2]
        if np.allclose(o[k],0) and np.allclose(i[k2],0): pts.append(p0[None,:])
        else: pts.append(cubic_pts(p0,c1,c2,p1,n))
    if not sh["c"]: pts.append(v[-1][None,:])
    return np.vstack(pts)

def bbox(polys):
    P=np.vstack(polys); return P.min(0).tolist()+P.max(0).tolist()

class Glyph:
    """letter glyph: list of polygons in logo units, with hole flags."""
    def __init__(self,shapes):
        polys=[shape_polygon(s) for s in shapes]
        areas=[abs(np.sum(p[:,0]*np.roll(p[:,1],-1)-np.roll(p[:,0],-1)*p[:,1]))/2 for p in polys]
        order=np.argsort(areas)[::-1]
        self.polys=[]; self.holes=[]
        for idx in order:
            p=polys[idx]; hole=False
            for q,_ in zip(self.polys,self.holes):
                bq=q.min(0),q.max(0); bp=p.min(0),p.max(0)
                if (bp[0]>=bq[0]-1).all() and (bp[1]<=bq[1]+1).all(): hole=True
            self.polys.append(p); self.holes.append(hole)
        b=bbox(self.polys); self.bbox=b; self.anchor=np.array([(b[0]+b[2])/2,(b[1]+b[3])/2])
    def transformed(self,tx,ty,rot,sx,sy):
        c,s=np.cos(np.radians(rot)),np.sin(np.radians(rot))
        out=[]
        for p in self.polys:
            q=(p-self.anchor)*np.array([sx,sy])
            q=np.stack([q[:,0]*c-q[:,1]*s, q[:,0]*s+q[:,1]*c],1)+np.array([tx,ty])
            out.append(q)
        return out
    def raster(self,tx,ty,rot,sx,sy,W=1920,H=1080):
        polys=self.transformed(tx,ty,rot,sx,sy)
        im=Image.new("L",(W,H),0); d=ImageDraw.Draw(im)
        for p,h in zip(polys,self.holes):
            d.polygon([tuple(x) for x in p],fill=0 if h else 255)
        return np.array(im)>0

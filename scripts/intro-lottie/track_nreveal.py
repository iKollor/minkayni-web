import os
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
import numpy as np, json
from PIL import Image, ImageDraw
from common import *
C=json.load(open(os.path.join(W,"centerlines.json"))); misc=json.load(open(os.path.join(W,"misc.json"))); comps=json.load(open(os.path.join(W,"comps.json")))
FINAL_HEAD_D=38.5

def band_extent(name, t, reverse):
    cl=C[name]; P=np.array(cl["pts"]); w=cl["width"]
    d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(P,axis=0),axis=1))]; L=d[-1]
    a,b=((1-t)*L,L) if reverse else (0,t*L)
    xs=np.interp([a,b],d,P[:,0]); ys=np.interp([a,b],d,P[:,1])
    mid=P[(d>a)&(d<b)]; Q=np.vstack([[xs[0],ys[0]],mid,[xs[1],ys[1]]])
    return Q[:,0].min()-w/2,Q[:,1].min()-w/2,Q[:,0].max()+w/2,Q[:,1].max()+w/2

def table(name,reverse):
    ts=np.linspace(0.001,1,400)
    ext=np.array([band_extent(name,t,reverse) for t in ts])
    return ts,ext[:,2]-ext[:,0],ext[:,3]-ext[:,1]  # widths,heights

def invert(name,reverse,w,h):
    ts,Ws,Hs=table(name,reverse)
    if w<36: return float(ts[np.argmin(np.abs(Hs-h)+ (Ws>36)*1e6)])
    return float(ts[np.argmin(np.abs(Ws-w)+ (Ws<=36)*1e6)])

def measure(name, frames, reverse):
    out={}
    for f in frames:
        heads=misc["iso"][str(f)]["heads"]
        s=0.7268*(heads[0][2]/FINAL_HEAD_D) if heads else 0.7268
        hx=heads[0][0] if heads else 592.4
        # expected stem/leg x: final letter position relative to head L, scaled
        if name=="n": ex=hx+(1124-911.7)*(s/0.7268*0.72/0.77)  # rough
        else: ex=1290
        cands=[c for c in comps[f]["B"]+comps[f]["G"] if abs(c["bb"][3]-592)<8 and c["bb"][3]>560 and abs(c["cx"]-ex)<90 and c["bb"][2]-c["bb"][0]<100]
        if not cands: out[f]=None; print(name,f,"none (ex=%.0f s=%.3f)"%(ex,s)); continue
        c=max(cands,key=lambda c:c["area"])
        w=(c["bb"][2]-c["bb"][0]+1)/s; h=(c["bb"][3]-c["bb"][1]+1)/s
        t=invert(name,reverse,w,h)
        out[f]={"t":round(t,4),"w":round(w,1),"h":round(h,1),"bb":c["bb"],"s":round(s,4)}
        print(name,f,out[f])
    return out
if __name__=="__main__":
  res={"n":measure("n",range(56,68),False),"n2":measure("n2",range(64,77),True)}
  json.dump(res,open(os.path.join(W,"nreveal.json"),"w"))

import os
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
import numpy as np, json, sys
from scipy import ndimage, optimize
from skimage.morphology import skeletonize
from PIL import Image, ImageDraw
from common import *
from glyphutil import *

NAMES=["i","n","k","a","y","n2","i2"]
glyphs={n:Glyph(G["letters"][n]["shapes"]) for n in NAMES}
S_TEXT=0.7256; OFF=np.array([574.0,360.6])  # rough final placement guess

def roi_score(g, p, alpha, pad=30):
    tx,ty,rot,sx,sy=p
    polys=g.transformed(tx,ty,rot,sx,sy)
    P=np.vstack(polys); x0,y0=np.floor(P.min(0)).astype(int)-pad; x1,y1=np.ceil(P.max(0)).astype(int)+pad
    x0=max(x0,0);y0=max(y0,0);x1=min(x1,W);y1=min(y1,H)
    if x1-x0<2 or y1-y0<2: return -1e9,0
    im=Image.new("L",(x1-x0,y1-y0),0); d=ImageDraw.Draw(im)
    for q,h in zip(polys,g.holes): d.polygon([(a-x0,b-y0) for a,b in q],fill=0 if h else 255)
    M=np.array(im)>0
    A=alpha[y0:y1,x0:x1]/255.0
    inside=A[M]
    if M.sum()==0: return -1e9,0
    score=float(np.sum(2*inside-1))
    cover=float(inside.mean())
    return score,cover

def fit(g,p0,alpha,steps=(6,6,6,0.06,0.06),iters=2):
    p=np.array(p0,float)
    def f(q):
        if abs(q[2])>95 or q[3]<0.1 or q[4]<0.1: return 1e9
        return -roi_score(g,q,alpha)[0]
    for _ in range(iters):
        r=optimize.minimize(f,p,method="Nelder-Mead",options={"initial_simplex":np.vstack([p]+[p+np.eye(5)[k]*steps[k] for k in range(5)]),"xatol":0.2,"fatol":1,"maxiter":600})
        p=r.x
    sc,cov=roi_score(g,p,alpha)
    return p,sc,cov

def letter_soft(g,p,al):
    polys=g.transformed(*p); P=np.vstack(polys)
    x0,y0=np.floor(P.min(0)).astype(int)-25; x1,y1=np.ceil(P.max(0)).astype(int)+25
    x0=max(x0,0);y0=max(y0,0);x1=min(x1,W);y1=min(y1,H)
    reg=np.zeros((H,W),bool); reg[y0:y1,x0:x1]=True
    return edge_softness(al,reg)

def track_letter(name, f_last=119, f_stop=50):
    g=glyphs[name]
    p=np.array([OFF[0]+g.anchor[0]*S_TEXT, OFF[1]+g.anchor[1]*S_TEXT, 0, S_TEXT, S_TEXT])
    out={}
    for f in range(f_last, f_stop-1, -1):
        al=masks(f)["alpha"].astype(float)
        p,sc,cov=fit(g,p,al)
        soft=letter_soft(g,p,al)
        out[f]={"tx":round(float(p[0]),2),"ty":round(float(p[1]),2),"rot":round(float(p[2]),2),"sx":round(float(p[3]),4),"sy":round(float(p[4]),4),"score":round(sc),"cover":round(cov,3),"soft":None if soft is None else round(soft,2)}
        print(name,f,out[f]); sys.stdout.flush()
        if cov<0.45 and f<f_last-3: break
    return out

if __name__=="__main__":
    names=sys.argv[1:] or NAMES
    res={}
    for n in names:
        res[n]=track_letter(n)
        json.dump(res,open(os.path.join(W,f"letters_{'_'.join(names)}.json"),"w"))

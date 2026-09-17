import os
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
import numpy as np, json, sys
from scipy import ndimage
from skimage.morphology import skeletonize
from common import *

HEAD_MERGED={16,17,42,43,44}

def skeleton_graph(mask):
    sk=skeletonize(mask)
    ys,xs=np.where(sk)
    idx={(int(y),int(x)):k for k,(y,x) in enumerate(zip(ys,xs))}
    nbr=[[] for _ in ys]
    for k,(y,x) in enumerate(zip(ys,xs)):
        for dy in (-1,0,1):
            for dx in (-1,0,1):
                if dy==0 and dx==0: continue
                j=idx.get((int(y)+dy,int(x)+dx))
                if j is not None: nbr[k].append(j)
    pts=np.stack([xs,ys],1).astype(float)
    return pts,nbr

def bfs(nbr,s):
    dist=[-1]*len(nbr); prev=[-1]*len(nbr); dist[s]=0; q=[s]
    for u in q:
        for v in nbr[u]:
            if dist[v]<0: dist[v]=dist[u]+1; prev[v]=u; q.append(v)
    return dist,prev

def path_to(prev,t):
    p=[]; u=t
    while u!=-1: p.append(u); u=prev[u]
    return p[::-1]

def polyline_len(P):
    return float(np.sum(np.linalg.norm(np.diff(P,axis=0),axis=1))) if len(P)>1 else 0.0

def resample(P,n):
    P=np.asarray(P,float)
    if len(P)==1: return np.repeat(P,n,0)
    d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(P,axis=0),axis=1))]
    t=np.linspace(0,d[-1],n)
    return np.stack([np.interp(t,d,P[:,0]),np.interp(t,d,P[:,1])],1)

def extend_if_clipped(P,margin=4,ext=90):
    P=np.asarray(P,float).copy()
    def clipped(p): return p[0]<margin or p[1]<margin or p[0]>W-1-margin or p[1]>H-1-margin
    if len(P)>=4:
        if clipped(P[0]):
            d=P[0]-P[3]; d/=np.linalg.norm(d)+1e-9; P=np.vstack([P[0]+d*ext,P])
        if clipped(P[-1]):
            d=P[-1]-P[-4]; d/=np.linalg.norm(d)+1e-9; P=np.vstack([P,P[-1]+d*ext])
    return P

def analyze_figure(mask, head_hint=None, merged=False):
    """mask: binary mask of one figure body (+head if merged). returns spine, arm, width."""
    mask=ndimage.binary_opening(mask,iterations=2)
    lab,n=ndimage.label(mask)
    if n==0: return None
    sizes=ndimage.sum(mask,lab,range(1,n+1))
    k=int(np.argmax(sizes))+1
    cm=lab==k
    if sizes[k-1]<800: return None
    pts,nbr=skeleton_graph(cm)
    if len(pts)<5: return None
    dt=ndimage.distance_transform_edt(cm)
    deg=np.array([len(x) for x in nbr])
    nodes=[i for i in range(len(pts)) if deg[i]!=2]
    if not nodes: nodes=[0]
    # neck: node nearest to head; if merged: the node with min y among endpoints
    if merged or head_hint is None:
        ends=[i for i in nodes if deg[i]==1] or nodes
        neck=min(ends,key=lambda i:pts[i][1])
    else:
        neck=min(nodes,key=lambda i:np.hypot(*(pts[i]-head_hint)))
    dist,prev=bfs(nbr,neck)
    foot=int(np.argmax(dist))
    spine_idx=path_to(prev,foot)
    spine=pts[spine_idx]
    on_spine=set(spine_idx)
    # arm: longest branch off the spine
    best=None
    for e in [i for i in nodes if deg[i]==1 and i not in on_spine]:
        p=path_to(prev,e)  # from neck to e
        # find where it leaves the spine
        j=0
        while j<len(p) and p[j] in on_spine: j+=1
        branch=p[j-1:] if j>0 else p
        L=polyline_len(pts[branch])
        if best is None or L>best[0]: best=(L,branch)
    arm=None
    if best and best[0]>28:
        arm=pts[best[1]]
    widths=[2*dt[int(y),int(x)] for x,y in spine]
    width=float(np.median(widths))
    head=None
    if merged:
        head=spine[0].copy()
        # skip head+gap along spine (~110px)
        d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(spine,axis=0),axis=1))]
        j=int(np.searchsorted(d,110)); spine=spine[j:] if j<len(spine)-3 else spine
    return {"spine":spine,"arm":arm,"width":width,"head":head,"area":int(sizes[k-1])}

def heads(mask, dmin=30, dmax=130):
    lab,n=ndimage.label(mask)
    out=[]
    for k in range(1,n+1):
        ys,xs=np.where(lab==k)
        if len(xs)<300: continue
        w=xs.max()-xs.min()+1; h=ys.max()-ys.min()+1
        if abs(w-h)<0.2*max(w,h) and len(xs)>0.7*np.pi*(max(w,h)/2)**2 and dmin<=max(w,h)<=dmax:
            out.append({"cx":float(xs.mean()),"cy":float(ys.mean()),"d":float((w+h)/2),"area":int(len(xs))})
    return out

def track(frames):
    res={}
    for i in frames:
        m=masks(i); al=m["alpha"]
        rec={}
        for name,col in (("P","purple"),("B","blue")):
            mk=m[col]
            hs=heads(mk)
            body=mk.copy()
            # remove head components
            lab,n=ndimage.label(mk)
            for h in hs:
                k=lab[int(h["cy"]),int(h["cx"])]
                if k>0: body[lab==k]=False
            merged = (name=="P" and i in HEAD_MERGED)
            hint=None
            if hs:
                # pick the head nearest the largest body component
                hint=np.array([hs[0]["cx"],hs[0]["cy"]])
            fig=analyze_figure(mk if merged else body, hint, merged)
            if fig is None:
                rec[name]=None; continue
            spine=extend_if_clipped(fig["spine"])
            out={"head":[hs[0]["cx"],hs[0]["cy"]] if hs and not merged else (fig["head"].tolist() if fig["head"] is not None else None),
                 "head_d":hs[0]["d"] if hs else None,
                 "spine":resample(spine,8).round(1).tolist(),
                 "arm":resample(fig["arm"],3).round(1).tolist() if fig["arm"] is not None else None,
                 "width":round(fig["width"],1),"area":fig["area"]}
            # blur: softness inside dilated bbox of this color
            reg=ndimage.binary_dilation(mk,iterations=40)
            out["soft"]=edge_softness(al,reg)
            rec[name]=out
        res[i]=rec
        print(i,json.dumps(rec))
        sys.stdout.flush()
    return res

if __name__=="__main__":
    a,b=int(sys.argv[1]),int(sys.argv[2])
    res=track(range(a,b))
    json.dump(res,open(os.path.join(W,f"fig_{a}_{b}.json"),"w"))

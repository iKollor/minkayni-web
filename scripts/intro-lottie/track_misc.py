import os
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
import numpy as np, json, sys
from scipy import ndimage
from common import *
from track_figures import skeleton_graph, bfs, path_to, resample, heads, extend_if_clipped

out={"iso":{}, "gradient":{}, "tag":{}, "scene_soft":{}}
for f in range(0,120):
    m=masks(f); al=m["alpha"]; a=frame(f)
    out["scene_soft"][f]=edge_softness(al)
    # gradient fit: pixels alpha>250, y<620, t=g/167 in (0.06,0.94)
    op=(al>250); op[620:,:]=False
    ys,xs=np.where(op)
    if len(xs):
        g=a[:,:,1][op].astype(float); t=np.clip(g/167.0,0,1)
        sel=(t>0.06)&(t<0.94)
        if sel.sum()>400:
            X=xs[sel].astype(float); T=t[sel]
            A=np.vstack([X,np.ones_like(X)]).T
            k,c=np.linalg.lstsq(A,T,rcond=None)[0]
            xs_=-c/k; xe_=(1-c)/k
            out["gradient"][f]={"xs":round(float(xs_),1),"xe":round(float(xe_),1),"n":int(sel.sum())}
    # tag reveal: max x of opaque pixels in band y 620..720
    band=(al>128); band[:620,:]=False; band[720:,:]=False
    bx=np.where(band.any(axis=0))[0]
    out["tag"][f]=None if len(bx)==0 else [int(bx.min()),int(bx.max()),int(band.sum())]
    # iso M path for f>=54
    if f>=54:
        op=m["opaque"].copy()
        hs=heads(op,dmin=28,dmax=70)
        lab,n=ndimage.label(op)
        sizes=ndimage.sum(op,lab,range(1,n+1))
        k=int(np.argmax(sizes))+1; cm=lab==k
        cm=ndimage.binary_opening(cm,iterations=1)
        pts,nbr=skeleton_graph(cm)
        if len(pts)>10:
            deg=np.array([len(x) for x in nbr])
            d0,_=bfs(nbr,0); a_=int(np.argmax(d0)); d1,prev=bfs(nbr,a_); b_=int(np.argmax(d1))
            path=pts[path_to(prev,b_)]
            if path[0][0]>path[-1][0]: path=path[::-1]
            dt=ndimage.distance_transform_edt(cm)
            widths=[2*dt[int(y),int(x)] for x,y in path]
            ys_,xs_=np.where(cm)
            out["iso"][f]={"M":resample(path,16).round(1).tolist(),"width":round(float(np.median(widths)),1),
                           "bb":[int(xs_.min()),int(ys_.min()),int(xs_.max()),int(ys_.max())],"area":int(cm.sum()),
                           "heads":sorted([[round(h["cx"],1),round(h["cy"],1),round(h["d"],1)] for h in hs if h["cy"]<450],key=lambda h:h[0]),
                           "soft":edge_softness(al,ndimage.binary_dilation(cm,iterations=30))}
    print(f, out["gradient"].get(f), out["tag"][f], round(out["scene_soft"][f] or 0,1), (out["iso"].get(f) or {}).get("heads"), (out["iso"].get(f) or {}).get("width")); sys.stdout.flush()
json.dump(out,open(os.path.join(W,"misc.json"),"w"))

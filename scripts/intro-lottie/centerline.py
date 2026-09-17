import os
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
"""Stroke centerlines for the n glyphs (for trim-path reveal) and PATH_TAG alignment."""
import numpy as np, json
from PIL import Image, ImageDraw
from scipy import ndimage, optimize
from skimage.morphology import skeletonize
from glyphutil import *
from track_figures import skeleton_graph, bfs, path_to, resample, polyline_len

def centerline(name, scale=6, n=40):
    g=Glyph(G["letters"][name]["shapes"])
    b=g.bbox; pad=10
    Wc=int((b[2]-b[0]+2*pad)*scale); Hc=int((b[3]-b[1]+2*pad)*scale)
    im=Image.new("L",(Wc,Hc),0); d=ImageDraw.Draw(im)
    for p,h in zip(g.polys,g.holes):
        q=(p-np.array([b[0]-pad,b[1]-pad]))*scale
        d.polygon([tuple(x) for x in q],fill=0 if h else 255)
    m=np.array(im)>0
    pts,nbr=skeleton_graph(m)
    d0,_=bfs(nbr,0); a_=int(np.argmax(d0)); d1,prev=bfs(nbr,a_); b_=int(np.argmax(d1))
    path=pts[path_to(prev,b_)]
    dt=ndimage.distance_transform_edt(m)
    width=2*np.median([dt[int(y),int(x)] for x,y in path])/scale
    path=path/scale+np.array([b[0]-pad,b[1]-pad])
    # orient: start at the leftmost end (stem bottom)
    if path[0][0]>path[-1][0]: path=path[::-1]
    P=resample(path,n)
    return {"pts":P.round(2).tolist(),"width":round(float(width),2),"len":round(polyline_len(P),1)}

def pathtag_polys():
    out=[]
    for it in G["pathtag"]:
        if it["type"]=="path":
            for sh in it["shapes"]: out.append(("path",shape_polygon(sh,n=8)))
        else:
            c=np.array(it["c"]); r=it["r"]
            out.append(("circle",c,r))
    return out

def tag_glyph_mask(scale, org):
    """rasterize tag glyphs (logo units) at given scale, origin org (logo units) -> mask"""
    polys=[shape_polygon(s) for s in G["tag"]]
    Wc=int(760*scale); Hc=int(120*scale)
    im=Image.new("L",(Wc,Hc),0); d=ImageDraw.Draw(im)
    # holes: draw all with xor-ish approach: sequential; assume holes listed after outers within each glyph path (svg order)
    for p in polys:
        q=(p-org)*scale
        d.polygon([tuple(x) for x in q],fill=255)
    return np.array(im)>0, (Wc,Hc)

def pathtag_mask(s,ox,oy,w,scale,org,size):
    im=Image.new("L",size,0); d=ImageDraw.Draw(im)
    for it in pathtag_polys():
        if it[0]=="path":
            q=(it[1]*s+np.array([ox,oy])-org)*scale
            d.line([tuple(x) for x in q],fill=255,width=max(1,int(w*scale)),joint="curve")
            for e in (q[0],q[-1]): d.ellipse([e[0]-w*scale/2,e[1]-w*scale/2,e[0]+w*scale/2,e[1]+w*scale/2],fill=255)
        else:
            c=(it[1]*s+np.array([ox,oy])-org)*scale; r=(it[2]*s+w/2)*scale
            d.ellipse([c[0]-r,c[1]-r,c[0]+r,c[1]+r],fill=255)
    return np.array(im)>0

def fit_pathtag():
    scale=3; org=np.array([150.0,370.0])
    gm,size=tag_glyph_mask(scale,org)
    w=8.0
    def score(p):
        s,ox,oy=p
        pm=pathtag_mask(s,ox,oy,w,scale,org,size)
        cover=(gm&pm).sum()/gm.sum()
        spill=(pm&~gm).sum()/pm.sum()
        return -(cover-0.5*spill)
    p0=[738.8/1125.0,157.6,376.4+8]
    best=None
    for dy in (-10,0,10):
        for ds in (-0.02,0,0.02):
            r=optimize.minimize(score,[p0[0]+ds,p0[1],p0[2]+dy],method="Nelder-Mead",options={"xatol":0.05,"fatol":1e-4,"maxiter":400})
            if best is None or r.fun<best.fun: best=r
    s,ox,oy=best.x
    pm=pathtag_mask(s,ox,oy,w,scale,org,size)
    print("pathtag fit s=%.4f ox=%.2f oy=%.2f cover=%.3f spill=%.3f"%(s,ox,oy,(gm&pm).sum()/gm.sum(),(pm&~gm).sum()/pm.sum()))
    # coverage as function of width
    for ww in (6,8,10,12,14):
        pm=pathtag_mask(s,ox,oy,ww,scale,org,size); print("  w",ww,"cover %.3f"%((gm&pm).sum()/gm.sum()))
    # save a visual
    vis=np.zeros(gm.shape+(3,),np.uint8); vis[gm]=(110,0,163); vis[pm&~gm]=(255,200,0); vis[gm&pm]=(0,180,255)
    Image.fromarray(vis).save(os.path.join(W,"pathtag_fit.png"))
    return {"s":float(s),"ox":float(ox),"oy":float(oy)}

if __name__=="__main__":
    res={"n":centerline("n"),"n2":centerline("n2")}
    for k,v in res.items(): print(k,"width",v["width"],"len",v["len"],"start",v["pts"][0],"end",v["pts"][-1])
    res["pathtag"]=fit_pathtag()
    json.dump(res,open(os.path.join(W,"centerlines.json"),"w"))

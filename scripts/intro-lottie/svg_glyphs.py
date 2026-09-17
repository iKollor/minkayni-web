import os
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
"""Parse LOGO+TAG.svg and PATH_TAG.svg into Lottie-ready bezier shapes."""
import re, json
from svgpathtools import parse_path, Path, Line, CubicBezier, QuadraticBezier, Arc
SVGDIR=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","..","src","assets","SVG")+"/"

def seg_cubic(seg):
    if isinstance(seg,CubicBezier): return seg.start,seg.control1,seg.control2,seg.end
    if isinstance(seg,QuadraticBezier):
        return seg.start, seg.start+2/3*(seg.control-seg.start), seg.end+2/3*(seg.control-seg.end), seg.end
    if isinstance(seg,Line): return seg.start,seg.start,seg.end,seg.end
    if isinstance(seg,Arc):
        # approximate arc by sampling into cubics via svgpathtools' as_cubic_curves
        raise ValueError("arc")
    raise ValueError(type(seg))

def subpath_to_lottie(sub):
    segs=list(sub)
    closed = abs(sub.start-sub.end)<1e-3
    v=[];i=[];o=[]
    n=len(segs)
    for k,seg in enumerate(segs):
        s,c1,c2,e=seg_cubic(seg)
        v.append(s); o.append(c1-s)
        # in tangent for vertex k comes from previous segment
        prev = segs[k-1] if k>0 else (segs[-1] if closed else None)
        if prev is None: i.append(0j)
        else:
            ps,pc1,pc2,pe=seg_cubic(prev); i.append(pc2-pe)
    if not closed:
        s,c1,c2,e=seg_cubic(segs[-1])
        v.append(e); i.append(c2-e); o.append(0j)
    else:
        # drop trailing zero-length closing line if present
        if n>1 and isinstance(segs[-1],Line) and abs(segs[-1].start-segs[-1].end)<1e-6:
            v.pop(); i.pop(); o.pop()
            # fix in-tangent of first vertex from new last seg
            ps,pc1,pc2,pe=seg_cubic(segs[-2]); i[0]=pc2-pe
    f=lambda z:[round(z.real,3),round(z.imag,3)]
    return {"c":closed,"v":[f(z) for z in v],"i":[f(z) for z in i],"o":[f(z) for z in o]}

def path_to_lottie(d):
    p=parse_path(d)
    return [subpath_to_lottie(sub) for sub in p.continuous_subpaths()]

def bbox_of(shapes):
    xs=[pt[0] for s in shapes for pt in s["v"]]; ys=[pt[1] for s in shapes for pt in s["v"]]
    return [min(xs),min(ys),max(xs),max(ys)]

def load():
    s=open(SVGDIR+"LOGO+TAG.svg").read()
    out={}
    iso_d=re.search(r'<g id="iso">.*?d="([^"]+)"',s,re.S).group(1)
    out["iso"]=path_to_lottie(iso_d)
    circles=re.findall(r'<circle class="cls-2" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/>',s)
    out["circles"]=[[float(a),float(b),float(c)] for a,b,c in circles]
    text_d=re.search(r'<g id="text">.*?d="([^"]+)"',s,re.S).group(1)
    subs=path_to_lottie(text_d)
    # group subpaths into letters by x overlap
    subs.sort(key=lambda sp:bbox_of([sp])[0])
    letters=[]
    for sp in subs:
        bb=bbox_of([sp])
        placed=False
        for L in letters:
            lb=bbox_of(L)
            if bb[0] < lb[2]-5 and bb[2] > lb[0]+5:  # x-overlap
                L.append(sp); placed=True; break
        if not placed: letters.append([sp])
    names=["i","n","k","a","y","n2","i2"]
    assert len(letters)==7, len(letters)
    out["letters"]={nm:{"shapes":L,"bbox":bbox_of(L)} for nm,L in zip(names,letters)}
    tag=re.search(r'<g id="tag">(.*?)</g>\s*</svg>',s,re.S).group(1)
    tag_ds=re.findall(r'd="([^"]+)"',tag)
    out["tag"]=[sp for d in tag_ds for sp in path_to_lottie(d)]
    out["tag_bbox"]=bbox_of(out["tag"])
    # PATH_TAG strokes (write-on order as in file)
    pt=open(SVGDIR+"PATH_TAG.svg").read()
    items=[]
    for m in re.finditer(r'<path[^>]*d="([^"]+)"|<circle[^>]*cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"',pt):
        if m.group(1): items.append({"type":"path","shapes":path_to_lottie(m.group(1))})
        else: items.append({"type":"circle","c":[float(m.group(2)),float(m.group(3))],"r":float(m.group(4))})
    out["pathtag"]=items
    allpts=[s for it in items if it["type"]=="path" for s in it["shapes"]]
    out["pathtag_bbox"]=bbox_of(allpts)
    return out

if __name__=="__main__":
    g=load()
    json.dump(g,open(os.path.join(W,"glyphs.json"),"w"))
    print("iso subpaths",len(g["iso"]),"circles",g["circles"])
    for nm,L in g["letters"].items(): print(nm,"subpaths",len(L["shapes"]),"bbox",[round(x,1) for x in L["bbox"]])
    print("tag paths",len(g["tag"]),"bbox",[round(x,1) for x in g["tag_bbox"]])
    print("pathtag items",len(g["pathtag"]),"bbox",[round(x,1) for x in g["pathtag_bbox"]])
    print("iso first subpath:",g["iso"][0])

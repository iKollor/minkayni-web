"""Hybrid: After Effects (Bodymovin) export for TEXTO/TAG + measured layers for figures/isotype.
Fixes for lottie-web: camera baked into a null, Gradient Ramp -> gradient fill via track matte,
n/n2 outline+offset+double trim -> centerline stroke with one trim, unsupported effects removed."""
import json, copy, math, numpy as np, os, sys
HERE=os.path.dirname(os.path.abspath(__file__))
W=os.environ.get("INTRO_WORK",os.path.join(HERE,"work"))
if not os.path.exists(os.path.join(W,"glyphs.json")):
    # sin el directorio de trabajo del pipeline de medición, usa las copias guardadas en ae/
    W=os.path.join(HERE,"ae"); os.environ["INTRO_WORK"]=W
from glyphutil import G, shape_polygon
AE=json.load(open(sys.argv[1] if len(sys.argv)>1 else os.path.join(HERE,"ae","logo_intro_ae.json")))
MINE=json.load(open(sys.argv[2] if len(sys.argv)>2 else os.path.join(HERE,"ae","logo_intro_medido.json")))
CL=json.load(open(os.path.join(W,"centerlines.json")))
NF=120
AS={x["id"]:x for x in AE["assets"]}
root={L["nm"]:L for L in AE["layers"]}

# ------------------------------------------------------------ keyframe evaluation (temporal bezier)
def bez_y_at_x(x, ox, oy, ix, iy):
    # cubic bezier (0,0),(ox,oy),(ix,iy),(1,1): solve t for x then return y
    lo,hi=0.0,1.0
    for _ in range(40):
        t=(lo+hi)/2
        xt=3*(1-t)**2*t*ox+3*(1-t)*t**2*ix+t**3
        if xt<x: lo=t
        else: hi=t
    t=(lo+hi)/2
    return 3*(1-t)**2*t*oy+3*(1-t)*t**2*iy+t**3
def evaluate(prop, f):
    if prop.get("a",0)==0: return np.array(prop["k"],float)
    ks=prop["k"]
    if f<=ks[0]["t"]: return np.array(ks[0]["s"],float)
    for k0,k1 in zip(ks,ks[1:]):
        if k0["t"]<=f<=k1["t"]:
            s0=np.array(k0["s"],float); s1=np.array(k1.get("s",k0["s"]),float)
            if k1["t"]==k0["t"]: return s1
            u=(f-k0["t"])/(k1["t"]-k0["t"])
            if k0.get("h")==1: return s0
            o=k0.get("o",{"x":0.167,"y":0.167}); i=k0.get("i",{"x":0.833,"y":0.833})
            ox=o["x"][0] if isinstance(o["x"],list) else o["x"]; oy=o["y"][0] if isinstance(o["y"],list) else o["y"]
            ix=i["x"][0] if isinstance(i["x"],list) else i["x"]; iy=i["y"][0] if isinstance(i["y"],list) else i["y"]
            p=bez_y_at_x(u,ox,oy,ix,iy)
            return s0+(s1-s0)*p
    return np.array(ks[-1]["s"],float)

def static(v): return {"a":0,"k":v}
def kf(keys):
    if len(keys)==1: return {"a":0,"k":keys[0][1]}
    return {"a":1,"k":[{"t":f,"s":(v if isinstance(v,list) else [v]),"i":{"x":[0.833]*3,"y":[0.833]*3},"o":{"x":[0.167]*3,"y":[0.167]*3}} for f,v in keys]}
def compact(keys):
    out=[]
    for i,(f,v) in enumerate(keys):
        if i==0 or i==len(keys)-1 or v!=keys[i-1][1] or v!=keys[i+1][1]: out.append((f,v))
    return out
def transform2d(a=(0,0),p=(0,0),s=(100,100),r=0,o=100):
    return {"a":static([a[0],a[1],0]),"p":static([p[0],p[1],0]),"s":static([s[0],s[1],100]),"r":static(r),"o":static(o)}

# ------------------------------------------------------------ 1. camera bake -> null "CAM"
nulo=root["Nulo 2"]["ks"]["p"]; cam=root["Cámara 1"]; zoom=cam["pe"]; camz=-cam["ks"]["p"]["k"][2]  # 2604.7
pos=[];sc=[]
for f in range(NF):
    n=evaluate(nulo,f); z=float(evaluate(zoom,f)[0]); s=z/camz
    pos.append((f,[round(960-n[0]*s,3),round(540-n[1]*s,3),0])); sc.append((f,[round(s*100,4)]*3))
CAM={"ddd":0,"ind":1,"ty":3,"nm":"CAM (cámara horneada)","sr":1,"ks":{"o":static(0),"r":static(0),"p":kf(compact(pos)),"a":static([0,0,0]),"s":kf(compact(sc))},"ao":0,"ip":0,"op":NF,"st":0,"bm":0}
print("camera scale f0=%.4f f119=%.4f; null f119=%s"%(evaluate(zoom,0)[0]/camz,evaluate(zoom,119)[0]/camz,pos[-1][1]))

# ------------------------------------------------------------ 2. TEXTO: clean letters, fix n/n2, add blur
TEXTO=copy.deepcopy(AS["TEXTO"])
def their_bbox(shapes):
    pts=np.vstack([shape_polygon(sh["ks"]["k"]) for sh in shapes])
    return pts.min(0),pts.max(0)
def centerline_shape(outline_shapes):
    mn,mx=their_bbox(outline_shapes)
    b=G["letters"]["n"]["bbox"]
    # bbox of my glyph sampled with curves
    mine=np.vstack([shape_polygon(s) for s in G["letters"]["n"]["shapes"]]); bmn,bmx=mine.min(0),mine.max(0)
    sx=(mx[0]-mn[0])/(bmx[0]-bmn[0]); sy=(mx[1]-mn[1])/(bmx[1]-bmn[1])
    P=np.array(CL["n"]["pts"]); Q=np.stack([mn[0]+(P[:,0]-bmn[0])*sx, mn[1]+(P[:,1]-bmn[1])*sy],1)
    n=len(Q); i=np.zeros_like(Q); o=np.zeros_like(Q)
    for k in range(n):
        if k==0: o[k]=(Q[1]-Q[0])/3
        elif k==n-1: i[k]=(Q[n-2]-Q[n-1])/3
        else: t=(Q[k+1]-Q[k-1])/6; o[k]=t; i[k]=-t
    r=lambda a:[[round(float(x),3),round(float(y),3)] for x,y in a]
    print("n centerline mapped: sx=%.3f sy=%.3f start=%s end=%s"%(sx,sy,r(Q)[0],r(Q)[-1]))
    return {"c":False,"v":r(Q),"i":r(i),"o":r(o)}
letters_soft={}
import glob
for fpath in glob.glob(os.path.join(W,"letters_*.json")):
    for nm,d in json.load(open(fpath)).items(): letters_soft[nm]={int(f):v.get("soft") for f,v in d.items()}
LETTER_SIGMA={('i',55):8,('i',56):18,('i',57):12,('i',58):5,('i2',60):12,('i2',61):22,('i2',62):14,('i2',63):6,('y',62):9,('y',63):8,('k',62):7,('k',63):5}
PAN=set(range(59,65))
def soft_to_blur(soft):
    if soft is None: return 0
    return round(min(max(0.0,(soft-1.6)/2.67),120)*2/0.3,1)
def blur_effect(keys):
    return {"ty":29,"nm":"Motion blur","np":5,"mn":"ADBE Gaussian Blur 2","ix":1,"en":1,"ef":[
        {"ty":0,"nm":"Blurriness","mn":"ADBE Gaussian Blur 2-0001","ix":1,"v":kf([(f,[v]) for f,v in keys]) if len(keys)>1 else static(keys[0][1])},
        {"ty":7,"nm":"Blur Dimensions","mn":"ADBE Gaussian Blur 2-0002","ix":2,"v":static(1)},
        {"ty":7,"nm":"Repeat Edge Pixels","mn":"ADBE Gaussian Blur 2-0003","ix":3,"v":static(0)}]}
def big_rect(center):
    return {"ty":"gr","nm":"bbox","it":[{"ty":"rc","d":1,"s":static([6000,6000]),"p":static(list(center)),"r":static(0)},{"ty":"fl","c":static([0,0,0,1]),"o":static(0),"r":1},{"ty":"tr","p":static([0,0]),"a":static([0,0]),"s":static([100,100]),"r":static(0),"o":static(100),"sk":static(0),"sa":static(0)}]}
NAME_MAP={"i":"i","n":"n","k":"k","a":"a","y":"y","n 2":"n2","i 2":"i2"}
n_center=None
for L in TEXTO["layers"]:
    L["ef"]=[e for e in L.get("ef",[]) if e.get("ty")!=5]   # BOUNCr pseudo-effects
    L["shapes"]=[it for it in L["shapes"] if it["ty"]!="mm"]  # merge paths: not supported, windings already correct
    if L["nm"] in ("n","n 2"):
        grp=[it for it in L["shapes"] if it["ty"]=="gr"][0]
        outline=[it for it in grp["it"] if it["ty"]=="sh"]
        if n_center is None: n_center=centerline_shape(outline)
        trim2=[it for it in L["shapes"] if it["ty"]=="tm"][1]
        ekeys=[]
        for k in trim2["s"]["k"]:
            nk={"t":k["t"],"s":[100-k["s"][0]]}
            if "i" in k: nk["i"]=k["i"]; nk["o"]=k["o"]
            ekeys.append(nk)
        stroke=[it for it in L["shapes"] if it["ty"]=="st"][0]
        L["shapes"]=[{"ty":"gr","nm":"n trazo","it":[{"ty":"sh","ks":static(n_center),"nm":"centro"},
                      {"ty":"tm","s":static(0),"e":{"a":1,"k":ekeys},"o":static(0),"m":1,"nm":"reveal"},
                      stroke,{"ty":"tr","p":static([0,0]),"a":static([0,0]),"s":static([100,100]),"r":static(0),"o":static(100),"sk":static(0),"sa":static(0)}]}]
    # motion blur measured from the video
    nm=NAME_MAP.get(L["nm"])
    if nm and nm in letters_soft:
        keys=[]
        for f in range(55,NF):
            sig=LETTER_SIGMA.get((nm,f))
            v=round(sig/0.3,1) if sig is not None else (0 if f in PAN else soft_to_blur(letters_soft[nm].get(f)))
            keys.append((f-55,v))
        keys=compact(keys)
        if any(v>0 for _,v in keys):
            L["ef"].append(blur_effect(keys))
            anchor=L["ks"]["a"]["k"][:2] if L["ks"]["a"].get("a",0)==0 else [0,0]
            L["shapes"].append(big_rect(anchor))  # al final: los rellenos de la capa no le afectan

# ------------------------------------------------------------ 3. TEXTO_grad: gradient (from Gradient Ramp) matted by TEXTO
TX=root["TEXTO"]; ramp=TX["ef"][0]["ef"]
start=copy.deepcopy(ramp[0]["v"]); end=copy.deepcopy(ramp[2]["v"]); c0=ramp[1]["v"]["k"][:3]; c1=ramp[3]["v"]["k"][:3]
for k in start["k"]: k["t"]-=TX["st"]   # into TEXTO time
mask=copy.deepcopy(TX["masksProperties"])
for m in mask: m["x"]=static(0)   # feather not supported by lottie-web (kept hard)
grad_layer={"ddd":0,"ind":2,"ty":4,"nm":"degradado","sr":1,"ks":{"o":static(100),"r":static(0),"p":static([0,0,0]),"a":static([0,0,0]),"s":static([100,100,100])},"ao":0,"tt":1,
    "shapes":[{"ty":"gr","nm":"rampa","it":[{"ty":"rc","d":1,"s":static([6000,6000]),"p":static([960,540]),"r":static(0)},
        {"ty":"gf","o":static(100),"r":1,"g":{"p":2,"k":static([0]+[round(c,4) for c in c0]+[1]+[round(c,4) for c in c1])},"s":start,"e":end,"t":1,"nm":"grad"},
        {"ty":"tr","p":static([0,0]),"a":static([0,0]),"s":static([100,100]),"r":static(0),"o":static(100),"sk":static(0),"sa":static(0)}]}],"ip":0,"op":NF,"st":0,"bm":0}
texto_in={"ddd":0,"ind":1,"ty":0,"nm":"TEXTO (mate)","refId":"TEXTO","sr":1,"ks":{"o":static(100),"r":static(0),"p":static([960,540,0]),"a":static([960,540,0]),"s":static([100,100,100])},"ao":0,"td":1,"hasMask":True,"masksProperties":mask,"w":1920,"h":1080,"ip":0,"op":NF,"st":0,"bm":0}
TEXTO_GRAD={"id":"TEXTO_grad","nm":"TEXTO con degradado","fr":24,"layers":[texto_in,grad_layer]}

# ------------------------------------------------------------ 4. SCENE
scene=[]
tag=copy.deepcopy(root["TAG"]); tag["ddd"]=0; tag["op"]=NF; scene.append(tag)
texto=copy.deepcopy(TX); texto.pop("ef",None); texto.pop("masksProperties",None); texto.pop("hasMask",None); texto["ddd"]=0; texto["refId"]="TEXTO_grad"; texto["nm"]="TEXTO"; texto["op"]=NF; texto["parent"]="CAM"
for k in ("rx","ry","rz","or"): texto["ks"].pop(k,None)
scene.append(texto)
scene.append(CAM)
mine_scene=[x for x in MINE["assets"] if x["id"]=="scene"][0]["layers"]
KEEP={"iso","iso-body","head-L","head-R","P-body","B-body"}
for L in mine_scene:
    if L["nm"] in KEEP: scene.append(copy.deepcopy(L))
for i,L in enumerate(scene): L["ind"]=i+1
cam_ind=[L["ind"] for L in scene if L["nm"].startswith("CAM")][0]
for L in scene:
    if L.get("parent")=="CAM": L["parent"]=cam_ind
root_layer=copy.deepcopy(MINE["layers"][0])
anim={"v":"5.12.2","fr":24,"ip":0,"op":NF,"w":1920,"h":1080,"nm":"Minkayni logo intro","ddd":0,
      "assets":[AS["TAG"],TEXTO,TEXTO_GRAD,{"id":"scene","nm":"scene","fr":24,"layers":scene}],"layers":[root_layer],"markers":[]}
out=sys.argv[3] if len(sys.argv)>3 else os.path.join(HERE,"..","..","src","assets","lottie","logo_intro.json")
json.dump(anim,open(out,"w"),separators=(",",":"))
print("written",out,os.path.getsize(out)//1024,"KB; scene layers:",[L["nm"] for L in scene])

import os
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
"""Assemble the Minkayni logo intro as a Lottie (bodymovin) JSON from the per-frame measurements."""
import json, math, numpy as np, glob
from PIL import Image, ImageDraw
from glyphutil import G, Glyph, shape_polygon
from track_nreveal import invert as ninvert

W,H,FPS,NF=1920,1080,24,120
PURPLE=[0.431,0.0,0.639]; BLUE=[0.247,0.663,0.961]

fig={int(k):v for k,v in json.load(open(os.path.join(W,"fig_0_76.json"))).items()}
misc=json.load(open(os.path.join(W,"misc.json")))
comps=json.load(open(os.path.join(W,"comps.json")))
letters={}
for f in glob.glob(os.path.join(W,"letters_*.json")): letters.update(json.load(open(f)))
letters={k:{int(f):v for f,v in d.items()} for k,d in letters.items()}
nrev=json.load(open(os.path.join(W,"nreveal.json"))); CL=json.load(open(os.path.join(W,"centerlines.json")))

# ---------------------------------------------------------------- helpers
def kf(keys, dims=None):
    """keys: list of (frame, value) sorted -> lottie animated property (linear)."""
    keys=sorted(keys,key=lambda k:k[0])
    if len(keys)==1: return {"a":0,"k":keys[0][1]}
    out=[]
    for f,v in keys:
        out.append({"t":f,"s":v if isinstance(v,list) else [v],"i":{"x":[0.833],"y":[0.833]},"o":{"x":[0.167],"y":[0.167]}})
    return {"a":1,"k":out}
def kf_scalar(keys):
    return kf([(f,[v]) for f,v in keys])
def static(v): return {"a":0,"k":v}

def catmull(P):
    P=np.asarray(P,float); n=len(P); i=np.zeros_like(P); o=np.zeros_like(P)
    for k in range(n):
        if k==0: o[k]=(P[1]-P[0])/3
        elif k==n-1: i[k]=(P[n-2]-P[n-1])/3
        else:
            t=(P[k+1]-P[k-1])/6; o[k]=t; i[k]=-t
    r=lambda a:[[round(float(x),2),round(float(y),2)] for x,y in a]
    return {"c":False,"v":r(P),"i":r(i),"o":r(o)}
def poly(P):
    P=np.asarray(P,float); z=[[0,0]]*len(P)
    return {"c":False,"v":[[round(float(x),2),round(float(y),2)] for x,y in P],"i":z,"o":z}
def path_kf(keys):
    keys=sorted(keys,key=lambda k:k[0])
    if len(keys)==1: return {"a":0,"k":keys[0][1]}
    return {"a":1,"k":[{"t":f,"s":[v],"i":{"x":0.833,"y":0.833},"o":{"x":0.167,"y":0.167}} for f,v in keys]}
def xform_shape(sh, fn):
    """apply affine fn (numpy (n,2)->(n,2)) to vertices; tangents are relative so apply linear part."""
    v=np.array(sh["v"]); i=np.array(sh["i"]); o=np.array(sh["o"])
    v2=fn(v); zero=fn(np.zeros((1,2)))
    i2=fn(i)-zero; o2=fn(o)-zero
    r=lambda a:[[round(float(x),3),round(float(y),3)] for x,y in a]
    return {"c":sh["c"],"v":r(v2),"i":r(i2),"o":r(o2)}
def gradient(kind, skeys, ekeys, width=None):
    g={"ty":kind,"o":static(100),"g":{"p":2,"k":static([0]+PURPLE+[1]+BLUE)},"s":kf(skeys),"e":kf(ekeys),"t":1,"nm":"grad"}
    if kind=="gf": g["r"]=1
    else: g.update({"w":width,"lc":2,"lj":2,"ml":4})
    return g
def transform(p=None,a=None,s=None,r=None,o=None):
    return {"p":p or static([0,0]),"a":a or static([0,0]),"s":s or static([100,100]),"r":r or static(0),"o":o or static(100),"sk":static(0),"sa":static(0)}
def layer(name, shapes, ip=0, op=NF, ks=None, effects=None, ind=None, extra=None):
    L={"ddd":0,"ind":ind,"ty":4,"nm":name,"sr":1,"ks":ks or {"o":static(100),"r":static(0),"p":static([0,0,0]),"a":static([0,0,0]),"s":static([100,100,100])},"ao":0,"shapes":shapes,"ip":ip,"op":op,"st":0,"bm":0}
    if effects: L["ef"]=effects
    if extra: L.update(extra)
    return L
def big_rect():  # invisible rect enlarging the layer bbox so svg blur filters are not clipped
    return {"ty":"gr","nm":"bbox","it":[{"ty":"rc","d":1,"s":static([6000,6000]),"p":static([W/2,H/2]),"r":static(0)},{"ty":"fl","c":static([0,0,0,1]),"o":static(0),"r":1},{"ty":"tr",**transform()}]}
def blur_effect(keys, dims=1, name="Blur"):
    return {"ty":29,"nm":name,"np":5,"mn":"ADBE Gaussian Blur 2","ix":1,"en":1,"ef":[
        {"ty":0,"nm":"Blurriness","mn":"ADBE Gaussian Blur 2-0001","ix":1,"v":kf_scalar(keys) if len(keys)>1 else static(keys[0][1])},
        {"ty":7,"nm":"Blur Dimensions","mn":"ADBE Gaussian Blur 2-0002","ix":2,"v":static(dims)},
        {"ty":7,"nm":"Repeat Edge Pixels","mn":"ADBE Gaussian Blur 2-0003","ix":3,"v":static(0)}]}
def soft_to_blur(soft, cap=120):
    if soft is None: return 0
    sigma=max(0.0,(soft-1.6)/2.67); sigma=min(sigma,cap)
    return round(sigma/0.3,1)
def blur_keys(frames_soft, hold_zero_outside=True):
    keys=[]
    for f,s in frames_soft: keys.append((f,soft_to_blur(s)))
    return keys

# ---------------------------------------------------------------- gradient timeline (screen space)
def prg(f):
    """purple right edge / blue left edge from components."""
    P=[c["bb"][2] for c in comps[f]["P"]]; B=[c["bb"][0] for c in comps[f]["B"]]
    return (max(P) if P else None),(min(B) if B else None)
grad={}
for f in range(NF):
    if f<26: grad[f]=(2000,2100)
    elif f<54:
        pr,bl=prg(f)
        xs,xe=(pr or 800)+25,(bl or 1900)-25
        if xs+4>xe: m=((pr or 800)+(bl or 1900))/2; xs,xe=m-2,m+2
        grad[f]=(xs,xe)
    elif f==54:
        grad[f]=(905,925)   # las figuras aún tienen su color propio; el brazo azul sigue azul
    else:
        g=misc["gradient"].get(str(f))
        grad[f]=(g["xs"],g["xe"]) if g else grad[f-1]
# smooth 55..62 lightly (noisy during pan)
grad[55]=(915,955)   # medido: el degradado empieza a cruzar entre figuras en f56
def grad_keys_screen(y=540, frames=range(NF)):
    return [(f,[grad[f][0],y]) for f in frames],[(f,[grad[f][1],y]) for f in frames]

# ---------------------------------------------------------------- pan / scene blur
PAN_FRAMES=set(range(24,31))|set(range(59,65))
BLURRED={9,10,11,16,17,26,27,33,34,41}
SCENE_SIGMA={24:6,25:14,26:45,27:45,28:13,29:5,30:2,59:3,60:18,61:25,62:4,63:2.5,64:1}
scene_blur=[(f, round(SCENE_SIGMA[f]/0.3,1) if f in SCENE_SIGMA else 0) for f in range(NF)]
# keep only change points
def compact(keys):
    out=[]
    for i,(f,v) in enumerate(keys):
        if i==0 or i==len(keys)-1 or v!=keys[i-1][1] or v!=keys[i+1][1]: out.append((f,v))
    return out

# ---------------------------------------------------------------- figures (f0..53)
HEAD_P={}; HEAD_D_P={}; HEAD_B={}; HEAD_D_B={}
for f in range(54):
    P=fig[f]["P"]; B=fig[f]["B"]
    if P and P["head"]: HEAD_P[f]=tuple(P["head"]); HEAD_D_P[f]=P["head_d"]
    if B and B["head"]: HEAD_B[f]=tuple(B["head"]); HEAD_D_B[f]=B["head_d"]
# manual head fixes (blurred / off-screen)
HEAD_P.update({9:(520,246),10:(533,138),11:(575,-20),12:(620,-120),13:(665,-170),14:(705,-150),15:(735,-60),16:(770,40),17:(944,247),
               26:(830,287),27:(345,289),33:(150,175),34:(175,45),35:(185,-60),36:(170,-130),37:(160,-160),38:(155,-150),39:(150,-100),40:(150,-30),41:(330,120),42:(496,286),43:(648,288),44:(853,304)})
for f in list(HEAD_D_P):
    if f<54 and (HEAD_D_P[f] is None or HEAD_D_P[f]<90): del HEAD_D_P[f]
HEAD_B.update({26:(1847,290),27:(1468,290)})
for f in list(HEAD_D_B):
    if f<54 and (HEAD_D_B[f] is None or HEAD_D_B[f]<90): del HEAD_D_B[f]
def head_d_keys(D, frames, default=100.0):
    return [(f,[D.get(f,default),D.get(f,default)]) for f in frames]

def figure_layers(name, frames, color_hint):
    spine_keys=[]; arm_keys=[]; width_keys=[]; soft=[]
    last_arm=None
    for f in frames:
        F=fig[f][name]
        if not F: continue
        sp=np.array(F["spine"])
        if f in (9,10):
            d=np.r_[0,np.cumsum(np.linalg.norm(np.diff(sp,axis=0),axis=1))]; t=np.linspace(105,d[-1],8)
            sp=np.stack([np.interp(t,d,sp[:,0]),np.interp(t,d,sp[:,1])],1)
        spine_keys.append((f,catmull(sp)))
        if F["arm"] and not (name=="P" and f in BLURRED):
            a=np.array(F["arm"])
            # el brazo nace en el hombro (extremo superior del cuerpo), no en la
            # unión del esqueleto, que queda más abajo y dejaba un «bulto» visible
            arm=np.array([sp[0],(sp[0]+a[1])/2*0.35+a[1]*0.65,a[2]]); last_arm=arm
        else: arm=np.repeat(sp[:1],3,0)
        arm_keys.append((f,catmull(arm)))
        width_keys.append((f,F["width"]))
        soft.append((f,F["soft"]))
    # widths: shrink at the zoom is real; keep measured but clamp 84..98 before 51
    width_keys=[(f,(min(max(w,92),98) if f<51 else w)) for f,w in width_keys]
    if name=="P": width_keys=[(f,(50 if f==54 else 40 if f==55 else w)) for f,w in width_keys]
    s,e=grad_keys_screen(frames=[f for f,_ in spine_keys])
    blur=[(f,(0 if f in PAN_FRAMES else soft_to_blur(sf))) for f,sf in soft]
    shapes=[big_rect(),{"ty":"gr","nm":"spine","it":[{"ty":"sh","ks":path_kf(spine_keys),"nm":"spine"},{"ty":"sh","ks":path_kf(arm_keys),"nm":"arm"},gradient("gs",s,e,kf_scalar(width_keys)),{"ty":"tr",**transform()}]}]
    return layer(f"{name}-body",shapes,ip=frames[0],op=frames[-1]+1,effects=[blur_effect(compact(blur))])

def head_layer(name, HEADS, D, frames, extra_blur=None):
    pos=[(f,[HEADS[f][0],HEADS[f][1]]) for f in frames if f in HEADS]
    size=head_d_keys(D,[f for f,_ in pos])
    s,e=grad_keys_screen(frames=[f for f,_ in pos])
    shapes=[big_rect(),{"ty":"gr","nm":"head","it":[{"ty":"el","d":1,"s":kf(size),"p":kf(pos),"nm":"circle"},gradient("gf",s,e),{"ty":"tr",**transform()}]}]
    eff=[blur_effect(compact(extra_blur))] if extra_blur else None
    return layer(name,shapes,ip=frames[0],op=frames[-1]+1,effects=eff)

# ---------------------------------------------------------------- M body f54..80 and heads
M_FRAMES=list(range(56,81))
def m_layers():
    keys=[]; wk=[]; soft=[]
    for f in M_FRAMES:
        d=misc["iso"][str(f)]
        keys.append((f,catmull(np.array(d["M"])))); wk.append((f,d["width"])); soft.append((f,d["soft"]))
    s,e=grad_keys_screen(frames=M_FRAMES)
    blur=[(f,(0 if f in PAN_FRAMES else soft_to_blur(sf))) for f,sf in soft]
    shapes=[big_rect(),{"ty":"gr","nm":"M","it":[{"ty":"sh","ks":path_kf(keys),"nm":"M"},gradient("gs",s,e,kf_scalar(wk)),{"ty":"tr",**transform()}]}]
    ks={"o":kf_scalar([(80,100),(84,0)]),"r":static(0),"p":static([0,0,0]),"a":static([0,0,0]),"s":static([100,100,100])}
    return layer("iso-body",shapes,ip=56,op=85,ks=ks,effects=[blur_effect(compact(blur))])
# heads after 54 from misc (L,R)
for f in range(54,81):
    hs=misc["iso"][str(f)]["heads"]
    if len(hs)>=1: HEAD_P[f]=(hs[0][0],hs[0][1]); HEAD_D_P[f]=hs[0][2]
    if len(hs)>=2 and hs[-1][0]>hs[0][0]+100 and hs[-1][1]<430: HEAD_B[f]=(hs[-1][0],hs[-1][1]); HEAD_D_B[f]=hs[-1][2]
# fixes: f59-61 right head bad; interpolate
HEAD_B[59]=(1040,398); HEAD_B[60]=(985,395); HEAD_B[61]=(800,380); HEAD_B[62]=(741,368)
for f in (60,61): HEAD_D_P[f]=37.5
for f in (59,60,61,62): HEAD_D_B[f]=38.5
for f in range(55,85):
    HEAD_D_P.setdefault(f,38.5); HEAD_D_B.setdefault(f,38.5)
    HEAD_P.setdefault(f,HEAD_P[80]); HEAD_B.setdefault(f,HEAD_B[80])
HEAD_P[119]=HEAD_P[80]; HEAD_B[119]=HEAD_B[80]

# ---------------------------------------------------------------- final iso (exact geometry) from f81
ISO_S=0.7188; ISO_OFF=np.array([574.0,360.6])
ISO_STROKE=52.9; ISO_HEAD_D=53.6; HL0=np.array([25.62,25.62]); HR0=np.array([230.55,25.62])
def iso_layer(frames):
    """exact iso geometry in logo units; per-frame similarity transform fitted to the two tracked heads."""
    a=[float(HL0[0]),float(HL0[1])]
    pos=[];rot=[];sc=[];gs=[];ge=[];bl=[]
    for f in frames:
        L=np.array(HEAD_P[f]); R=np.array(HEAD_B[f]); d=R-L
        sf=np.linalg.norm(d)/204.93; r=math.degrees(math.atan2(d[1],d[0]))
        pos.append((f,[float(L[0]),float(L[1]),0])); rot.append((f,round(r,3))); sc.append((f,[sf*100,sf*100,100]))
        ls,le=local_grad(L[0],L[1],r,sf,sf,a,grad[f][0],grad[f][1]); gs.append((f,ls)); ge.append((f,le))
        soft=misc["iso"][str(f)]["soft"] if str(f) in misc["iso"] else None
        bl.append((f,0 if f in PAN_FRAMES else soft_to_blur(soft)))
    last=frames[-1]
    for f in range(last+1,NF):
        L=np.array(HEAD_P[last]); R=np.array(HEAD_B[last]); d=R-L; sf=np.linalg.norm(d)/204.93; r=math.degrees(math.atan2(d[1],d[0]))
        ls,le=local_grad(L[0],L[1],r,sf,sf,a,grad[f][0],grad[f][1]); gs.append((f,ls)); ge.append((f,le))
    circles=[{"ty":"el","d":1,"s":static([ISO_HEAD_D,ISO_HEAD_D]),"p":static([cx,cy]),"nm":"head"} for cx,cy,_ in G["circles"]]
    shapes=[{"ty":"gr","nm":"bbox","it":[{"ty":"rc","d":1,"s":static([8000,8000]),"p":static(a),"r":static(0)},{"ty":"fl","c":static([0,0,0,1]),"o":static(0),"r":1},{"ty":"tr",**transform()}]},
            {"ty":"gr","nm":"iso","it":[{"ty":"sh","ks":static(G["iso"][0]),"nm":"M"},gradient("gs",gs,ge,static(ISO_STROKE)),{"ty":"tr",**transform()}]},
            {"ty":"gr","nm":"heads","it":circles+[gradient("gf",gs,ge),{"ty":"tr",**transform()}]}]
    ks={"o":kf_scalar([(80,0),(84,100)]),"r":kf_scalar(rot),"p":kf(pos),"a":static(a+[0]),"s":kf(sc)}
    return layer("iso",shapes,ip=80,op=NF,ks=ks)

# ---------------------------------------------------------------- letters
TEXT_S=0.7268; TEXT_OFF=np.array([576.5,362.4]); LETTER_OUTLINE=2.9
NAMES=["i","n","k","a","y","n2","i2"]
glyphs={n:Glyph(G["letters"][n]["shapes"]) for n in NAMES}
def F(name,f): 
    r=letters[name][f]; return (r["tx"],r["ty"],r["rot"],r["sx"],r["sy"],r.get("soft"))
def key_range(name,a,b): return {f:F(name,f) for f in range(a,b+1)}
LETTER_SIGMA={('i',55):8,('i',56):18,('i',57):12,('i',58):5,('i2',60):12,('i2',61):22,('i2',62):14,('i2',63):6,('y',62):9,('y',63):8,('k',62):7,('k',63):5}
LT={}  # name -> {frame: (tx,ty,rot,sx,sy,soft)}
# i
LT["i"]={55:(1100,651,0,.85,.75,3),56:(1088,584,0,.85,.75,3),57:(1083,519,0,.85,.75,3),58:(1080,492,-3,.85,.75,3),59:(1073,470,-5,.85,.75,None),60:(1032,448,-7,.85,.75,None),61:(850,427,-8,.85,.75,None),
         62:(795,405,-9,.85,.75,7.3),63:(780,400,-9,.85,.75,3.8),64:(776,398,-9,.85,.75,3.9),65:(777,415,-8,.85,.75,7.7),66:(789,462,-4,.85,.75,12)}
LT["i"].update(key_range("i",67,80))
# n (glyph from 67)
LT["n"]=key_range("n",67,80)
# k
LT["k"]={61:(1049,443,-30,.45,.45,None)}; LT["k"].update(key_range("k",62,80))
# a
LT["a"]={65:(985,548,0,.45,.45,None),66:(1000,548,0,.62,.62,8),67:(1010,548,0,.75,.75,7.8)}; LT["a"].update(key_range("a",68,80))
# y
LT["y"]={60:(1269,356,-60,.35,.35,None),61:(1006,344,-50,.35,.35,None),62:(997,391,-40,.75,.75,9),63:(1060,483,-30,.75,.75,9)}; LT["y"].update(key_range("y",64,80))
# n2 glyph from 75
LT["n2"]={f:F("n2",95)[:5]+(1.0,) for f in range(75,81)}
# i2
LT["i2"]={59:(1760,640,0,.85,.75,None),60:(1565,626,0,.85,.75,None),61:(1393,601,0,.85,.75,None)}; LT["i2"].update(key_range("i2",62,80))

def local_grad(tx,ty,rot,sx,sy,anchor,xs,xe):
    c,s=math.cos(math.radians(-rot)),math.sin(math.radians(-rot))
    def loc(q):
        dx,dy=q[0]-tx,q[1]-ty
        rx,ry=dx*c-dy*s, dx*s+dy*c
        return [round(rx/sx+anchor[0],2),round(ry/sy+anchor[1],2)]
    return loc((xs,ty)),loc((xe,ty))

def letter_layer(name):
    g=glyphs[name]; T=LT[name]; frames=sorted(T)
    a=[float(g.anchor[0]),float(g.anchor[1])]
    pos=[];rot=[];sc=[];gs=[];ge=[];bl=[]
    for f in frames:
        tx,ty,r,sx,sy,soft=T[f]
        pos.append((f,[tx,ty])); rot.append((f,r)); sc.append((f,[sx*100,sy*100]))
        ls,le=local_grad(tx,ty,r,sx,sy,a,grad[f][0],grad[f][1]); gs.append((f,ls)); ge.append((f,le))
        sig=LETTER_SIGMA.get((name,f))
        bl.append((f,round(sig/0.3,1) if sig is not None else (0 if f in PAN_FRAMES else soft_to_blur(soft)*2)))
    # hold gradient in local space after last key while global gradient keeps moving
    tx,ty,r,sx,sy,_=T[frames[-1]]
    for f in range(frames[-1]+1,NF):
        ls,le=local_grad(tx,ty,r,sx,sy,a,grad[f][0],grad[f][1]); gs.append((f,ls)); ge.append((f,le))
    shapes=[{"ty":"gr","nm":"bbox","it":[{"ty":"rc","d":1,"s":static([6000,6000]),"p":static(a),"r":static(0)},{"ty":"fl","c":static([0,0,0,1]),"o":static(0),"r":1},{"ty":"tr",**transform()}]},
            {"ty":"gr","nm":name,"it":[{"ty":"sh","ks":static(s),"nm":"g"} for s in G["letters"][name]["shapes"]]+[gradient("gf",gs,ge),gradient("gs",gs,ge,static(LETTER_OUTLINE)),{"ty":"tr",**transform()}]}]
    ks={"o":static(100),"r":kf_scalar(rot),"p":kf([(f,v+[0]) for f,v in pos]),"a":static(a+[0]),"s":kf([(f,v+[100]) for f,v in sc])}
    return layer(f"letter-{name}",shapes,ip=frames[0],op=NF,ks=ks,effects=[blur_effect(compact(bl))])

def n_reveal_layer(name, frames_t, pos_keys, reverse, s=TEXT_S):
    """stroke centerline with trim; pos_keys: {f:(tx,ty)} anchor position (glyph center)."""
    g=glyphs[name]; a=np.array(g.anchor); cl=CL[name]
    P=np.array(cl["pts"]); w=cl["width"]*s
    sh=catmull(P)
    frames=sorted(frames_t)
    tkeys=[(f,frames_t[f]*100) for f in frames]
    trim={"ty":"tm","s":static(100-0) if False else (kf_scalar([(f,100-frames_t[f]*100) for f in frames]) if reverse else static(0)),
          "e":static(100) if reverse else kf_scalar(tkeys),"o":static(0),"m":1,"nm":"trim"}
    pos=[(f,[pos_keys[f][0],pos_keys[f][1],0]) for f in frames]
    gs=[];ge=[]
    for f in frames:
        tx,ty=pos_keys[f]; ls,le=local_grad(tx,ty,0,s,s,a,grad[f][0],grad[f][1]); gs.append((f,ls)); ge.append((f,le))
    shapes=[{"ty":"gr","nm":name+"-stroke","it":[{"ty":"sh","ks":static(sh),"nm":"c"},trim,gradient("gs",gs,ge,static(round(cl["width"],2))),{"ty":"tr",**transform()}]}]
    ks={"o":static(100),"r":static(0),"p":kf(pos),"a":static(a.tolist()+[0]),"s":static([s*100,s*100,100])}
    return layer(f"letter-{name}-reveal",shapes,ip=frames[0],op=frames[-1]+1,ks=ks)

# n reveal timeline (t per frame) & positions
n_t={57:0.07,58:0.10,59:0.18,60:0.28,61:0.43}
for f,wl in ((62,74),(63,94),(64,109),(65,117)): n_t[f]=min(0.97,ninvert("n",False,wl,120))
n_t.update({64:0.62,65:0.78,66:0.93})
n_pos={57:(1157,547.5),58:(1157,547.5),59:(1143,547.5),60:(1102,546),61:(938,546),62:(887,547),63:(873,547.5),64:(869,547.5),65:(867,548),66:(866,548)}
n2_t={65:0.09,66:0.21,67:0.33,68:0.41,69:0.49,70:0.57,71:0.64,72:0.72,73:0.90,74:1.0}
n2_final=F("n2",95); n2_pos={f:(n2_final[0],n2_final[1]) for f in n2_t}

# ---------------------------------------------------------------- tag
def tag_layers():
    fn=lambda p:p*TEXT_S+TEXT_OFF
    tag_shapes=[{"ty":"sh","ks":static(xform_shape(sh,fn)),"nm":"t"} for sh in G["tag"]]
    fill={"ty":"fl","c":static(PURPLE+[1]),"o":static(100),"r":1,"nm":"fill"}
    tag=layer("tag",[{"ty":"gr","nm":"tag","it":tag_shapes+[fill,{"ty":"tr",**transform()}]}],ip=70,op=NF,extra={"tt":1})
    pt=CL["pathtag"]; s2=pt["s"]; off2=np.array([pt["ox"],pt["oy"]])
    fn2=lambda p:(p*s2+off2)*TEXT_S+TEXT_OFF
    items=[]
    for it in G["pathtag"]:
        if it["type"]=="path":
            for sh in it["shapes"]: items.append({"ty":"sh","ks":static(xform_shape(sh,fn2)),"nm":"p"})
        else:
            c=fn2(np.array([it["c"]]))[0]; d=2*it["r"]*s2*TEXT_S
            items.append({"ty":"el","d":1,"s":static([d,d]),"p":static([round(float(c[0]),2),round(float(c[1]),2)]),"nm":"dot"})
    # trim timing from revealed area
    wpx=11*TEXT_S
    glyph=Image.new("L",(W,H),0); dg=ImageDraw.Draw(glyph)
    for sh in G["tag"]:
        p=fn(shape_polygon(sh)); dg.polygon([tuple(x) for x in p],fill=255)
    gm=np.array(glyph)>0
    # polylines in screen space in order
    polys=[]
    for it in G["pathtag"]:
        if it["type"]=="path":
            for sh in it["shapes"]: polys.append(("l",fn2(shape_polygon(sh,n=10))))
        else: polys.append(("c",fn2(np.array([it["c"]]))[0],it["r"]*s2*TEXT_S))
    lens=[]
    for p in polys:
        lens.append(float(np.sum(np.linalg.norm(np.diff(p[1],axis=0),axis=1))) if p[0]=="l" else 2*math.pi*p[2])
    total=sum(lens)
    def band(t):
        im=Image.new("L",(W,H),0); d=ImageDraw.Draw(im); budget=t*total
        for p,L in zip(polys,lens):
            if budget<=0: break
            if p[0]=="l":
                Q=p[1]; dd=np.r_[0,np.cumsum(np.linalg.norm(np.diff(Q,axis=0),axis=1))]
                if budget>=L: seg=Q
                else:
                    xs=np.interp(budget,dd,Q[:,0]); ys=np.interp(budget,dd,Q[:,1]); seg=np.vstack([Q[dd<budget],[xs,ys]])
                if len(seg)>1: d.line([tuple(x) for x in seg],fill=255,width=int(round(wpx)),joint="curve")
                for e in (seg[0],seg[-1]): d.ellipse([e[0]-wpx/2,e[1]-wpx/2,e[0]+wpx/2,e[1]+wpx/2],fill=255)
            else:
                c=p[1]; r=p[2]+wpx/2; d.ellipse([c[0]-r,c[1]-r,c[0]+r,c[1]+r],fill=255)
            budget-=L
        return np.array(im)>0
    ts=np.linspace(0,1,201); areas=[int((band(t)&gm).sum()) for t in ts]
    full=areas[-1]
    meas={}
    for f in range(70,96):
        m=misc["tag"][str(f)]; a=(m[2]-100) if m else 0
        meas[f]=max(0,a)
    vid_full=max(meas.values())
    tkeys=[]
    for f in range(70,96):
        target=meas[f]*full/vid_full
        t=float(ts[int(np.searchsorted(areas,target))]) if target<full else 1.0
        tkeys.append((f,round(t*100,2)))
    tkeys=[(f,min(100,t)) for f,t in tkeys]
    print("tag trim keys",tkeys[:6],'...')
    print('n_t',n_t)
    trim={"ty":"tm","s":static(0),"e":kf_scalar(tkeys),"o":static(0),"m":2,"nm":"trim"}
    stroke={"ty":"st","c":static([1,1,1,1]),"o":static(100),"w":static(round(wpx,2)),"lc":2,"lj":2,"ml":4,"nm":"pen"}
    matte=layer("tag-matte",[{"ty":"gr","nm":"pen","it":items+[trim,stroke,{"ty":"tr",**transform()}]}],ip=70,op=NF,extra={"td":1})
    return matte,tag

# ---------------------------------------------------------------- assemble
scene=[]
matte,tag=tag_layers(); scene+= [matte,tag]
for nm in ["i","k","y","i2","n","n2","a"]:   # 'a' below 'k'
    scene.append(letter_layer(nm))
scene.append(n_reveal_layer("n",n_t,n_pos,False))
scene.append(n_reveal_layer("n2",n2_t,n2_pos,True))
scene.append(iso_layer([119]))
scene.append(m_layers())
zoom_blur=[(f,soft_to_blur(fig[f]["P"]["soft"]) if fig[f].get("P") else 0) for f in range(51,54)]
scene.append(head_layer("head-L",HEAD_P,HEAD_D_P,list(range(0,85)),extra_blur=[(f,0) for f in (0,)]+[(f,(0 if f in PAN_FRAMES else soft_to_blur(fig[f]["P"]["soft"] if f<54 and fig[f].get("P") else misc["iso"][str(f)]["soft"] if f>=54 else 0))) for f in range(1,85)]))
scene.append(head_layer("head-R",HEAD_B,HEAD_D_B,list(range(26,85)),extra_blur=[(f,(0 if f in PAN_FRAMES else soft_to_blur(fig[f]["B"]["soft"] if f<54 and fig[f].get("B") else misc["iso"][str(f)]["soft"] if f>=54 else 0))) for f in range(26,85)]))
scene.append(figure_layers("P",list(range(0,56)),"purple"))
scene.append(figure_layers("B",list(range(26,56)),"blue"))
for i,L in enumerate(scene): L["ind"]=i+1
root_layer={"ddd":0,"ind":1,"ty":0,"nm":"scene","refId":"scene","sr":1,"ks":{"o":static(100),"r":static(0),"p":static([W/2,H/2,0]),"a":static([W/2,H/2,0]),"s":static([100,100,100])},"ao":0,"w":W,"h":H,"ip":0,"op":NF,"st":0,"bm":0,
            "ef":[blur_effect(compact(scene_blur),dims=2,name="Pan blur")]}
anim={"v":"5.12.2","fr":FPS,"ip":0,"op":NF,"w":W,"h":H,"nm":"Minkayni logo intro","ddd":0,"assets":[{"id":"scene","nm":"scene","fr":FPS,"layers":scene}],"layers":[root_layer],"markers":[]}
def shrink(o):
    """round floats, collapse constant keyframe tracks."""
    if isinstance(o,float): return round(o,2)
    if isinstance(o,list): return [shrink(x) for x in o]
    if isinstance(o,dict):
        if o.get("a")==1 and isinstance(o.get("k"),list) and len(o["k"])>1:
            vals=[json.dumps(shrink(k["s"])) for k in o["k"]]
            if all(v==vals[0] for v in vals):
                v=shrink(o["k"][0]["s"]); return {"a":0,"k":v[0] if len(v)==1 else v}
            # drop interior keys identical to both neighbours
            ks=o["k"]; keep=[]
            for i,k in enumerate(ks):
                if i==0 or i==len(ks)-1 or vals[i]!=vals[i-1] or vals[i]!=vals[i+1]: keep.append(k)
            return {"a":1,"k":[shrink(k) for k in keep]}
        return {k:shrink(v) for k,v in o.items()}
    return o
anim=shrink(anim)
out=os.path.join(W,"logo_intro.json")
json.dump(anim,open(out,"w"),separators=(",",":"))
import os; print("written",out,os.path.getsize(out)//1024,"KB; layers",len(scene))

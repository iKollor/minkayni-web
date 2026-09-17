import os
from PIL import Image
import numpy as np, glob, json
from scipy import ndimage
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
files=sorted(glob.glob(W+"/frames/f*.png"))
out=[]
for i,f in enumerate(files):
    a=np.array(Image.open(f)).astype(int)
    al=a[:,:,3]
    r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    vis=al>128
    purple=vis&(g<70)&(r>70)
    blue=vis&(g>110)
    grad=vis&~purple&~blue
    rec={"f":i,"soft":int(((al>8)&(al<200)).sum()),"hard":int((al>=200).sum())}
    for name,m in (("P",purple),("B",blue),("G",grad)):
        lab,n=ndimage.label(m)
        comps=[]
        for k in range(1,n+1):
            ys,xs=np.where(lab==k)
            if len(xs)<150: continue
            comps.append({"area":int(len(xs)),"cx":round(float(xs.mean()),1),"cy":round(float(ys.mean()),1),"bb":[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())]})
        comps.sort(key=lambda c:c["cx"])
        rec[name]=comps
    out.append(rec)
json.dump(out,open(W+"/comps.json","w"))
for rec in out:
    print(rec["f"],"soft",rec["soft"],"hard",rec["hard"])
    for name in "PBG":
        for c in rec[name]:
            print("   ",name,c["area"],c["cx"],c["cy"],c["bb"])

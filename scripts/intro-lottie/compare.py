import os
"""Compare rendered lottie frames with the video frames: IoU of alpha masks + side-by-side sheets."""
import sys, glob, numpy as np
from PIL import Image
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
rdir=sys.argv[1]; scale=float(sys.argv[2]) if len(sys.argv)>2 else 0.5
files=sorted(glob.glob(rdir+"/f*.png"))
rows=[]; ious=[]
for fp in files:
    f=int(fp[-7:-4])
    r=np.array(Image.open(fp).convert("RGBA"))
    v=Image.open(f"{W}/frames/f{f+1:03d}.png").convert("RGBA").resize((r.shape[1],r.shape[0]),Image.LANCZOS)
    v=np.array(v)
    ra=r[:,:,3]>128; va=v[:,:,3]>128
    inter=(ra&va).sum(); uni=(ra|va).sum()
    iou=inter/uni if uni else 1.0
    # color diff on the intersection
    cd=np.abs(r[:,:,:3].astype(int)-v[:,:,:3].astype(int))[ra&va].mean() if inter else 0
    ious.append((f,iou,cd,int(ra.sum()),int(va.sum())))
    if "--sheet" in sys.argv:
        bg=Image.new("RGBA",(r.shape[1],r.shape[0]),(245,240,230,255))
        a=bg.copy(); a.alpha_composite(Image.fromarray(v)); b=bg.copy(); b.alpha_composite(Image.fromarray(r))
        pair=Image.new("RGB",(r.shape[1]*2+4,r.shape[0]),(200,0,0)); pair.paste(a.convert("RGB"),(0,0)); pair.paste(b.convert("RGB"),(r.shape[1]+4,0))
        rows.append((f,pair))
for f,iou,cd,ra,va in ious: print(f"{f:3d} iou={iou:.3f} colordiff={cd:5.1f} area_render={ra} area_video={va}")
print("mean iou",np.mean([x[1] for x in ious]))
if rows:
    per=8; 
    for k in range(0,len(rows),per):
        chunk=rows[k:k+per]; w,h=chunk[0][1].size
        sh=Image.new("RGB",(w,h*len(chunk)))
        for j,(f,im) in enumerate(chunk): sh.paste(im,(0,j*h))
        sh.save(f"{W}/cmp_{chunk[0][0]:03d}.png")

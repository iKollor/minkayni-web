import os
import numpy as np
from PIL import Image
W=os.environ.get("INTRO_WORK",os.path.join(os.path.dirname(os.path.abspath(__file__)),"work"))
W,H=1920,1080
_cache={}
def frame(i):
    if i not in _cache:
        _cache[i]=np.array(Image.open(f"{W}/frames/f{i+1:03d}.png")).astype(np.int16)
    return _cache[i]
def masks(i):
    a=frame(i); al=a[:,:,3]; r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    opaque=al>128
    purple=opaque&(g<70)&(r>70)
    blue=opaque&(g>110)
    return {"alpha":al,"opaque":opaque,"purple":purple,"blue":blue,"nonpurple":opaque&~purple}
def edge_softness(al, region=None):
    """mean width of the soft alpha band around hard pixels (1 ~ plain antialiasing)."""
    from scipy import ndimage
    hard=al>=200; soft=(al>8)&(al<200)
    if region is not None: hard=hard&region; soft=soft&region
    per=hard&~ndimage.binary_erosion(hard)
    p=per.sum()
    if p==0: return None
    return float(soft.sum()/p)

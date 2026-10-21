"""Bake 42 closed plates from the owner's pose-aligned, multi-view landmarks.
Offline dependencies: numpy and scipy. No photograph is mapped onto the surface.
"""
from pathlib import Path
import json
import numpy as np
from scipy.interpolate import RBFInterpolator, PchipInterpolator
from scipy.ndimage import gaussian_filter1d

ROOT=Path(__file__).resolve().parents[1]
face=np.array(json.loads((ROOT/'scripts/face-landmarks.json').read_text(encoding='utf-8')))
assert face.shape==(468,3) and np.isfinite(face).all()
oval=face[[10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]]
top=1.25
bottom=-2.05
chin=face[152,1]
forehead=face[10,1]
# The unseen crown/back/neck remain sculpted approximations, outside the fitted face.
profile_y=np.linspace(chin,forehead,100)
profile_x=[]
for y in profile_y:
    hits=[]
    for a,b in zip(oval,np.roll(oval,-1,axis=0)):
        if min(a[1],b[1])<=y<max(a[1],b[1]):
            hits.append(a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]))
    profile_x.append(max([abs(v) for v in hits],default=.015))
# Use measured jaw and temples; extend the upper forehead into a rounded scalp.
knots=[bottom,chin-.12,chin,chin+.16,chin+.34]
widths=[.51,.51,.53,float(np.interp(chin+.16,profile_y,profile_x)),float(np.interp(chin+.34,profile_y,profile_x))]
for y in np.linspace(chin+.5,.24,18):
    knots.append(y);widths.append(float(np.interp(y,profile_y,profile_x)))
knots.extend([.45,.68,.90,1.08,1.20,top]);widths.extend([.96,.91,.78,.57,.30,.015])
width_at=PchipInterpolator(knots,widths)
front_depth=PchipInterpolator([bottom,chin,-.9,-.3,.3,.72,1.05,top],[.38,.50,.55,.58,.62,.60,.39,.01])
back_depth=PchipInterpolator([bottom,chin,-.9,-.3,.3,.72,1.05,top],[.46,.62,.85,1.03,1.05,.91,.59,.01])
def base(x,y):
    radius=np.maximum(width_at(y),.015)
    return -.30+front_depth(y)*np.sqrt(np.maximum(0,1-(x/radius)**2))
points=list(face[:,:2]);values=list(face[:,2])
for y in np.linspace(bottom,top,90):
    w=float(width_at(y))
    for x in [-w,w]: points.append([x,y]);values.append(-.30)
for y in np.linspace(.78,top,10):
    w=float(width_at(y))
    for x in np.linspace(-w,w,13)[1:-1]:points.append([x,y]);values.append(float(base(x,y)))
for y in [bottom,chin-.15]:
    w=float(width_at(y))
    for x in np.linspace(-w,w,13)[1:-1]:points.append([x,y]);values.append(float(base(x,y)))
fit=RBFInterpolator(np.array(points),np.array(values),kernel='thin_plate_spline',smoothing=.00015)
count,segments,rows=42,192,5
ys=np.linspace(top,bottom,count*rows+1)
data=[]
for y in ys:
    angle=np.linspace(0,2*np.pi,segments+1)
    x=width_at(y)*np.cos(angle)
    front=np.sin(angle)>=-1e-6
    z=-.30-back_depth(y)*np.abs(np.sin(angle))
    z[front]=fit(np.column_stack([x[front],np.full(front.sum(),y)]))
    crown_blend=np.clip((y-.28)/.36,0,1)
    neck_blend=np.clip((chin-y)/.16,0,1)
    blend=max(crown_blend,neck_blend)
    z[front]=z[front]*(1-blend)+base(x[front],y)*blend
    # A narrow opening between the closed lips gives the mouth an actual crease.
    mouth_y=(face[13,1]+face[14,1])/2
    z[front]-=.025*np.exp(-(x[front]/.31)**6-((y-mouth_y)/.018)**2)
    # Small ears belong to the same rotating contours, not loose attached objects.
    ear=.16*np.exp(-((y+.18)/.34)**4)*np.exp(-((np.abs(np.cos(angle))-.995)/.035)**2)
    x+=np.sign(x)*ear
    data.extend(np.column_stack([x,np.full(len(x),y+.35),z,.5+x/4,np.full(len(x),.5+y/4)]).ravel())
array=np.array(data,dtype='<f4').reshape(len(ys),segments+1,5)
array[:,:,2]=gaussian_filter1d(array[:,:,2],.4,axis=0)
array[:,-1,:3]=array[:,0,:3]
array.ravel().tofile(ROOT/'public/head-contours.bin')
eyes=[]
for a,b in [(33,133),(362,263)]:
    c=(face[a]+face[b])/2
    eyes.append({'center':[float(.5+c[0]/4),float(.5+c[1]/4)],'radius':[float(np.linalg.norm(face[a,:2]-face[b,:2])/8),.012]})
metadata={'slices':count,'segments':segments,'rows':rows,'eyes':eyes,'eyeAngle':0,'landmarks':468,'sourceViews':3,'stride':5}
(ROOT/'src/head-data.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8',newline='\n')
print(f'Baked {array.size//5:,} vertices, {array.nbytes:,} bytes from three aligned views')

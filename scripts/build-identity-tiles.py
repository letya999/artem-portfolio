"""Build closed metal tiles directly over the measured face, without voxel snapping."""
import json,math
from pathlib import Path
import numpy as np
from scipy.interpolate import RBFInterpolator,PchipInterpolator
ROOT=Path(__file__).resolve().parents[1]
identity=json.loads((ROOT/'scripts/identity-surface.json').read_text())
p=np.array(identity['points'])
chin=float(p[152,1]);forehead=float(p[10,1]);crown=forehead+.55
# The facial oval ends at the center of the forehead, not at the skull silhouette.
width=PchipInterpolator([0,.12,chin,chin+.15,1.10,1.40,1.75,2.05,forehead,forehead+.22,forehead+.40,crown],
 [.66,.66,.47,.54,.68,.76,.79,.79,.75,.63,.41,.025])
points=p[:468,:2].tolist();values=p[:468,2].tolist()
for h in np.linspace(.01,crown,80):
 ww=float(width(h))
 for x in [-ww,ww]:points.append([x,h]);values.append(-.10)
 if h>forehead+.04 or h<chin-.02:
  for t in np.linspace(-1,1,17)[1:-1]:
   x=ww*t
   depth=.68 if h>forehead else .53
   if h>forehead:depth*=np.sqrt(max(.001,1-((h-forehead)/(crown-forehead))**2))
   points.append([x,h]);values.append(-.1+depth*np.sqrt(max(0,1-t*t)))
face=RBFInterpolator(np.array(points),np.array(values),smoothing=.0003,kernel='thin_plate_spline')

def surface(theta,height):
 ww=float(width(height));xx=ww*np.sin(theta);front=np.cos(theta)>=0
 if front:
  zz=float(face([[xx,height]])[0])
  # The side join is anatomical completion beyond the face detector's reliable region.
  edge=np.clip((abs(xx)/ww-.88)/.12,0,1);edge=edge*edge*(3-2*edge)
  zz=zz*(1-edge)-.10*edge
  zz=np.clip(zz,-.50,1.18)
 else:
  depth=float(np.interp(height,[0,chin,chin+.45,forehead,crown],[.53,.58,.88,.88,.015]))
  if height>forehead:depth=.88*np.sqrt(max(.001,1-((height-forehead)/(crown-forehead))**2))
  zz=-.10+depth*np.cos(theta)
 return np.array([xx,height,zz])

bands=[];tile_count=0
# Height spacing retains mouth and eyelid geometry; arc spacing keeps faces close to square.
heights=np.linspace(.015,crown-.012,57)
clay_positions=[]
for lo,hi in zip(heights[:-1],heights[1:]):
 yy=(lo+hi)/2;quads=[]
 def tile(q,seed):
  global tile_count
  center=q.mean(0);n=np.cross(q[1]-q[0],q[3]-q[0]);n/=max(np.linalg.norm(n),1e-9)
  outward=np.array([center[0],0,center[2]+.12])
  if np.dot(n,outward)<0:q=q[::-1];n=-n
  # A planar face with a narrow chamfer and closed back, rather than intersecting boxes.
  q=q-center; q-=np.outer(q@n,n);q=q*.97+center
  quads.append(np.round(q,6).ravel().tolist())
  tile_count+=1
 theta=np.linspace(-math.pi,math.pi,321)
 curve=np.array([surface(t,yy) for t in theta]);arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(curve,axis=0),axis=1))]
 count=max(12,round(arc[-1]/.068));edges=np.interp(np.linspace(0,arc[-1],count+1),arc,theta)
 for a,b in zip(edges[:-1],edges[1:]):
  q=np.array([surface(a,lo),surface(b,lo),surface(b,hi),surface(a,hi)])
  clay_positions.extend(q[[0,1,2,0,2,3]].tolist())
  tile(q,tile_count)
 # Ear shells are sculpted completions, separate from the measured face surface.
 if 1.34<yy<1.96:
  for side in [-1,1]:
   for j in range(12):
    def ear(t,h):
     v=(h-1.65)/.34;r=np.sqrt(max(.001,1-v*v))
     z=-.16+.22*r*np.sin(t)
     cavity=.115*np.exp(-((h-1.65)/.16)**2-((z+.13)/.12)**2)*max(0,np.cos(t))
     return np.array([side*(.79+.16*r*np.cos(t)-cavity),h,z])
    a=j*math.tau/12;b=(j+1)*math.tau/12
    tile(np.array([ear(a,lo),ear(b,lo),ear(b,hi),ear(a,hi)]),tile_count)
 bands.append({'y':round(yy,6),'quads':quads})
assert all(np.isfinite(b['quads']).all() for b in bands)
fit=face(p[:468,:2]);error=float(np.sqrt(np.nanmean((fit-p[:468,2])**2)))
assert error<.025
result={'format':'portrait-tiles/1','tileCount':tile_count,'height':float(crown),'sourceViews':identity['sourceViews'],'landmarks':468,'landmarkDepthRMSE':error,'bands':bands}
(ROOT/'public/portrait-tiles.json').write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')
(ROOT/'qa/clay-face.json').write_text(json.dumps({'positions':np.round(clay_positions,6).ravel().tolist(),'height':float(crown)}),encoding='utf-8')
print('Tiles:',tile_count,'landmark interpolation RMS:',error,'height:',crown)

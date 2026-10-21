"""Tile the actual fitted research bust using horizontal mesh intersections."""
import argparse,json
from pathlib import Path
import numpy as np
from scipy.ndimage import gaussian_filter1d
from scipy.interpolate import PchipInterpolator
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
d=json.loads(a.source.read_text());v=np.asarray(d['vertices']).reshape(-1,3);f=np.asarray(d['indices']).reshape(-1,3)
assert np.isfinite(v).all() and f.min()>=0 and f.max()<len(v)
low=v[:,1].min();height=np.ptp(v[:,1]);scale=3/height;v[:,1]-=low;v*=scale;v[:,2]+=.45*scale
tri=v[f];ymin=tri[:,:,1].min(1);ymax=tri[:,:,1].max(1)
angles=np.linspace(-np.pi,np.pi,1025)
def section(y):
 t=tri[(ymin<=y)&(ymax>=y)];first=np.full((len(t),2),np.nan);second=first.copy()
 for i,j in [(0,1),(1,2),(2,0)]:
  aa=t[:,i];bb=t[:,j];dy=bb[:,1]-aa[:,1];mask=(abs(dy)>1e-10)&((aa[:,1]-y)*(bb[:,1]-y)<=0)
  indices=np.flatnonzero(mask);ratio=(y-aa[mask,1])/dy[mask];points=(aa[mask]+(bb[mask]-aa[mask])*ratio[:,None])[:,[0,2]]
  empty=np.isnan(first[indices,0]);first[indices[empty]]=points[empty];second[indices[~empty]]=points[~empty]
 valid=np.isfinite(first).all(1)&np.isfinite(second).all(1);first=first[valid];second=second[valid]
 origin=(np.minimum(first.min(0),second.min(0))+np.maximum(first.max(0),second.max(0)))/2
 aa=first-origin;delta=second-first;direction=np.c_[np.sin(angles),np.cos(angles)]
 denominator=direction[:,0,None]*delta[None,:,1]-direction[:,1,None]*delta[None,:,0]
 with np.errstate(divide='ignore',invalid='ignore'):
  distance=(aa[:,0]*delta[:,1]-aa[:,1]*delta[:,0])[None,:]/denominator
  along=(aa[None,:,0]*direction[:,1,None]-aa[None,:,1]*direction[:,0,None])/denominator
 valid=(abs(denominator)>1e-10)&(distance>=0)&(along>=-1e-6)&(along<=1+1e-6)
 radius=np.max(np.where(valid,distance,0),axis=1)
 assert np.count_nonzero(radius)>len(radius)*.25, f'Insufficient contour at height {y}'
 if np.count_nonzero(radius)<len(radius):
  good=radius>0;radius=np.interp(angles,angles[good],radius[good],period=2*np.pi)
 radius=gaussian_filter1d(radius,1.0,mode="wrap")
 if 1.65<y<2.35:
  ear=np.clip((abs(np.sin(angles))-.80)/.18,0,1)
  radius=radius*(1-ear)+gaussian_filter1d(radius,5,mode="wrap")*ear
 return radius,origin
heights=np.linspace(.003,2.997,61);slices=[section(y) for y in heights];sections=[s[0] for s in slices];origins=[s[1] for s in slices];bands=[];count=0
knots=[0,.3,.6,.9,1.2,1.8,2.4,2.7,3]
back_width=PchipInterpolator(knots,[1.30,1.0,.65,.55,.78,.90,.80,.60,.015])
back_depth=PchipInterpolator(knots,[.62,.60,.55,.60,.80,.90,.80,.60,.015])
for i,(lo,hi) in enumerate(zip(heights[:-1],heights[1:])):
 r=(sections[i]+sections[i+1])/2;curve=np.c_[r*np.sin(angles),r*np.cos(angles)];arc=np.r_[0,np.cumsum(np.linalg.norm(np.diff(curve,axis=0),axis=1))]
 n=max(12,round(arc[-1]/.058));edges=np.interp(np.linspace(0,arc[-1],n+1),arc,angles);quads=[]
 def point(theta,level,y):
  r=np.interp(theta,angles,sections[level]);measured=np.array([origins[level][0]+r*np.sin(theta),y,origins[level][1]+r*np.cos(theta)])
  # The scan has no measured back. Use a rounded occiput instead of its ragged open rim.
  knots=[0,.3,.6,.9,1.2,1.8,2.4,2.7,3]
  width=float(back_width(y))
  depth=float(back_depth(y))
  completed=np.array([width*np.sin(theta),y,.10+depth*np.cos(theta)])
  blend=np.clip((.10-np.cos(theta))/.45,0,1);blend=blend*blend*(3-2*blend)
  blend=max(blend,np.clip((y-2.87)/.12,0,1))
  return measured*(1-blend)+completed*blend
 for aa,bb in zip(edges[:-1],edges[1:]):
  q=np.array([point(aa,i,lo),point(bb,i,lo),point(bb,i+1,hi),point(aa,i+1,hi)])
  center=q.mean(0);normal=np.cross(q[1]-q[0],q[3]-q[0]);norm=np.linalg.norm(normal)
  if norm<1e-9:continue
  normal/=norm
  if np.dot(normal,[center[0],0,center[2]])<0:q=q[::-1];normal=-normal
  q-=np.outer((q-center)@normal,normal);q=center+(q-center)*.985
  quads.append(q.round(6).ravel().tolist());count+=1
 bands.append({'y':float((lo+hi)/2),'quads':quads})
assert 0<count<=12000 and all(np.isfinite(b['quads']).all() for b in bands)
a.output.write_text(json.dumps({'format':'portrait-tiles/1','tileCount':count,'height':3,'bands':bands,'source':'Mesh-derived radial sections; source provenance documented separately'},separators=(',',':')))
print(count,'tiles',len(bands),'layers')

import importlib.util,json,pickle
from pathlib import Path
import cv2,numpy as np,torch
import argparse
p=argparse.ArgumentParser(description='Local 3DDFA face reconstruction and multi-view landmark fit for evaluation.')
p.add_argument('--model-root',type=Path,required=True);p.add_argument('--manifest',type=Path,required=True);p.add_argument('--output',type=Path,required=True)
a=p.parse_args();root=a.model_root;out=a.output;out.mkdir(parents=True,exist_ok=True)
class ArraysOnly(pickle.Unpickler):
 def find_class(self,module,name):
  if module in ('numpy','numpy.core.multiarray','numpy._core.multiarray') and name in ('ndarray','dtype','_reconstruct','scalar'):
   return super().find_class(module,name)
  raise pickle.UnpicklingError((module,name))
def read(path):
 with open(path,'rb') as f:return ArraysOnly(f).load()
spec=importlib.util.spec_from_file_location('mobile',root/'models/mobilenet_v1.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
model=mod.mobilenet(num_classes=62,widen_factor=1.)
checkpoint=torch.load(root/'weights/mb1_120x120.pth',map_location='cpu',weights_only=True)
state={k.removeprefix('module.').replace('fc_param.','fc.'):v for k,v in checkpoint['state_dict'].items() if 'fc_lm.' not in k}
model.load_state_dict(state);model.eval()
bfm=read(root/'configs/bfm_noneck_v3.pkl');stats=read(root/'configs/param_mean_std_62d_120x120.pkl');tri=read(root/'configs/tri.pkl').T.astype(int)
print('BFM',[(k,np.shape(v)) for k,v in bfm.items()]);print('tri',tri.shape,tri.min(),tri.max())
def infer(image,roi):
 sx,sy,ex,ey=map(lambda v:int(round(v)),roi);h,w=image.shape[:2]
 canvas=np.zeros((ey-sy,ex-sx,3),np.uint8)
 ax,ay,bx,by=max(0,sx),max(0,sy),min(w,ex),min(h,ey)
 canvas[ay-sy:by-sy,ax-sx:bx-sx]=image[ay:by,ax:bx]
 crop=cv2.resize(canvas,(120,120)).astype(np.float32)
 tensor=torch.from_numpy(crop.transpose(2,0,1).copy())[None]
 with torch.inference_mode():raw=model((tensor-127.5)/128).numpy().flatten()
 return raw*stats['std']+stats['mean']
def mesh(param,expression=True):
 shape=bfm['u']+bfm['w_shp'][:,:40]@param[12:52,None]
 if expression:shape=shape+bfm['w_exp'][:,:10]@param[52:62,None]
 return shape.reshape(3,-1,order='F').T
params=[]
for row in json.loads(a.manifest.read_text()):
 image=cv2.imdecode(np.fromfile(row['path'],np.uint8),cv2.IMREAD_COLOR)
 l,t,r,b=row['bbox'];size0=(r-l+b-t)/2;cx=(l+r)/2;cy=(t+b)/2+size0*.14;size=int(size0*1.58)
 roi=[cx-size/2,cy-size/2,cx+size/2,cy+size/2]
 param=infer(image,roi)
 # A second pass uses the regressed landmarks, as in the upstream demo.
 for iteration in range(1):
  v=mesh(param);posed=v@param[:12].reshape(3,4)[:,:3].T+param[:12].reshape(3,4)[:,3]
  kp=np.asarray(bfm['keypoints']).reshape(-1);ids=np.unique(kp//3)
  points=posed[ids,:2].copy();points[:,0]=(points[:,0]-1)*(roi[2]-roi[0])/120+roi[0];points[:,1]=(120-points[:,1])*(roi[3]-roi[1])/120+roi[1]
  low=points.min(0);high=points.max(0);center=(low+high)/2;radius=max(high-low)/2;side=2*radius*np.sqrt(2)
  roi=[center[0]-side/2,center[1]-side/2,center[0]+side/2,center[1]+side/2];param=infer(image,roi)
 params.append((row['name'],param));np.save(out/(row['name']+'-parameters.npy'),param)
for name,param in params:
 v=mesh(param,False);v-=v.mean(0);v*=2.5/np.ptp(v[:,1]);assert np.isfinite(v).all() and tri.max()<len(v)
 (out/(name+'.obj')).write_text('\n'.join(['v %.7f %.7f %.7f'%tuple(p) for p in v]+['f %d %d %d'%tuple(f+1) for f in tri]),encoding='utf-8')
 (out/(name+'.json')).write_text(json.dumps(dict(vertices=v.round(6).ravel().tolist(),indices=tri.ravel().tolist()),separators=(',',':')),encoding='utf-8')
 print(name,len(v),'vertices',len(tri),'triangles')


from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation
mapping=[234,93,132,58,172,136,150,149,152,378,379,365,397,288,361,323,454,70,63,105,66,107,336,296,334,293,300,168,6,197,4,98,97,2,326,327,33,160,158,133,153,144,362,385,387,263,373,380,61,40,37,0,267,270,291,321,314,17,84,91,78,81,13,311,308,402,14,178]
ids=np.asarray(bfm['keypoints']).reshape(-1,3)[:,0]//3
mean=bfm['u'].reshape(-1,3)/100000
basis=(bfm['w_shp'][:,:40]*stats['std'][12:52]).reshape(-1,3,40)/100000
expr=(bfm['w_exp'][:,:10]*stats['std'][52:62]).reshape(-1,3,10)/100000
rows=[r for r in json.loads(a.manifest.read_text()) if r['name'] in ('smile','outdoor','glasses','occluded')]
assert len(rows)==4, 'Manifest requires smile, outdoor, glasses and occluded views'
targets=[];initial=[]
shared=np.mean([np.load(out/(r['name']+'-parameters.npy'))[12:52]/stats['std'][12:52] for r in rows if r['name'] in ('smile','outdoor')],0)
for row in rows:
 points=np.asarray(row['points'],dtype=float);assert points.shape==(478,2) and np.isfinite(points).all()
 pts=points[mapping].copy();pts[:,1]*=-1;pts-=pts.mean(0);pts/=row['bbox'][3]-row['bbox'][1];targets.append(pts)
 param=np.load(out/(row['name']+'-parameters.npy'));pose=param[:12].reshape(3,4)[:,:3];u,s,vh=np.linalg.svd(pose);rot=u@vh
 rv=Rotation.from_matrix(rot).as_rotvec();e=param[52:62]/stats['std'][52:62]
 shape=mean[ids]+basis[ids]@shared+expr[ids]@e;proj=shape@rot.T;scale=np.ptp(pts[:,1])/np.ptp(proj[:,1]);offset=pts.mean(0)-scale*proj[:,:2].mean(0)
 initial.extend([*rv,np.log(scale),*offset,*e])
weights=np.ones((68,1));weights[:17]=.45;weights[17:27]=.7
view_weights=[]
for row in rows:
 w=weights.copy()
 if row['name']=='glasses':w[17:31]=0;w[36:48]=0
 if row['name']=='occluded':
  w[:]=0;w[9:17]=.30;w[22:27]=.45;w[42:48]=.65
 view_weights.append(w)
assert all(np.count_nonzero(w)>10 for w in view_weights)
x0=np.r_[shared,initial]
def project(x,k):
 p=x[40+k*16:56+k*16];face=mean[ids]+basis[ids]@x[:40]+expr[ids]@p[6:];return np.exp(p[3])*(face@Rotation.from_rotvec(p[:3]).as_matrix().T)[:,:2]+p[4:6]
def residual(x):
 terms=[((project(x,k)-target)*view_weights[k]).ravel() for k,target in enumerate(targets)]
 terms.append(.012*(x[:40]-shared))
 for k in range(len(rows)):terms.append(.008*(x[46+k*16:56+k*16]-x0[46+k*16:56+k*16]))
 return np.concatenate(terms)
start=np.mean([np.average(np.linalg.norm(project(x0,k)-t,axis=1),weights=view_weights[k].ravel()) for k,t in enumerate(targets)])
fit=least_squares(residual,x0,max_nfev=160,loss='soft_l1',f_scale=.025,verbose=1)
x=fit.x;v=mean+basis@x[:40];v-=v.mean(0);v*=2.5/np.ptp(v[:,1]);assert np.isfinite(v).all()
(out/'fitted.obj').write_text('\n'.join(['v %.7f %.7f %.7f'%tuple(p) for p in v]+['f %d %d %d'%tuple(f+1) for f in tri]),encoding='utf-8')
(out/'fitted.json').write_text(json.dumps(dict(vertices=v.round(6).ravel().tolist(),indices=tri.ravel().tolist()),separators=(',',':')),encoding='utf-8')
report={'views':[r['name'] for r in rows],'excluded':['glasses: eye/brow/upper-nose landmarks masked','occluded: only visible right contour, eyebrow and eye used'],'beforeMeanNormalizedLandmarkError':float(start),'afterMeanNormalizedLandmarkError':float(np.mean([np.average(np.linalg.norm(project(x,k)-t,axis=1),weights=view_weights[k].ravel()) for k,t in enumerate(targets)])),'warning':'Landmark fit is not a verified likeness or 3D scan; BFM assets restricted to research/evaluation.'}
(out/'fit-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(report)

# Keep the measured expression separate from the neutral identity surface.
v=mean+basis@x[:40]+expr@x[46:56]
v-=v.mean(0);v*=2.5/np.ptp(v[:,1])
(out/'fitted-smile.json').write_text(json.dumps(dict(vertices=v.round(6).ravel().tolist(),indices=tri.ravel().tolist()),separators=(',',':')),encoding='utf-8')
(out/'fitted-smile.obj').write_text('\n'.join(['v %.7f %.7f %.7f'%tuple(p) for p in v]+['f %d %d %d'%tuple(f+1) for f in tri]),encoding='utf-8')
assert report['afterMeanNormalizedLandmarkError'] < report['beforeMeanNormalizedLandmarkError']

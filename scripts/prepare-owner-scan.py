"""Extract the owner's scan, remove room fragments, preserve real face/ear geometry."""
import argparse,json,struct
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix
from scipy.ndimage import gaussian_filter1d
from scipy.sparse.csgraph import connected_components
p=argparse.ArgumentParser();p.add_argument('glb',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
b=a.glb.read_bytes();assert b[:4]==b'glTF';length=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+length]);start=28+length
assert len(d['meshes'])==1 and len(d['meshes'][0]['primitives'])==1
primitive=d['meshes'][0]['primitives'][0];assert primitive.get('mode',4)==4
assert all(not any(k in n for k in ('matrix','translation','rotation','scale')) for n in d['nodes'])
def read(i):
 ac=d['accessors'][i];view=d['bufferViews'][ac['bufferView']];assert 'sparse' not in ac and 'byteStride' not in view
 dtype={5126:'<f4',5125:'<u4',5123:'<u2'}[ac['componentType']];cols={'SCALAR':1,'VEC3':3}[ac['type']];offset=start+view.get('byteOffset',0)+ac.get('byteOffset',0)
 return np.frombuffer(b,dtype=dtype,count=ac['count']*cols,offset=offset).reshape(-1,cols).copy()
v=read(primitive['attributes']['POSITION']).astype(float);f=read(primitive['indices']).reshape(-1,3).astype(int)
assert np.isfinite(v).all() and f.min()>=0 and f.max()<len(v)
# Weld duplicate vertices at texture seams before finding connected components.
v,inverse=np.unique(v.round(6),axis=0,return_inverse=True);f=inverse[f]
width=np.interp(v[:,1],[.195,.23,.27,.34,.40,.445],[.055,.08,.105,.105,.10,.06])
mask=(v[:,1]>.195)&(v[:,1]<.445)&(abs(v[:,0])<width)&(v[:,2]>-.068)&~((v[:,1]<.24)&(v[:,2]<.005))
f=f[mask[f].all(1)];edges=np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]);graph=coo_matrix((np.ones(len(edges)),(edges[:,0],edges[:,1])),shape=(len(v),len(v))).tocsr();_,labels=connected_components(graph,directed=False);valid=np.unique(f);largest=np.bincount(labels[valid]).argmax();f=f[(labels[f]==largest).all(1)];ids=np.unique(f);lookup=np.zeros(len(v),int);lookup[ids]=np.arange(len(ids));v=v[ids];f=lookup[f]
# Two Taubin passes suppress scanner grain without broad remodelling of features.
e=np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]);e=np.r_[e,e[:,::-1]];adj=coo_matrix((np.ones(len(e)),(e[:,0],e[:,1])),shape=(len(v),len(v))).tocsr();degree=np.asarray(adj.sum(1)).ravel()
for _ in range(2):
 for factor in [.30,-.31]:v+=factor*((adj@v)/degree[:,None]-v)
# Keep measured scalp height; only close the open back of the scan.
v[:,0]-=(v[:,0].max()+v[:,0].min())/2;v[:,1]-=v[:,1].min();v*=2.35/np.ptp(v[:,1]);v[:,1]-=1.10;v[:,2]-=.10
out=a.output;out.mkdir(parents=True,exist_ok=True);(out/'scan-face.json').write_text(json.dumps({'vertices':v.round(6).ravel().tolist(),'indices':f.ravel().tolist()},separators=(',',':')))
# Boundary completion uses the actual scan rim, including its ears.
u,c=np.unique(np.sort(e,axis=1),axis=0,return_counts=True);edge=u[c==2];neighbors={}
for x,y in edge:neighbors.setdefault(int(x),[]).append(int(y));neighbors.setdefault(int(y),[]).append(int(x))
seen=set();loops=[]
for startid in neighbors:
 if startid in seen:continue
 loop=[];prev=-1;cur=startid
 while cur not in seen:
  seen.add(cur);loop.append(cur);opts=[i for i in neighbors[cur] if i!=prev]
  if not opts:break
  prev,cur=cur,opts[0]
 loops.append(loop)
rim=max(loops,key=len);directed=set(map(tuple,np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]])))
if (rim[0],rim[1]) in directed:rim=rim[::-1]
vertices=v.tolist();faces=f.tolist();previous=rim;boundary=v[rim]
for t in np.linspace(0,1,35)[1:-1]:
 smooth=gaussian_filter1d(boundary,8,axis=0,mode='wrap');blend=min(1,t*5)
 q=boundary*(1-blend)+smooth*blend;r=np.cos(t*np.pi/2)
 q[:,0]*=r;q[:,1]=.20+(q[:,1]-.20)*r;q[:,2]=q[:,2]*(1-t)-1.02*np.sin(t*np.pi/2)
 current=list(range(len(vertices),len(vertices)+len(q)));vertices.extend(q.tolist())
 for i in range(len(q)):
  j=(i+1)%len(q);faces.extend([[previous[i],previous[j],current[j]],[previous[i],current[j],current[i]]])
 previous=current
pole=len(vertices);vertices.append([0,.20,-1.02])
for i in range(len(previous)):faces.append([previous[i],previous[(i+1)%len(previous)],pole])
angles=np.linspace(0,2*np.pi,97)[:-1];previous=None
profile=[(-.35,.55),(-.60,.55),(-.85,.53),(-1.05,.52),(-1.20,.54),(-1.32,.61),(-1.43,.77),(-1.55,1.02),(-1.68,1.25),(-1.78,1.32)]
for y,r in profile:
 q=[[r*np.sin(th),y,-.30+min(r*.85,.64)*np.cos(th)] for th in angles];current=list(range(len(vertices),len(vertices)+len(q)));vertices.extend(q)
 if previous is not None:
  for i in range(len(q)):
   j=(i+1)%len(q);faces.extend([[previous[i],current[j],previous[j]],[previous[i],current[i],current[j]]])
 previous=current
vertices=np.array(vertices);faces=np.array(faces);assert np.isfinite(vertices).all();assert np.array_equal(vertices[:len(v)],v)
(out/'scan-bust.json').write_text(json.dumps({'vertices':vertices.round(6).ravel().tolist(),'indices':faces.ravel().tolist()},separators=(',',':')))
print('scan face vertices',len(v),'completed',len(vertices),'triangles',len(faces))

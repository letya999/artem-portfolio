"""Deform only the face of the supplied complete cube model using owner scan depth."""
import json,copy,argparse
from pathlib import Path
import numpy as np
from scipy.interpolate import LinearNDInterpolator
p=argparse.ArgumentParser();p.add_argument('base',type=Path);p.add_argument('scan',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
d=json.loads(a.base.read_text());original=copy.deepcopy(d['cubes']);scan=json.loads(a.scan.read_text());v=np.array(scan['vertices']).reshape(-1,3)
v[:,0]*=.86;v[:,1]=.85+(v[:,1]+1.10)*.89;v[:,2]=v[:,2]*.89+.12
# Keep the frontmost scan sample per small XY bin; exclude texture/back rim overlaps.
samples={}
for x,y,z in v:
 key=(round(x,2),round(y,2))
 if key not in samples or z>samples[key]:samples[key]=z
xy=np.array(list(samples));z=np.array(list(samples.values()));field=LinearNDInterpolator(xy,z)
regions={'cheek','jaw','nose','mouth','eye'};changed=0;fill=[]
def smooth(t):t=np.clip(t,0,1);return t*t*(3-2*t)
for c in d['cubes']:
 x,y,old=c['position']
 if c['region'] not in regions or old<.15:continue
 target=float(field(x,y))
 if not np.isfinite(target):continue
 weight=float(smooth((.78-abs(x))/.18)*smooth((y-.83)/.17)*smooth((2.45-y)/.22))
 new=old+weight*(target-old)
 if weight<.01:continue
 c['position'][2]=round(new,6);changed+=1
 # Inner overlapping cubes close depth steps while leaving the measured front exposed.
 for depth in [1,2]:
  inner=copy.deepcopy(c);inner['position'][2]=round(new-depth*d['pitch'],6);inner['region']='face-interior';fill.append(inner)
d['cubes'].extend(fill)
for i,c in enumerate(d['cubes']):c['id']=i
for before,after in zip(original,d['cubes']):
 if before['region'] not in regions:assert before['position']==after['position'] and before['quaternion']==after['quaternion']
d['count']=len(d['cubes']);d['description']='Original complete cube head; face depth fitted to owner scan. Skull, ears and neck preserved.'
positions=np.array([c['position'] for c in d['cubes']]);assert np.isfinite(positions).all() and changed>100
half=d['cubeSize']/2;d['bounds']={'min':(positions.min(0)-half).tolist(),'max':(positions.max(0)+half).tolist()}
a.output.write_text(json.dumps(d,separators=(',',':')));print('Changed',changed,'face cubes;',len(fill),'inner cubes;',d['count'],'total')

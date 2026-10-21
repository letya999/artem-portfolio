"""Complete the local research face with an estimated bald cranium, ears and neck.
Unseen anatomy is artistic completion, not measured reconstruction.
"""
import argparse,json
from pathlib import Path
import numpy as np
from scipy.ndimage import gaussian_filter1d
p=argparse.ArgumentParser();p.add_argument('directory',type=Path);a=p.parse_args()
for name in ['fitted','fitted-smile']:
 d=json.loads((a.directory/(name+'.json')).read_text());v=np.array(d['vertices']).reshape(-1,3);f=np.array(d['indices']).reshape(-1,3)
 edges=np.sort(np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1);u,c=np.unique(edges,axis=0,return_counts=True);adj={}
 for x,y in u[c==1]:adj.setdefault(int(x),[]).append(int(y));adj.setdefault(int(y),[]).append(int(x))
 seen=set();loops=[]
 for start in adj:
  if start in seen:continue
  loop=[];prev=-1;cur=start
  while cur not in seen:
   seen.add(cur);loop.append(cur);options=[i for i in adj[cur] if i!=prev];prev,cur=cur,options[0]
  loops.append(loop)
 boundary=max(loops,key=len)
 directed=set(map(tuple,np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]])))
 if (boundary[0],boundary[1]) in directed:boundary=boundary[::-1]
 b=v[boundary];vertices=v.tolist();faces=f.tolist();last=boundary
 for t in np.linspace(0,1,49)[1:-1]:
  theta=t*np.pi/2;radius=np.cos(theta);smooth=gaussian_filter1d(b,12,axis=0,mode="wrap");blend=min(1,t*7);base=b*(1-blend)+smooth*blend;q=base.copy();q[:,0]*=radius
  q[:,1]=.25+(base[:,1]-.25)*radius+np.clip((base[:,1]-.15)/.9,0,1)*np.sin(np.pi*t)**.85*.94
  q[:,2]=base[:,2]*(1-t)-1.58*np.sin(theta)
  ids=list(range(len(vertices),len(vertices)+len(q)));vertices.extend(q.tolist())
  for i in range(len(q)):
   j=(i+1)%len(q);faces.extend([[last[i],last[j],ids[j]],[last[i],ids[j],ids[i]]])
  last=ids
 pole=len(vertices);vertices.append([0,.25,-1.58])
 for i in range(len(last)):faces.append([last[i],last[(i+1)%len(last)],pole])
 # Neck overlaps the underside behind the chin; it does not alter the fitted face.
 def rings(rows):
  previous=None
  for row in rows:
   ids=list(range(len(vertices),len(vertices)+len(row)));vertices.extend(row)
   if previous is not None:
    for i in range(len(row)):
     j=(i+1)%len(row);faces.extend([[previous[i],previous[j],ids[j]],[previous[i],ids[j],ids[i]]])
   previous=ids
 angles=np.linspace(0,2*np.pi,97)[:-1]
 rows=[]
 for y in np.linspace(-.65,-1.90,32):
  t=(-y-.65)/1.25;width=.62+.04*t+.25*max(0,(t-.65)/.35)**2
  rows.append([[width*np.sin(th),y,-.65+(.65+.05*t)*np.cos(th)] for th in angles])
 rings(rows)
 # Ear shell: recessed concha, raised helix and rounded lobule; no exposed wires.
 for side in [-1,1]:
  rows=[]
  for r in np.linspace(.001,1,22):
   row=[]
   for th in angles:
    y=.08+.34*r*np.cos(th);x=side*(1.10+.19*r*np.sin(th));z=-.65+.12*np.exp(-((r-.82)/.12)**2)-.12*(1-r)
    row.append([x,y,z])
   rows.append(row)
  rings(rows)
 # Bevelled two-step plinth. The neck rests on its top at -1.90.
 plinth_start=len(faces)*3
 profile=[(-1.90,.001),(-1.90,.94),(-1.94,.99),(-2.06,.99),(-2.10,1.05),(-2.10,1.14),(-2.14,1.18),(-2.28,1.18),(-2.32,1.14),(-2.32,.001)]
 rings([[[r*np.sin(th),y,-.65+r*.78*np.cos(th)] for th in angles] for y,r in profile])
 vertices=np.array(vertices);faces=np.array(faces);
 assert np.array_equal(vertices[:len(v)],v), 'Completion must preserve the fitted face exactly'
 assert np.isfinite(vertices).all() and faces.max()<len(vertices)
 data={'vertices':vertices.round(6).ravel().tolist(),'indices':faces.ravel().tolist(),'plinthStart':plinth_start}
 (a.directory/(name+'-head.json')).write_text(json.dumps(data,separators=(',',':')))
 (a.directory/(name+'-head.obj')).write_text('\n'.join(['v %.6f %.6f %.6f'%tuple(x) for x in vertices]+['f %d %d %d'%tuple(x+1) for x in faces]))
 print(name,len(vertices),'vertices',len(faces),'faces')


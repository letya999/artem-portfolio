"""Extract full identity surface from unoccluded owner photos. Local inference only."""
import argparse,json
from pathlib import Path
import numpy as np
from PIL import Image
import mediapipe as mp
p=argparse.ArgumentParser();p.add_argument('model');p.add_argument('canonical');p.add_argument('photos',nargs='+');p.add_argument('--output',required=True);a=p.parse_args()
canonical=np.array([[float(v) for v in l.split()[1:]] for l in Path(a.canonical).read_text().splitlines() if l.startswith('v ')])
ids=[33,133,263,362,168,10,127,356,6,234,454]
target=canonical[ids]-canonical[ids].mean(0)
views=[]
opts=mp.tasks.vision.FaceLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=a.model))
with mp.tasks.vision.FaceLandmarker.create_from_options(opts) as detector:
 for filename in a.photos:
  pixels=np.array(Image.open(filename).convert('RGB'));h,w=pixels.shape[:2]
  result=detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=pixels))
  if len(result.face_landmarks)!=1:raise ValueError('Expected one unobscured face')
  raw=np.array([[v.x,-v.y*h/w,-v.z] for v in result.face_landmarks[0]])
  centered=raw-raw[ids].mean(0)
  u,_,vh=np.linalg.svd(centered[ids].T@target);r=u@vh
  if np.linalg.det(r)<0:u[:,-1]*=-1;r=u@vh
  face=centered@r;face-=(face[468]+face[473])/2
  face*=.72/np.linalg.norm(face[468]-face[473]);views.append(face)
# Primary neutral view owns expression and XY. Secondary neutral view only stabilizes depth.
face=views[0].copy()
if len(views)>1:face[:,2]=.8*face[:,2]+.2*views[1][:,2]
mirrored=canonical.copy();mirrored[:,0]*=-1
pairs=np.argmin(np.linalg.norm(mirrored[:,None,:]-canonical[None,:,:],axis=2),axis=1)
other=face[:468][pairs].copy();other[:,0]*=-1
face[:468]=.5*(face[:468]+other)
face[:,1]+=1.85;face[:,2]+=.50
Path(a.output).write_text(json.dumps({'points':face.round(7).tolist(),'sourceViews':len(views),'method':'Pose-aligned MediaPipe surface; depth and unseen scalp are estimates'},separators=(',',':')),encoding='utf-8')
print('Landmarks',len(face),'nose',face[1].round(3),'chin',face[152].round(3))

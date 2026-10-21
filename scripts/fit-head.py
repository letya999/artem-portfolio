import mediapipe as mp,numpy as np,json
from PIL import Image
from pathlib import Path
import argparse
parser=argparse.ArgumentParser(description="Fit three unoccluded portrait views: frontal, secondary frontal, three-quarter")
parser.add_argument("model")
parser.add_argument("canonical",help="Official MediaPipe canonical_face_model.obj; used only to remove pose")
parser.add_argument("photos",nargs=3)
args=parser.parse_args()
paths=args.photos
canonical=np.array([[float(x) for x in line.split()[1:]] for line in Path(args.canonical).read_text().splitlines() if line.startswith('v ')])
# Stable upper-face landmarks estimate pose without making the expression a fitting target.
fit=[4,6,10,33,133,263,362,168,234,454,127,356,93,323,172,397,152]
target=canonical[fit]-canonical[fit].mean(axis=0)
options=mp.tasks.vision.FaceLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=args.model))
views=[]
with mp.tasks.vision.FaceLandmarker.create_from_options(options) as detector:
 for path in paths:
  pixels=np.array(Image.open(path).convert('RGB'));height,width=pixels.shape[:2]
  result=detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=pixels))
  assert len(result.face_landmarks)==1
  raw=np.array([[p.x,-p.y*height/width,-p.z] for p in result.face_landmarks[0]])
  centered=raw-raw[fit].mean(axis=0)
  u,s,v=np.linalg.svd(centered[fit].T@target)
  rotate=u@v
  assert np.linalg.det(rotate)>.9
  aligned=centered@rotate
  eyes=(aligned[468]+aligned[473])/2
  aligned-=eyes
  aligned*=.82/np.linalg.norm(aligned[468]-aligned[473])
  views.append(aligned)
  print('View', 'chin',aligned[152].round(3),'nose',aligned[1].round(3),'width',round(np.linalg.norm(aligned[234]-aligned[454]),3))
mean=np.average(views,axis=0,weights=[.65,.15,.20])
# Pair mirrored topology vertices to remove pose-estimation bias while preserving identity proportions.
mirrored=canonical.copy();mirrored[:,0]*=-1
pairs=np.argmin(np.linalg.norm(mirrored[:,None,:]-canonical[None,:,:],axis=2),axis=1)
face=mean[:468].copy(); opposite=face[pairs].copy();opposite[:,0]*=-1
face=(face+opposite)/2
face[:,2]+=.50
(Path(__file__).resolve().parent/'face-landmarks.json').write_text(json.dumps(face.round(6).tolist()),encoding='utf-8')
print('averaged', {i:face[i].round(3).tolist() for i in [1,4,10,13,14,152,33,263,234,454]})

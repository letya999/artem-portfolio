"""Bake the exact reference portrait into closed, photo-registered 3D contours.
Run with a local official MediaPipe face_landmarker.task path. No image editing.
"""
from pathlib import Path
import sys,json
import numpy as np
from PIL import Image
from scipy.interpolate import RBFInterpolator,PchipInterpolator
import mediapipe as mp
ROOT=Path(__file__).resolve().parents[1]
pixels=np.array(Image.open(ROOT/'public/artem-reference.png').convert('RGB'))
options=mp.tasks.vision.FaceLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=sys.argv[1]))
with mp.tasks.vision.FaceLandmarker.create_from_options(options) as detector:
    result=detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB,data=pixels))
    assert len(result.face_landmarks)==1
    face=np.array([[p.x,p.y,p.z] for p in result.face_landmarks[0]])
# Silhouette coordinates trace the supplied photograph, preserving its tilt and proportions.
ys=[.178,.20,.24,.28,.32,.36,.40,.44,.48,.52,.56,.60]
left=PchipInterpolator(ys,[.479,.412,.372,.353,.357,.365,.378,.403,.431,.444,.435,.409])
right=PchipInterpolator(ys,[.490,.555,.602,.620,.628,.620,.604,.594,.584,.576,.585,.605])
scale=7.8
def base(x,y):
    l,r=left(y),right(y)
    return -.18+.64*np.sqrt(np.maximum(0,1-((x-(l+r)/2)/((r-l)/2))**2))
points=list(face[:468,:2]);values=list(-face[:468,2]*scale+.42)
for y in np.linspace(.178,.60,70):
    for x in [left(y),right(y)]:points.append([float(x),y]);values.append(-.18)
for y in [.185,.20,.22,.55,.58,.60]:
    for x in np.linspace(left(y),right(y),12)[1:-1]:
        if np.min(np.linalg.norm(face[:468,:2]-[x,y],axis=1))>.018:
            points.append([x,y]);values.append(float(base(x,y)))
fit=RBFInterpolator(np.array(points),np.array(values),smoothing=.000008)
count,segments,rows=42,192,5
data=[]
for y in np.linspace(.178,.60,count*rows+1):
    a=np.linspace(0,2*np.pi,segments+1)
    l,r=left(y),right(y)
    x=(l+r)/2+(r-l)/2*np.cos(a)
    front=np.sin(a)>=-1e-6
    depth=np.interp(y,[.178,.23,.34,.46,.52,.60],[.01,.6,.78,.65,.44,.42])
    z=-.18-depth*np.abs(np.sin(a))
    z[front]=np.clip(fit(np.column_stack([x[front],np.full(front.sum(),y)])),-.35,1.1)
    crown=np.clip((.27-y)/.04,0,1)
    z[front]=(1-crown)*z[front]+crown*base(x[front],y)
    data.extend(np.column_stack([(x-.49)*scale,np.full(len(x),(.389-y)*scale),z,x,np.full(len(x),1-y)]).ravel())
array=np.array(data,dtype='<f4').reshape(-1,segments+1,5)
array[:,-1,:3]=array[:,0,:3]
array.ravel().tofile(ROOT/'public/head-contours.bin')
eyes=[]
for iris,a,b in [(468,33,133),(473,362,263)]:
    eyes.append({'center':[float(face[iris,0]),float(1-face[iris,1])],'radius':[float(np.linalg.norm(face[a,:2]-face[b,:2])*.48),.006]})
delta=face[473,:2]-face[468,:2]
metadata={'slices':count,'segments':segments,'rows':rows,'eyes':eyes,'eyeAngle':float(-np.arctan2(delta[1],delta[0])),'landmarks':478,'sourceViews':1,'stride':5}
(ROOT/'src/head-data.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Baked exact reference projection:',array.nbytes,'bytes')

"""Bake closed head contours from the owner's portrait; no ML runtime in the site.
Run in an isolated environment with mediapipe, scipy, numpy and pillow installed.
Pass a downloaded official face_landmarker.task model as the only argument.
"""
from pathlib import Path
import json
import sys
import numpy as np
from PIL import Image
from scipy.interpolate import CloughTocher2DInterpolator
from scipy.ndimage import gaussian_filter1d
import mediapipe as mp

ROOT = Path(__file__).resolve().parents[1]
image = np.array(Image.open(ROOT / 'public/portrait.png').convert('RGBA'))
options = mp.tasks.vision.FaceLandmarkerOptions(base_options=mp.tasks.BaseOptions(model_asset_path=sys.argv[1]))
with mp.tasks.vision.FaceLandmarker.create_from_options(options) as detector:
    result = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(image[:,:,:3])))
    assert len(result.face_landmarks) == 1, 'Expected exactly one portrait face'
    landmarks = np.array([[p.x,p.y,p.z] for p in result.face_landmarks[0]])
center = (landmarks[468,:2] + landmarks[473,:2]) / 2
angle = np.arctan2(*(landmarks[473,:2]-landmarks[468,:2])[::-1])
rotation = np.array([[np.cos(angle),-np.sin(angle)],[np.sin(angle),np.cos(angle)]])
face = (landmarks[:,:2]-center) @ rotation
scale = 6.2
# Geometry is levelled; UVs retain the untouched source photograph.
def uv(x,y):
    return np.stack(np.broadcast_arrays(x,y),axis=-1) @ rotation.T + center

y_values = np.linspace(-.1775,.285,257)
widths = []
for y in y_values:
    x = np.linspace(-.24,.24,1024)
    coords = uv(x,y)
    ix = np.clip((coords[:,0]*(image.shape[1]-1)).astype(int),0,image.shape[1]-1)
    iy = np.clip((coords[:,1]*(image.shape[0]-1)).astype(int),0,image.shape[0]-1)
    valid = x[image[iy,ix,3]>150]
    widths.append([valid.min(),valid.max()] if len(valid) else [-.001,.001])
widths = gaussian_filter1d(np.array(widths),1,axis=0)
def bounds(y):
    return np.interp(y,y_values,widths[:,0]),np.interp(y,y_values,widths[:,1])
def base(x,y):
    l,r=bounds(y)
    radial=np.sqrt(np.maximum(0,1-((x-(l+r)/2)/((r-l)/2))**2))
    depth=np.interp(y,[-.1775,-.15,-.06,.08,.18,.23,.285],[.005,.54,.80,.79,.48,.43,.44])
    return -.28+depth*radial
# Face depth comes from inferred landmarks. Unseen cranium/neck are anatomical approximations.
points=list(face[:468]); values=list(-landmarks[:468,2]*scale+.38-base(face[:468,0],face[:468,1]))
for y in np.linspace(-.1775,.285,70):
    l,r=bounds(y)
    for x in [l,r]:
        points.append([x,y]);values.append(0)
for y in np.linspace(-.1775,-.105,12):
    l,r=bounds(y)
    for x in np.linspace(l,r,15)[1:-1]:
        if np.min(np.linalg.norm(face[:468]-[x,y],axis=1))>.025:
            points.append([x,y]);values.append(0)
for y in [.24,.26,.285]:
    l,r=bounds(y)
    for x in np.linspace(l,r,15)[1:-1]:
        points.append([x,y]);values.append(0)
interp=CloughTocher2DInterpolator(points,values,fill_value=0)
count=64
segments=192
rows=4
ys=np.linspace(-.1775,.285,count*rows+1)
data=[]
for y in ys:
    theta=np.linspace(0,2*np.pi,segments+1)
    l,r=bounds(y)
    x=(l+r)/2+(r-l)/2*np.cos(theta)
    front=np.sin(theta)>=-1e-6
    depth=np.interp(y,[-.1775,-.15,-.05,.08,.18,.23,.285],[.005,.57,.83,.8,.55,.43,.44])
    z=-.28-depth*np.abs(np.sin(theta))
    z[front]=base(x[front],y)+np.clip(interp(x[front],np.full(front.sum(),y)),-.45,.75)
    coords=uv(x,y)
    data.extend(np.column_stack([x*scale,np.full(len(x),-y*scale+.28),z,coords[:,0],1-coords[:,1]]).ravel())
array=np.array(data,dtype='<f4')
assert np.isfinite(array).all()
array.tofile(ROOT/'public/head-contours.bin')
# Eye socket ellipses are oriented with the source, for a local gaze shader inside the lids.
eyes=[]
for iris,a,b in [(468,33,133),(473,362,263)]:
    eyes.append({'center':[float(landmarks[iris,0]),float(1-landmarks[iris,1])], 'radius':[float(np.linalg.norm(landmarks[a,:2]-landmarks[b,:2])*.48),.0065]})
metadata={'slices':count,'segments':segments,'rows':rows,'eyes':eyes,'eyeAngle':float(-angle),'landmarks':478,'stride':5}
(ROOT/'src/head-data.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
print(f'Baked {len(array)//5:,} vertices, {array.nbytes:,} bytes; eye landmarks: {eyes}')

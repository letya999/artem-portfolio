"""Original analytic portrait volume -> uniform cubic voxels -> GLB + JSON.
No third-party face mesh or texture is used. This is a stylized approximation,
not a scan or an exact facial reconstruction from the reference photographs.
"""
import json, struct, math
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.ndimage import binary_erosion, generate_binary_structure, label, distance_transform_edt, gaussian_filter, map_coordinates
from scipy.spatial import ConvexHull
from scipy.spatial.transform import Rotation

OUT=Path(__file__).resolve().parents[1]

# Pose-aligned measurements previously extracted locally from the supplied photographs.
LANDMARKS = np.array(json.loads((OUT/'scripts'/'face-landmarks.json').read_text(encoding='utf-8')))
assert LANDMARKS.shape == (468,3) and np.isfinite(LANDMARKS).all()
FACE_SCALE = .70/.82  # Preserve the measured inter-eye distance in model units.
NOSE_Y = 2.055 + LANDMARKS[1,1]*FACE_SCALE
MOUTH_Y = 2.055 + (LANDMARKS[13,1]+LANDMARKS[14,1])*.5*FACE_SCALE
MOUTH_HALF = abs(LANDMARKS[61,0])*FACE_SCALE

# Axis convention: Y up; face looks along +Z. All dimensions are design units.
YS=np.array([.72,.80,.94,1.14,1.40,1.72,2.05,2.30,2.57,2.80,3.00,3.16,3.24])
WS=np.array([.08,.34,.52,.67,.75,.80,.82,.83,.80,.72,.57,.31,.01])
FS=np.array([.37,.53,.64,.62,.62,.63,.63,.69,.69,.58,.40,.17,-.04])
BS=np.array([-.24,-.38,-.51,-.65,-.78,-.88,-.94,-.96,-.94,-.84,-.68,-.40,-.06])
width=PchipInterpolator(YS,WS)
front=PchipInterpolator(YS,FS)
back=PchipInterpolator(YS,BS)

def gauss(x,y,cx,cy,sx,sy):
    return np.exp(-((x-cx)/sx)**2-((y-cy)/sy)**2)

def volume(x,y,z):
    world_y=y; y=y+.30
    yy=np.clip(y,YS[0],YS[-1]); w=width(yy)
    r=np.abs(x)/(w+1e-9)
    center=-.12
    edge=np.maximum(0.,1.-r*r)
    ff=center+(front(yy)-center)*edge**.40
    bb=center+(back(yy)-center)*edge**.50
    # Photo-derived landmark proportions: preserve the longer lower face and low mouth.
    # Depth remains a sculpted estimate; landmark depth is not a metrical scan.
    eye_y = 2.055
    eye_x = .35
    for side in [-1., 1.]:
        dx = x - side*eye_x
        lid_y = eye_y + .025*(dx*side/.20)
        ff -= .19*gauss(x,y,side*eye_x,eye_y,.24,.115)
        ff += .090*gauss(x,y,side*.36,2.205,.28,.065)
        # Almond-shaped eyelids instead of circular orbital craters.
        lens = np.maximum(0,1-(dx/.22)**2)
        ff += .075*np.exp(-(dx/.21)**4-((y-lid_y)/(.035+.025*lens))**2)
        ff += .045*np.exp(-(dx/.23)**4-((y-lid_y-.064*lens)/.023)**2)
        ff += .035*np.exp(-(dx/.23)**4-((y-lid_y+.053*lens)/.024)**2)
        ff += .075*gauss(x,y,side*.54,1.79,.23,.20)
        ff -= .030*gauss(x,y,side*.55,1.40,.23,.20)
    # Feature centers use the measured ratios from the owner's neutral views.
    ff += .255*gauss(x,y,0.,1.91,.110,.28)
    ff += .35*gauss(x,y,0.,NOSE_Y,.145,.105)
    for side in [-1.,1.]:
        ff += .12*gauss(x,y,side*.155,NOSE_Y-.04,.077,.063)
        ff -= .13*gauss(x,y,side*.125,NOSE_Y-.092,.051,.032)
    ff -= .035*gauss(x,y,0.,1.45,.065,.075)
    # Defined vermilion planes, cupid's bow and closed lip seam.
    lip_line=MOUTH_Y + .026*np.exp(-(x/.11)**2) - .015*(x/.32)**2
    envelope=np.exp(-(x/MOUTH_HALF)**6)
    ff += .085*envelope*np.exp(-((y-lip_line-.036)/.033)**2)
    ff += .115*envelope*np.exp(-((y-lip_line+.064)/.044)**2)
    ff -= .070*envelope*np.exp(-((y-lip_line)/.018)**2)
    ff -= .040*gauss(x,y,0.,1.10,.30,.050)
    ff += .075*gauss(x,y,0.,.94,.33,.10)
    head=(y>=YS[0])&(y<=YS[-1])&(r<=1)&(z<=ff)&(z>=bb)
    # Short neck behind the jaw, with a modest flat bottom rather than shoulders.
    head_y=y; y=world_y
    neck_w=np.interp(y,[0,.12,.30,.60,1.05,1.20],[.68,.68,.56,.51,.51,.43])
    neck_d=np.interp(y,[0,.12,.30,.60,1.05,1.20],[.52,.52,.46,.44,.46,.40])
    neck=((x/neck_w)**2+((z+.20)/neck_d)**2<=1)&(y>=0)&(y<1.17)
    y=head_y
    ear=((np.abs(x)-.855)/.17)**2+((y-1.88)/.315)**2+((z+.15)/.205)**2<=1
    # Lateral concha carved into each ear, not a smooth separate component.
    ear&=~((np.abs(x)>.89)&(((y-1.91)/.15)**2+((z+.10)/.10)**2<1))
    return head|neck|ear

def region(p):
    x,y,z=p; y+=.30
    if abs(x)>.84 and 1.50<y<2.22: return 'ear'
    if y<.96: return 'neck'
    if z<-.20: return 'back'
    if abs(x)<.22 and 1.61<y<2.22 and z>.62: return 'nose'
    if .13<abs(x)<.61 and 1.92<y<2.17 and z>.22: return 'eye'
    if abs(x)<.4 and 1.30<y<1.59 and z>.4: return 'mouth'
    if y<1.30 and z>.13: return 'jaw'
    if y>2.24: return 'forehead'
    return 'cheek'

_NORMAL_FIELD=None
def surface_normals(points):
    global _NORMAL_FIELD
    if _NORMAL_FIELD is None:
        step=.024
        axes=[np.arange(-1.2,1.21,step),np.arange(-.15,3.5,step),np.arange(-1.2,1.4,step)]
        x,y,z=np.meshgrid(*axes,indexing='ij');v=volume(x,y,z)
        sdf=(distance_transform_edt(~v)-distance_transform_edt(v))*step
        sdf=gaussian_filter(sdf,1.6)
        gradients=np.gradient(sdf,step)
        _NORMAL_FIELD=(axes,gradients,step,sdf)
    axes,gradient,step,sdf=_NORMAL_FIELD
    ijk=np.array([(points[:,i]-a[0])/step for i,a in enumerate(axes)])
    n=np.array([map_coordinates(g,ijk,order=1,mode='nearest') for g in gradient]).T
    n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-9)
    return n, map_coordinates(sdf,ijk,order=1,mode='nearest')

def orientations(normals,points):
    axes=np.zeros_like(normals)
    ii=np.argmax(np.abs(normals),axis=1)
    axes[np.arange(len(ii)),ii]=np.sign(normals[np.arange(len(ii)),ii])
    cross=np.cross(axes,normals);dot=np.sum(axes*normals,axis=1)
    quat=np.column_stack([cross,1+dot]);quat/=np.linalg.norm(quat,axis=1,keepdims=True)
    # Face-aligned cubes: same size, subtle rotation to follow the relief.
    rv=Rotation.from_quat(quat).as_rotvec()*.90
    rv[points[:,1]<.25]=0
    return Rotation.from_rotvec(rv).as_quat()

def voxelize(pitch):
    xs=np.arange(-math.ceil(1.08/pitch),math.ceil(1.08/pitch)+1)*pitch
    ys=(np.arange(math.ceil(3.27/pitch))+.5)*pitch
    zs=np.arange(-math.ceil(1.08/pitch),math.ceil(1.18/pitch)+1)*pitch
    X,Y,Z=np.meshgrid(xs,ys,zs,indexing='ij')
    v=volume(X,Y,Z)
    # Keep the dominant 6-connected component, eliminating sampling islands.
    lab,n=label(v,generate_binary_structure(3,1)); counts=np.bincount(lab.ravel());counts[0]=0
    v=lab==int(np.argmax(counts))
    shell=v&~binary_erosion(v,structure=generate_binary_structure(3,1))
    ii=np.argwhere(shell)
    pts=np.column_stack([xs[ii[:,0]],ys[ii[:,1]],zs[ii[:,2]]])
    # Stable IDs ordered by layer, then depth, then X; origin at bottom center.
    order=np.lexsort((pts[:,0],pts[:,2],pts[:,1]));pts=pts[order];ii=ii[order]
    normals,signed_distances=surface_normals(pts)
    offsets=-(signed_distances+pitch*.966*.49)
    offsets[pts[:,1]<.24]=0
    pts+=normals*offsets[:,None]
    rotations=orientations(normals,pts)
    # Count 26-neighbour occupancy as a gentle cavity AO hint for the viewer.
    ao=[]
    for a,b,c in ii:
        neighbours=v[max(a-1,0):a+2,max(b-1,0):b+2,max(c-1,0):c+2]
        ao.append(round(float(np.clip(1.-max(0,int(neighbours.sum())-13)*.018,.78,1.)),4))
    cubes=[]
    for i,(p,n,a,q) in enumerate(zip(pts,normals,ao,rotations)):
        cubes.append({'id':i,'name':f'cube_{i:04d}','position':np.round(p,6).tolist(),
                      'normal':np.round(n,6).tolist(),'quaternion':np.round(q,8).tolist(),'region':region(p),'ao':a})
    return {
        'format':'voxel-portrait/1.0','name':'Voxel portrait вЂ” cube study',
        'description':'Sculpted approximation calibrated to facial landmark proportions; not a biometric scan.',
        'construction':'Equal-size beveled cubes, slightly oriented to follow the relief. Cubes are separate closed meshes; the aggregate is not a fused watertight solid.',
        'axis':{'up':'+Y','front':'+Z'},'units':'design units',
        'count':len(cubes),'pitch':round(pitch,6),'cubeSize':round(pitch*.966,6),
        'bevelRatio':.018,'interior':'boundary shell; invisible internal voxels omitted',
        'bounds':{'min':np.round(pts.min(axis=0)-pitch*.966/2,6).tolist(),
                  'max':np.round(pts.max(axis=0)+pitch*.966/2,6).tolist()},
        'material':{'name':'Polished steel','baseColor':[.72,.75,.78,1.],
                    'metallic':1.0,'roughness':.20},
        'cubes':cubes
    }

def cube_mesh(bevel=.018):
    pts=[]
    for sx in (-1,1):
      for sy in (-1,1):
       for sz in (-1,1):
        for a in range(3):
         q=np.array([.5-bevel]*3);q[a]=.5
         pts.append(q*np.array([sx,sy,sz]))
    pts=np.array(pts);h=ConvexHull(pts)
    pos=[];norm=[]
    for ids,e in zip(h.simplices,h.equations):
        tri=pts[ids];n=e[:3]
        if np.dot(np.cross(tri[1]-tri[0],tri[2]-tri[0]),n)<0:tri=tri[[0,2,1]]
        pos.extend(tri);norm.extend([n,n,n])
    return np.array(pos,dtype='<f4'),np.array(norm,dtype='<f4')

def export_glb(data,path):
    p,n=cube_mesh(data['bevelRatio']);pb=p.tobytes();nb=n.tobytes();binary=pb+nb
    nodes=[{'name':'VoxelPortrait','children':list(range(1,data['count']+1)),
            'extras':{k:data[k] for k in ['format','count','pitch','cubeSize','axis','description']}}]
    for c in data['cubes']:
        nodes.append({'name':c['name'],'mesh':0,'translation':c['position'],
          'scale':[data['cubeSize']]*3,'rotation':c['quaternion'],
          'extras':{'cubeId':c['id'],'region':c['region'],'restPosition':c['position'],'normal':c['normal']}})
    g={'asset':{'version':'2.0','generator':'Voxel portrait analytic builder 1.0',
                'copyright':'Original procedural geometry supplied for this project'},
       'scene':0,'scenes':[{'name':'Voxel portrait','nodes':[0]}], 'nodes':nodes,
       'meshes':[{'name':'SharedUnitCube','primitives':[{'attributes':{'POSITION':0,'NORMAL':1},'material':0,'mode':4}]}],
       'materials':[{'name':'PolishedSteel','pbrMetallicRoughness':{
          'baseColorFactor':data['material']['baseColor'],'metallicFactor':1.0,'roughnessFactor':.20}}],
       'buffers':[{'byteLength':len(binary)}],
       'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':len(pb),'target':34962},
                      {'buffer':0,'byteOffset':len(pb),'byteLength':len(nb),'target':34962}],
       'accessors':[{'bufferView':0,'componentType':5126,'count':len(p),'type':'VEC3',
           'min':p.min(axis=0).tolist(),'max':p.max(axis=0).tolist()},
           {'bufferView':1,'componentType':5126,'count':len(n),'type':'VEC3'}]}
    jb=json.dumps(g,ensure_ascii=False,separators=(',',':')).encode();jb+=b' '*((-len(jb))%4)
    binary+=b'\0'*((-len(binary))%4)
    total=12+8+len(jb)+8+len(binary)
    path.write_bytes(struct.pack('<III',0x46546C67,2,total)+struct.pack('<I4s',len(jb),b'JSON')+jb+
                     struct.pack('<I4s',len(binary),b'BIN\0')+binary)

if __name__ == '__main__':
    d = voxelize(.043)
    p, n = cube_mesh(d['bevelRatio'])
    d['geometry'] = {'positions': p.round(7).tolist(), 'normals': n.round(7).tolist()}
    (OUT/'public'/'voxel-portrait.json').write_text(json.dumps(d, separators=(',', ':')), encoding='utf-8')
    print('Baked', d['count'], 'cubes')

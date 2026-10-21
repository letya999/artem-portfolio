"""Resample the complete template volume with a pose-aligned measured face.
The retained render shell encloses a connected solid; face samples never move isolated cubes.
"""
import argparse, importlib.util, json
from pathlib import Path
import numpy as np
from scipy.ndimage import binary_opening, median_filter, binary_erosion, binary_fill_holes, distance_transform_edt, gaussian_filter, generate_binary_structure, label


def raster_front(vertices, triangles, xs, ys):
    """Orthographic z-buffer of real scan triangles, without convex-hull extrapolation."""
    front=np.full((len(xs),len(ys)),np.nan)
    pitch=xs[1]-xs[0]
    for tri in vertices[triangles]:
        x0,x1=max(0,int(np.ceil((tri[:,0].min()-xs[0])/pitch))),min(len(xs)-1,int(np.floor((tri[:,0].max()-xs[0])/pitch)))
        y0,y1=max(0,int(np.ceil((tri[:,1].min()-ys[0])/pitch))),min(len(ys)-1,int(np.floor((tri[:,1].max()-ys[0])/pitch)))
        if x1<x0 or y1<y0:continue
        a,b,c=tri;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        if abs(den)<1e-12:continue
        x,y=np.meshgrid(xs[x0:x1+1],ys[y0:y1+1],indexing='ij')
        u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/den
        w=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/den
        inside=(u>=-1e-7)&(w>=-1e-7)&(u+w<=1+1e-7)
        depth=u*a[2]+w*b[2]+(1-u-w)*c[2]
        block=front[x0:x1+1,y0:y1+1]
        block[:]=np.where(inside,np.fmax(block,depth),block)
    return front


def surface_depth(solid,zs):
    return np.max(np.where(solid,zs[None,None,:],-np.inf),axis=2)


def build(template, scan, frame, pitch):
    vertices=np.array(scan['vertices'],dtype=float).reshape(-1,3)
    triangles=np.array(scan['indices'],dtype=int).reshape(-1,3)
    assert np.isfinite(vertices).all() and triangles.min()>=0 and triangles.max()<len(vertices)
    basis=np.array(frame['basis']);origin=np.array(frame['origin'])
    assert np.allclose(basis.T@basis,np.eye(3),atol=1e-6) and np.linalg.det(basis)>.999
    vertices=(vertices-origin)@basis
    scale=(2.94-.72)/np.ptp(vertices[:,1])
    eye_height=.72-vertices[:,1].min()*scale
    vertices=vertices*scale+np.array([0,eye_height,.48])
    xs=np.arange(-35,36)*pitch;ys=(np.arange(75)+.5)*pitch;zs=np.arange(-27,31)*pitch
    X,Y,Z=np.meshgrid(xs,ys,zs,indexing='ij')
    measured=raster_front(vertices,triangles,xs,ys)
    valid=np.isfinite(measured)
    landmarks=(np.array(frame['landmarks'])-origin)@basis*scale+np.array([0,eye_height,.48])
    nearest_skin=distance_transform_edt(~valid,return_distances=False,return_indices=True)
    filled=measured[tuple(nearest_skin)]
    scalp_blend=np.clip((Y[:,:,0]-eye_height-.22)/.22,0,1)
    scalp_blend=scalp_blend*scalp_blend*(3-2*scalp_blend)
    clean_scalp=gaussian_filter(median_filter(filled,size=3),1.65)
    measured=np.where(valid,filled*(1-scalp_blend)+clean_scalp*scalp_blend,np.nan)
    mouth=landmarks[[13,14]].mean(0)
    mx=X[:,:,0]-mouth[0];ratio_mouth=mx/.235
    seam=mouth[1]+.025*ratio_mouth*ratio_mouth
    dy=Y[:,:,0]-seam
    lip_width=np.maximum(0,1-ratio_mouth*ratio_mouth)
    lip_relief=lip_width*(.025*np.exp(-((dy-.032)/.025)**2)+.038*np.exp(-((dy+.038)/.028)**2)-.020*np.exp(-(dy/.013)**2))
    measured+=np.where(abs(ratio_mouth)<1,lip_relief,0)
    edited=(scalp_blend>.05)|((abs(ratio_mouth)<1)&(abs(dy)<.10))
    # Construct the jaw and cheeks from the measured silhouette, never from the old jaw.
    widths=np.full(len(ys),np.nan)
    for row,y in enumerate(ys):
        sample=vertices[(abs(vertices[:,1]-y)<pitch*.75)&(vertices[:,2]>0)]
        if len(sample)>8:widths[row]=np.quantile(abs(sample[:,0]),.995)
    known=np.isfinite(widths)
    widths=np.interp(ys,ys[known],widths[known])
    widths=gaussian_filter(median_filter(widths,size=3),1.15)
    crown=float(vertices[:,1].max());chin=float(vertices[:,1].min())
    widths*=np.sqrt(np.clip((crown-ys)/.09,0,1))
    ratio=abs(X[:,:,0])/np.maximum(widths[None,:],1e-6)
    footprint=(ratio<=1)&(Y[:,:,0]>=chin)&(Y[:,:,0]<=crown)
    nearest=distance_transform_edt(~valid,return_distances=False,return_indices=True)
    extended=measured[tuple(nearest)]
    # Only unseen side strips blend into the closed rear. Real scanned face depth is exact.
    side=np.clip((ratio-.80)/.20,0,1);side=side*side*(3-2*side)
    new_front=np.where(valid,measured,extended*(1-side)-.10*side)
    back_center=template.back(np.clip(ys+.30,template.YS[0],template.YS[-1]))
    back=-.10+(back_center[None,:]+.10)*np.sqrt(np.maximum(0,1-ratio*ratio))
    solid=footprint[:,:,None]&(Z>=back[:,:,None])&(Z<=new_front[:,:,None])
    # A narrower neck meets behind the chin instead of projecting through it.
    neck_w=np.interp(Y,[0,.15,.4,.7,1.,1.16],[.38,.38,.38,.40,.43,.40])
    neck_d=np.interp(Y,[0,.15,.4,.7,1.,1.16],[.45,.45,.36,.32,.34,.32])
    neck_center=np.interp(Y,[0,.5,1.16],[-.20,-.32,-.36])
    neck=((X/neck_w)**2+((Z-neck_center)/neck_d)**2<=1)&(Y>=0)&(Y<1.16)
    cut=.40+.28*X+.18*(Z+.30)
    solid|=neck&(Y>=cut)
    # The right ear is measured in the scan; mirror its actual relief to the missing side.
    ear_mask=(vertices[:,0]>.62)&(vertices[:,1]>1.38)&(vertices[:,1]<2.12)&(vertices[:,2]>-.48)&(vertices[:,2]<-.07)
    ear_triangles=triangles[ear_mask[triangles].all(1)]
    assert len(ear_triangles)>100, 'The scan must contain the measured right ear'
    ear_x=raster_front(vertices[:,[1,2,0]],ear_triangles,ys,zs)
    ear_valid=np.isfinite(ear_x)
    # A shallow inner backing joins the concha to the skull without a through-hole.
    solid|=ear_valid[None,:,:]&(abs(X)>.55)&(abs(X)<=np.nan_to_num(ear_x,nan=0)[None,:,:])
    weight=(valid&footprint).astype(float)
    replace=valid&footprint
    # Upper head opening removes isolated scan spikes without modifying eyelids or lips.
    scalp_clean=binary_opening(solid,structure=generate_binary_structure(3,1))
    solid=np.where(Y>eye_height+.40,scalp_clean,solid)
    solid=binary_fill_holes(solid)
    connected,components=label(solid,generate_binary_structure(3,1))
    counts=np.bincount(connected.ravel());counts[0]=0;solid=connected==counts.argmax()
    assert solid.any() and np.array_equal(binary_fill_holes(solid),solid)
    # Two voxel courses shield the inside at every recess and scan/template transition.
    core=binary_erosion(solid,structure=generate_binary_structure(3,1),iterations=2)
    outer_count=int((solid&~binary_erosion(solid,structure=generate_binary_structure(3,1))).sum())
    assert outer_count>=5704, "Visible outer skin must also double its resolution"
    shell=solid&~core
    assert np.array_equal(binary_fill_holes(shell),solid), 'Render shell leaks into the interior'
    # A slightly sparse outer fringe leaves the closed oblique cap intact behind it.
    neck_skin=neck&~binary_erosion(neck,structure=generate_binary_structure(3,1))
    edge_candidates=neck_skin&(Y<cut)&(Y>=cut-pitch*1.5)
    hashed=np.mod(np.sin(X*173.31+Y*91.17+Z*213.41)*43758.5453,1)
    neck_edge=edge_candidates&(hashed<.76)
    edge_density=float(neck_edge.sum()/max(1,edge_candidates.sum()))
    assert .60<edge_density<.90
    rendered=shell|neck_edge
    grid=np.argwhere(rendered);points=np.c_[xs[grid[:,0]],ys[grid[:,1]],zs[grid[:,2]]]
    order=np.lexsort((points[:,0],points[:,2],points[:,1]));points=points[order];grid=grid[order]
    assert 5704<=len(points)<=20000, 'Require at least twice the preceding 2,852 cubes'
    assert pitch*1.045<.07245
    sdf=gaussian_filter(distance_transform_edt(~solid)-distance_transform_edt(solid),.8)
    gradients=np.gradient(sdf)
    normals=np.array([g[tuple(grid.T)] for g in gradients]).T
    on_edge=neck_edge[tuple(grid.T)]
    neck_sdf=gaussian_filter(distance_transform_edt(~neck)-distance_transform_edt(neck),.8)
    neck_normals=np.array([g[tuple(grid.T)] for g in np.gradient(neck_sdf)]).T
    normals[on_edge]=neck_normals[on_edge]
    normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-8)
    # Continuous measured normals retain facial lighting on the discrete square fronts.
    finite=np.isfinite(new_front);index=distance_transform_edt(~finite,return_distances=False,return_indices=True)
    continuous=gaussian_filter(new_front[tuple(index)],.7)
    dx,dy=np.gradient(continuous,pitch)
    front_normals=np.stack([-dx,-dy,np.ones_like(dx)],axis=2)
    front_normals/=np.linalg.norm(front_normals,axis=2,keepdims=True)
    gx,gy,gz=grid.T
    facing=(points[:,2]>=surface_depth(solid,zs)[gx,gy]-.12)&(normals[:,2]>.1)&(weight[gx,gy]>.1)
    normals[facing]=front_normals[gx[facing],gy[facing]]
    cubes=[]
    pupils=landmarks[[468,473]]
    exposed_front=surface_depth(solid,zs)
    for i,(point,normal) in enumerate(zip(points,normals)):
        cubes.append({'id':i,'name':f'cube_{i:05d}','position':point.round(6).tolist(),'normal':normal.round(6).tolist(),'quaternion':[0,0,0,1],'region':'neck-edge' if on_edge[i] else template.region(point),'ao':1})
        cube=cubes[-1]
        if on_edge[i]:
            cube['motion']=.004
        elif point[2]>=exposed_front[grid[i,0],grid[i,1]]-.001:
            for pupil in pupils:
                if abs(point[0]-pupil[0])<.055 and abs(point[1]-pupil[1])<.034:
                    cube['feature']='iris'
                if abs(point[0]-pupil[0])<pitch*.56 and abs(point[1]-pupil[1])<pitch*.56:
                    cube['feature']='pupil'
            offset=point[1]-(mouth[1]+.025*((point[0]-mouth[0])/.235)**2)
            if abs(point[0]-mouth[0])<.23 and abs(offset)<.085:
                cube['feature']='lip-seam' if abs(offset)<.020 else 'lip'
    assert sum(c.get('feature')=='pupil' for c in cubes)==2
    assert sum(c.get('feature') in ('lip','lip-seam') for c in cubes)>10
    positions,n=template.cube_mesh(.018)
    data={'format':'voxel-portrait/1.0','name':'Owner scan in complete dense cube head','description':'Pose-aligned scan face, measured jaw and mirrored scanned ear relief, with a short obliquely cut neck.','construction':'Overlapping axis-aligned bevelled cubes on a connected lattice; two-course closed head/neck shell and a slightly sparse animated neck-cut fringe.','axis':{'up':'+Y','front':'+Z'},'count':len(cubes),'pitch':pitch,'cubeSize':round(pitch*1.045,7),'bevelRatio':.018,'bounds':{'min':(points.min(0)-pitch*1.045/2).tolist(),'max':(points.max(0)+pitch*1.045/2).tolist()},'geometry':{'positions':positions.round(7).tolist(),'normals':n.round(7).tolist()},'cubes':cubes,'validation':{'outerCubeCount':outer_count,'solidComponents':1,'renderShellClosed':True,'sourceScanVertices':len(vertices),'faceColumns':int(replace.sum()),'eyeHeight':float(eye_height),'earSamples':int(ear_valid.sum()),'neckEdgeCubes':int(on_edge.sum()),'neckEdgeDensity':edge_density,'pupilCubes':sum(c.get('feature')=='pupil' for c in cubes),'lipCubes':sum(c.get('feature') in ('lip','lip-seam') for c in cubes),'minimumPreviousCubeCount':2852}}
    # Report actual quantization error against measured triangles, not a likeness percentage.
    strong=(weight>.99)&np.isfinite(measured)&~edited
    surface=np.max(np.where(solid,Z,-np.inf),axis=2)
    error=np.abs(surface[strong]-measured[strong])
    assert len(error)>150 and np.quantile(error,.95)<=pitch*1.01
    data['validation']['faceDepth95Error']=float(np.quantile(error,.95))
    return data, {'vertices':vertices.round(7).ravel().tolist(),'indices':triangles.ravel().tolist()}


def main():
    p=argparse.ArgumentParser();p.add_argument('--template-code',type=Path,required=True);p.add_argument('--scan',type=Path,required=True);p.add_argument('--frame',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--aligned-scan',type=Path,required=True);a=p.parse_args()
    spec=importlib.util.spec_from_file_location('original_template',a.template_code);template=importlib.util.module_from_spec(spec);spec.loader.exec_module(template)
    data,aligned=build(template,json.loads(a.scan.read_text()),json.loads(a.frame.read_text()),.04)
    a.output.write_text(json.dumps(data,separators=(',',':')),encoding='utf-8');a.aligned_scan.write_text(json.dumps(aligned,separators=(',',':')),encoding='utf-8')
    print(json.dumps({'count':data['count'],'pitch':data['pitch'],'cubeSize':data['cubeSize'],**data['validation']}))

if __name__=='__main__':main()

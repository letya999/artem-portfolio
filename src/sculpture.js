import * as THREE from 'three';
export function makeSlices(texture, pixels) {
  const group = new THREE.Group();
  const photo = new THREE.MeshStandardMaterial({map:texture, roughness:.6, metalness:.1, alphaTest:.2, side:THREE.DoubleSide});
  const metal = new THREE.MeshStandardMaterial({color:0xbfc3c1, metalness:1, roughness:.22, side:THREE.DoubleSide});
  for(let i=0;i<38;i++) {
    const v = .065 + (i+.5)*.92/38, row = Math.round(v*255);
    let left=0, right=255;
    while(left<255 && pixels[(row*256+left)*4+3]<100) left++;
    while(right>left && pixels[(row*256+right)*4+3]<100) right--;
    const l=left/255, r=right/255, h=3.45*.92/38*.93;
    const p=[], uv=[], ids=[], walls=[];
    for(let y=0;y<2;y++) for(let x=0;x<=36;x++) {
      const u=l+(r-l)*x/36;
      const z=.14+.34*Math.sqrt(Math.max(0,1-((u-.49)/.5)**2));
      p.push((u-.5)*3.45,(.5-y)*h,z);
      uv.push(u,1-v+(.5-y)*h/3.45);
      if(y===0 && x<36) ids.push(x,x+37,x+1,x+1,x+37,x+38);
    }
    const outline=[...Array.from({length:37},(_,x)=>x),...Array.from({length:37},(_,x)=>73-x)];
    for(let j=0;j<outline.length;j++) {
      const a=p.slice(outline[j]*3,outline[j]*3+3), b=p.slice(outline[(j+1)%outline.length]*3,outline[(j+1)%outline.length]*3+3);
      const c=[a[0],a[1],-.22], d=[b[0],b[1],-.22];
      walls.push(...a,...c,...b,...b,...c,...d);
    }
    const front=new THREE.BufferGeometry();
    front.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
    front.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    front.setIndex(ids);front.computeVertexNormals();
    const side=new THREE.BufferGeometry(); side.setAttribute('position',new THREE.Float32BufferAttribute(walls,3));side.computeVertexNormals();
    const back=front.clone();
    for(let j=0;j<back.attributes.position.count;j++) back.attributes.position.setZ(j,-.22);
    back.computeVertexNormals();
    const layer=new THREE.Group();
    layer.add(new THREE.Mesh(front,photo),new THREE.Mesh(side,metal),new THREE.Mesh(back,metal));
    layer.position.y=(.5-v)*3.45;group.add(layer);
  }
  return group;
}

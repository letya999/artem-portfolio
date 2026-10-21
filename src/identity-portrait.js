import * as THREE from 'three';

export function makeIdentityPortrait(data) {
  if(data?.format !== 'portrait-tiles/1' || !Array.isArray(data.bands) || !data.bands.length || data.bands.length>100 || !Number.isFinite(data.height)) throw new Error('Invalid portrait surface');
  let count=0;
  for(const band of data.bands) {
    if(!Number.isFinite(band.y) || !Array.isArray(band.quads)) throw new Error('Invalid portrait band');
    for(const quad of band.quads) {
      if(!Array.isArray(quad)||quad.length!==12||!quad.every(Number.isFinite))throw new Error('Invalid portrait tile');
      if(++count>12000)throw new Error('Portrait exceeds geometry budget');
    }
  }
  if(count!==data.tileCount)throw new Error('Portrait tile count mismatch');
  const group=new THREE.Group();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,metalness:1,roughness:.36});
  const expression={value:new THREE.Vector2()};
  material.onBeforeCompile=shader=>{
    shader.uniforms.portraitLook=expression;
    shader.vertexShader='attribute vec2 portraitFeature; uniform vec2 portraitLook;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      transformed.x += portraitFeature.x * portraitLook.x * 0.012;
      transformed.y += portraitFeature.y * portraitLook.y * 0.016;`);
  };
  group.userData.expression=expression;
  let seed=0;
  for(const band of data.bands) {
    const positions=[],colors=[],features=[];
    let feature=[0,0];
    const tri=(a,b,c,shade)=>{for(const v of [a,b,c]){positions.push(v.x,v.y-band.y,v.z);colors.push(shade,shade,shade);features.push(...feature);}};
    for(const values of band.quads) {
      const q=Array.from({length:4},(_,i)=>new THREE.Vector3().fromArray(values,i*3));
      const center=q.reduce((sum,v)=>sum.add(v),new THREE.Vector3()).multiplyScalar(.25);
      const faceY=center.y-data.height/2;
      const front=Math.max(0,Math.min(1,(center.z-.10)*5));
      const eye=Math.exp(-1*((Math.abs(center.x)-.30)/.17)**2-((faceY-.40)/.12)**2)*front;
      const brow=Math.exp(-1*((Math.abs(center.x)-.30)/.22)**2-((faceY-.56)/.10)**2)*front;
      feature=[eye,brow];
      const normal=new THREE.Vector3().subVectors(q[1],q[0]).cross(new THREE.Vector3().subVectors(q[3],q[0])).normalize();
      const top=q.map(v=>v.clone().sub(center).multiplyScalar(.93).add(center).addScaledVector(normal,.002));
      const rim=q.map(v=>v.clone().addScaledVector(normal,-.002));
      const bottom=q.map(v=>v.clone().addScaledVector(normal,-.045));
      const shade=.65+.07*Math.sin(seed++*12.9898);
      tri(top[0],top[1],top[2],shade);tri(top[0],top[2],top[3],shade);
      for(let k=0;k<4;k++) {
        const j=(k+1)%4;
        tri(top[k],rim[k],rim[j],shade);tri(top[k],rim[j],top[j],shade);
        tri(rim[k],bottom[k],bottom[j],shade);tri(rim[k],bottom[j],rim[j],shade);
      }
      tri(bottom[2],bottom[1],bottom[0],shade);tri(bottom[3],bottom[2],bottom[0],shade);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('portraitFeature',new THREE.Float32BufferAttribute(features,2));
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    const layer=new THREE.Mesh(geometry,material);
    layer.position.y=band.y-data.height/2;
    layer.userData.restY=layer.position.y;
    layer.castShadow=layer.receiveShadow=true;
    group.add(layer);
  }
  group.userData.tileCount=count;
  return group;
}

import * as THREE from 'three';

const profile = [[0,.54],[.14,.64],[.5,.72],[.95,.68],[1.35,.55],[1.7,.46],[2,.44],[2.3,.32],[2.48,.02]];
function radiusAt(y) {
  const i = Math.max(1, profile.findIndex(point => point[0] >= y));
  const [a,b] = [profile[i-1],profile[i]];
  return THREE.MathUtils.lerp(a[1],b[1],THREE.MathUtils.smoothstep(y,a[0],b[0]));
}
function enamel(x,y,z,radius) {
  const front = z > radius*.55;
  if (front && (x/.30)**2+((y-1.98)/.34)**2 < 1) {
    if (Math.abs(Math.abs(x)-.12)<.045 && Math.abs(y-2.03)<.045) return 0x263d46;
    if (Math.abs(x)<.07 && Math.abs(y-1.80)<.035) return 0xa85c50;
    if (y>2.18) return 0x9d885e;
    return 0xe4d5b6;
  }
  if (Math.abs(y-1.0)<.055 || y<.10) return 0xb3a16e;
  if (front && y<1.35 && Math.abs(x)<.47) {
    for (const [fx,fy] of [[-.24,.46],[.24,.46],[0,.88]]) {
      const dx=x-fx,dy=y-fy,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
      if (d<.045) return 0xd5bd78;
      if (d<.11+.035*Math.cos(a*5)) return 0xb8c77f;
    }
    return 0x677a67;
  }
  return 0x35474a;
}

export function makeMatryoshkas(cubeGeometry) {
  const shell = [];
  for (let row=0;row<38;row++) {
    const y=.035+row*.065,radius=radiusAt(y),cells=Math.max(8,Math.round(2*Math.PI*radius/.065));
    for (let cell=0;cell<cells;cell++) {
      const angle=cell/cells*Math.PI*2,x=Math.sin(angle)*radius,z=Math.cos(angle)*radius;
      shell.push({x,y,z,upper:y>1,color:enamel(x,y,z,radius)});
    }
  }
  // A second course makes the open bowl and lid visibly hollow at the seam.
  for (const y of [.945,1.01]) for(let cell=0;cell<60;cell++) {
    const a=cell/60*Math.PI*2,r=radiusAt(y)-.065;
    shell.push({x:Math.sin(a)*r,y,z:Math.cos(a)*r,upper:y>1,color:0x96855e});
  }
  for(let x=-.48;x<=.48;x+=.065) for(let z=-.48;z<=.48;z+=.065) {
    if(Math.hypot(x,z)<.48) shell.push({x,y:.02,z,upper:false,color:0xb3a16e});
  }
  const geometry=cubeGeometry.clone(),count=shell.length*6;
  const parts=new Float32Array(count*2),lifts=new Float32Array(count*4),localPoints=new Float32Array(count*3);
  geometry.setAttribute('dollPart',new THREE.InstancedBufferAttribute(parts,2));
  geometry.setAttribute('dollLift',new THREE.InstancedBufferAttribute(lifts,4));
  geometry.setAttribute('dollLocal',new THREE.InstancedBufferAttribute(localPoints,3));
  const dollOpen={value:new Float32Array(6)},flow={value:0};
  const stage={value:0},innerScale={value:.66},transferSpread={value:.75};
  const centers={value:Array.from({length:6},()=>new THREE.Vector3())},sizes={value:new Float32Array(6)};
  const orientation={value:new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(.07,-.24,0)))};
  const material=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.78,roughness:.30,envMapIntensity:1.1,alphaHash:true});
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{dollOpen,dollFlow:flow,dollStage:stage,innerScale,transferSpread,dollCenters:centers,dollSizes:sizes,dollOrientation:orientation});
    shader.vertexShader=`attribute vec2 dollPart; attribute vec3 dollLocal; uniform float dollOpen[6]; uniform float dollFlow,dollStage,innerScale,transferSpread; uniform vec3 dollCenters[6]; uniform float dollSizes[6]; uniform mat3 dollOrientation; varying float vDollVisibility;
      mat3 capRotation(float opening){float a=opening*1.57079632679;return mat3(cos(a),sin(a),0.,-sin(a),cos(a),0.,0.,0.,1.);}
      float capOpening(){float parent=min(5.,floor(dollStage+.0001));float t=clamp(dollStage-parent,0.,1.);return dollOpen[int(dollPart.x)]*dollPart.y*(abs(dollPart.x-parent)<.1?1.:smoothstep(.75,1.,t));}
    `+shader.vertexShader;
    shader.fragmentShader='varying float vDollVisibility;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n if(vDollVisibility<.005)discard; diffuseColor.a*=vDollVisibility;');
    shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n objectNormal=capRotation(capOpening())*objectNormal;');
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
      int group=int(dollPart.x),parent=int(min(5.,floor(dollStage+.0001)));
      float t=clamp(dollStage-float(parent),0.,1.);
      float opening=capOpening();
      vec3 local=dollLocal+transformed*.066;
      if(dollPart.y>.5){
        vec3 pivot=vec3(0.,.5,0.);
        vec3 resting=mix(pivot,vec3(-1.55,-.55,.06),opening);
        resting.y+=sin(opening*3.14159265359)*.6;
        local=capRotation(opening)*(local-pivot)+resting;
      }
      vec3 center=dollCenters[group];float size=dollSizes[group];
      vDollVisibility=0.;
      if(group==parent)vDollVisibility=1.-smoothstep(.6,.95,t);
      if(group==parent+1){
        float travel=smoothstep(.08,.94,t),flight=sin(travel*3.14159265359);
        vec3 nested=dollCenters[parent]+dollOrientation*vec3(0.,-.40,0.)*dollSizes[parent];
        center=mix(nested,center,travel);
        size=mix(dollSizes[parent]*innerScale,size,travel);
        float jump=min(1.,max(0.,dollCenters[parent].y-dollCenters[group].y)*.45+dollSizes[parent]*1.3);
        center.y+=jump*flight;
        float seed=fract(sin(dot(dollLocal,vec3(12.9898,78.233,37.719)))*43758.5453);
        local+=vec3(sin(seed*42.),cos(seed*27.),sin(seed*17.))*flight*transferSpread;
        vDollVisibility=max(smoothstep(.03,.3,dollOpen[parent]),smoothstep(0.,.1,travel));
      }
      vDollVisibility*=smoothstep(0.,.12,dollFlow);
      vec3 position=center+dollOrientation*local*size*smoothstep(.02,.3,dollFlow);
      vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
      gl_Position=projectionMatrix*mvPosition;
    `);
  };
  const mesh=new THREE.InstancedMesh(geometry,material,count);
  mesh.frustumCulled=false;mesh.visible=false;
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),center=new THREE.Vector3(),scale=new THREE.Vector3(),rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(.07,-.24,0)),color=new THREE.Color();
  for(let group=0;group<6;group++) for(let j=0;j<shell.length;j++) {
    const i=group*shell.length+j,p=shell[j];
    parts.set([group,p.upper?1:0],i*2);
    localPoints.set([p.x,p.y-1.24,p.z],i*3);
    mesh.setColorAt(i,color.setHex(p.color));
  }
  let arranged;
  mesh.userData.layout=rows=>{
    const delta=arranged ? rows[0].y-arranged[0].y : 0;
    if(arranged && rows.every((row,i)=>Math.abs(row.x-arranged[i].x)<1e-6 && Math.abs(row.y-arranged[i].y-delta)<1e-6 && row.width===arranged[i].width && row.height===arranged[i].height)) {
      mesh.position.y=delta;
      return;
    }
    arranged=rows.map(row=>({...row}));
    mesh.position.y=0;
    mesh.userData.rows=rows;
    rows.forEach((row,group)=>{
      const size=Math.min(row.width*.90/3.2,row.height*.90/2.8)*(1-group*.105);
      row.scale=size;center.set(row.x,row.y-.075,0);
      centers.value[group].copy(center);sizes.value[group]=size;
      for(let j=0;j<shell.length;j++) {
        const i=group*shell.length+j,p=shell[j];
        position.set(p.x,p.y-1.24,p.z).applyQuaternion(rotation).multiplyScalar(size).add(center);
        matrix.compose(position,rotation,scale.setScalar(.066*size));mesh.setMatrixAt(i,matrix);
        lifts.set([size,...center],i*4);
      }
    });
    mesh.instanceMatrix.needsUpdate=true;geometry.attributes.dollLift.needsUpdate=true;
  };
  Object.assign(mesh.userData,{dollOpen,flow,stage,innerScale,transferSpread,centers,sizes,active:0});
  return mesh;
}

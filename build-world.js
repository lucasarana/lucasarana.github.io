import * as THREE from 'three';
import {addIdentity} from './landmarks.js?v=7';
import {batchStaticBoxes} from './batch-static.js?v=7';

export const locations = [
 {id:'us',name:'UNITED STATES',sub:'THE NEXT OPPORTUNITY',color:0xffc780,x:1,y:1,z:-15,r:6.3},
 {id:'mexico',name:'MÉXICO',sub:'BUILD WITH AMBITION',color:0xffa776,x:-15,y:-1,z:1,r:4.5},
 {id:'brasil',name:'BRASIL',sub:'HUMAN CONNECTION',color:0x96e8aa,x:15,y:0,z:7,r:5},
 {id:'buenosaires',name:'BUENOS AIRES',sub:'WHERE IT ALL BEGINS',color:0xb4adff,x:-2,y:1.5,z:17,r:4.9},
 {id:'nexton',name:'NEXTON',sub:'THE CONNECTION ENGINE',color:0x72ead8,x:0,y:2,z:1,r:3.4}
];

export function buildWorld(scene){
 const islands=[],routes=[],floating=[],clouds=[],cars=[],windmills=[],lights=[],pickables=[],flags=[];
 let seed=6321;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
 const materials=new Map();
 function material(color,extra={}){const key=color+'|'+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.8,flatShading:true,...extra}));return materials.get(key);}
 const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.IcosahedronGeometry(1,1),rockGeo=new THREE.DodecahedronGeometry(1,0);
 function add(parent,geometry,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(p,x,y,z,w,h,d,c,extra){const m=add(p,boxGeo,material(c,extra),x,y,z);m.scale.set(w,h,d);return m;}
 function sphere(p,x,y,z,s,c){const m=add(p,sphereGeo,material(c),x,y,z);m.scale.setScalar(s);return m;}
 function cylinder(p,x,y,z,r1,r2,h,c,n=12,extra){return add(p,new THREE.CylinderGeometry(r1,r2,h,n),material(c,extra),x,y,z);}
 function glow(p,x,y,z,r,color){const m=add(p,new THREE.SphereGeometry(r,10,8),material(color,{emissive:color,emissiveIntensity:3.1,roughness:.2}),x,y,z);m.castShadow=false;return m;}
 function ring(p,x,y,z,r,c,thickness=.035){const m=add(p,new THREE.TorusGeometry(r,thickness,12,128),material(c,{emissive:c,emissiveIntensity:2}),x,y,z);m.rotation.x=Math.PI/2;m.castShadow=false;return m;}
 function tree(p,x,z,s=1,c=0x52a28d){cylinder(p,x,.65*s,z,.09*s,.15*s,1.3*s,0x644b41,5);const a=sphere(p,x,1.55*s,z,.73*s,c);a.scale.y=1.15;const b=sphere(p,x+.36*s,1.2*s,z+.1*s,.55*s,c);return a;}
 function palm(p,x,z,s=1){const trunk=cylinder(p,x,.85*s,z,.08*s,.13*s,1.7*s,0x847657,6);trunk.rotation.z=.12;for(let n=0;n<7;n++){const a=n/7*Math.PI*2;const leaf=add(p,new THREE.ConeGeometry(.25*s,1.45*s,3),material(0x53a88f),x+Math.sin(a)*.48*s,1.8*s,z+Math.cos(a)*.48*s);leaf.rotation.set(Math.cos(a)*1.1,a,Math.sin(a)*1.1);}}
 function tinyHuman(p,x,z,c=0xffc780){cylinder(p,x,.27,z,.09,.11,.35,c,7);sphere(p,x,.52,z,.12,0xf4d0aa);box(p,x-.06,.07,z,.07,.18,.08,0x223c52);box(p,x+.06,.07,z,.07,.18,.08,0x223c52);}
 function bench(p,x,z,rot=0){const b=new THREE.Group();b.position.set(x,0,z);b.rotation.y=rot;p.add(b);box(b,0,.22,0,.65,.09,.24,0xe5bc8b);box(b,0,.43,.13,.65,.29,.05,0xdeaa77);box(b,-.22,.12,0,.04,.22,.2,0x33454b);box(b,.22,.12,0,.04,.22,.2,0x33454b);}
 function platform(loc){
  const group=new THREE.Group();group.position.set(loc.x,loc.y,loc.z);scene.add(group);loc.group=group;loc.baseY=loc.y;
  const stone=loc.id==='mexico'?0x7b6263:0x466278;
  const cap=cylinder(group,0,-.36,0,loc.r,loc.r*.96,.72,loc.id==='us'?0x789199:loc.id==='nexton'?0x618f94:loc.id==='mexico'?0xcd8b66:0x659c8b,11);cap.rotation.y=.12;
  cylinder(group,0,-1.02,0,loc.r*.97,loc.r*.8,.8,stone,11);
  cylinder(group,0,-2.55,0,loc.r*.81,loc.r*.54,2.35,0x334e69,9);
  cylinder(group,-.5,-4.45,.15,loc.r*.57,.1,2.4,0x263e57,7).rotation.z=.12;
  for(let j=0;j<9;j++){let a=j/9*Math.PI*2;const m=add(group,rockGeo,material(j%2?0x57728a:0x3e5671),Math.sin(a)*loc.r*.78,-1.35-rand()*1.8,Math.cos(a)*loc.r*.78);m.scale.set(.9+rand(),1.1+rand()*1.9,.9+rand());m.rotation.set(rand(),rand(),rand());}
  for(let j=0;j<5;j++){const a=rand()*Math.PI*2;const m=add(group,rockGeo,material(0x527c85),Math.sin(a)*(loc.r+.7+rand()),-3.5-rand()*2.7,Math.cos(a)*(loc.r+.7));m.scale.setScalar(.2+rand()*.48);m.rotation.set(rand(),rand(),rand());floating.push({mesh:m,y:m.position.y,phase:rand()*6,speed:.5+rand()});}
  const hit=add(group,new THREE.CylinderGeometry(loc.r,loc.r,1.8,11),new THREE.MeshBasicMaterial({visible:false}),0,.5,0);hit.userData.station=loc.id;pickables.push(hit);
  const pad=cylinder(group,0,.07,loc.r*.47,.75,.9,.15,0x244451,32);const rr=ring(group,0,.18,loc.r*.47,.63,loc.color,.026);loc.pad=new THREE.Vector3(loc.x,loc.y+1.25,loc.z+loc.r*.47);
  const crystal=add(group,new THREE.OctahedronGeometry(.25),material(loc.color,{emissive:loc.color,emissiveIntensity:2.7,metalness:.2,roughness:.15}),0,1.3,loc.r*.47);loc.beacon=crystal;loc.padRing=rr;
  for(let n=0;n<4;n++){const a=n*Math.PI/2;cylinder(group,Math.cos(a)*loc.r*.86,.3,Math.sin(a)*loc.r*.86,.04,.05,.6,0x415e68,5);glow(group,Math.cos(a)*loc.r*.86,.63,Math.sin(a)*loc.r*.86,.07,loc.color);}
  islands.push(loc);return group;
 }
 function building(p,x,z,w,d,h,c){
  box(p,x,h/2,z,w,h,d,c,{roughness:.5,metalness:.17});box(p,x,h+.08,z,w+.06,.15,d+.06,0xb0c0ba);
  for(let level=.45;level<h-.1;level+=.55){for(let xx=-w/2+.22;xx<w/2-.08;xx+=.34){if(rand()>.15)box(p,x+xx,level,z+d/2+.012,.13,.2,.023,0xffde99,{emissive:0xffd27c,emissiveIntensity:rand()> .65?1.8:.55,roughness:.6});}for(let zz=-d/2+.22;zz<d/2-.1;zz+=.34){if(rand()>.25)box(p,x+w/2+.012,level,z+zz,.022,.2,.13,0xc1f2e8,{emissive:0x6bdacd,emissiveIntensity:.55});}}
  return h;
 }
 for(const loc of locations){const p=platform(loc);
  if(loc.id==='us'){
   box(p,0,.025,-.1,10.5,.025,1.05,0x354f61);box(p,.55,.027,-.3,.75,.03,8.8,0x354f61);
   for(let n=-4;n<5;n++){box(p,n,.045,0,.35,.025,.035,0xffd7a0);box(p,.5,.045,n,.035,.025,.28,0xffd7a0);}
   const buildings=[[-3,-2,1.4,1.3,3.8,0x738fa3],[-1.3,-2.8,1.4,1.7,6.4,0x648898],[1.5,-2.5,1.6,1.5,4.6,0x7797a5],[3.2,-1.1,1.2,1.3,3.3,0x9a9c9c],[-3,1.6,1.4,1.3,2.1,0xa78f80],[2.3,1.5,1.6,1.5,2.8,0x849ea2],[-.8,-4.2,1,1,3.1,0x7c8eb0]];
   buildings.forEach(v=>building(p,...v));
   box(p,-1.3,6.65,-2.8,.7,.4,.85,0x567687);cylinder(p,-1.3,7.6,-2.8,.027,.047,1.55,0xcbdfcd,6);glow(p,-1.3,8.4,-2.8,.065,0xffb27b);
   for(let n=0;n<9;n++){const a=n/9*Math.PI*2;tree(p,Math.cos(a)*5.1,Math.sin(a)*4.6,.55,0xc5ac66);}
   for(let n=0;n<4;n++){const car=new THREE.Group();box(car,0,.15,0,.46,.24,.23,n%2?0xfbc877:0x79c4bc);box(car,.03,.32,0,.25,.13,.21,0x385767);p.add(car);cars.push({mesh:car,start:-4,end:4,lane:n%2?.3:-.3,speed:.2+rand()*.2,offset:n/4});}
   box(p,3.2,.07,-3.8,1.2,.09,1.4,0xc5b186);for(let n=0;n<3;n++)box(p,3.2,.13,-4.2+n*.4,.8,.06,.22,0x405b6a);
  }else if(loc.id==='buenosaires'){
   box(p,0,.04,-.5,1.4,.04,6.2,0x496276);box(p,0,.06,-.5,.4,.04,6.2,0x759c83);box(p,0,.055,-1,6.7,.03,.9,0x496276);
   for(let k=-3;k<3;k++){box(p,-.47,.077,k,.045,.02,.3,0xd1d4b3);box(p,.47,.077,k,.045,.02,.3,0xd1d4b3);}
   box(p,0,.3,-1.1,.82,.55,.82,0xd1d8cc);box(p,0,1.83,-1.1,.34,2.8,.34,0xf0ead2);add(p,new THREE.ConeGeometry(.245,.42,4),material(0xf5ebcf),0,3.45,-1.1).rotation.y=Math.PI/4;
   [[-2.2,.2,0xa6b8ad],[2,-2.3,0x8c9daf]].forEach(([x,z,c])=>{building(p,x,z,1,1.1,1.1+rand()*.9,c);box(p,x,2,z,1.16,.1,1.26,0xeee0b9);});
   for(let n=0;n<9;n++){let a=n/9*Math.PI*2;tree(p,Math.cos(a)*3.8,Math.sin(a)*3.45,.6+(n%2)*.18,0xa695c6);}
   bench(p,-1.4,1.3,.2);bench(p,1.6,1.2,-.3);tinyHuman(p,-.9,.2,0xf2b06e);tinyHuman(p,1.1,.5,0x9fe9d5);tinyHuman(p,-1.8,1.4,0xb7bbef);
   const mate=cylinder(p,3,.3,1.2,.18,.14,.43,0x655944,10);cylinder(p,3.06,.7,1.2,.018,.018,.45,0xe8d6b0,6).rotation.z=-.18;
  }else if(loc.id==='brasil'){
   const mountain=add(p,sphereGeo,material(0x467769),-1.4,1.2,-1.7);mountain.scale.set(1.65,2.8,1.55);
   const peak=add(p,sphereGeo,material(0x628e74),.7,1.0,-2);peak.scale.set(1.3,2.1,1.3);
   const beach=add(p,new THREE.CircleGeometry(2.3,32),material(0xe7c99e),1,.05,1.1);beach.rotation.x=-Math.PI/2;beach.scale.set(1.15,.62,1);
   for(let n=0;n<5;n++){const x=-3.1+n*1.3,z=.1+Math.sin(n)*.6;box(p,x,.5,z,.7,1,.68,[0xeac597,0xe7a496,0x89c7b3,0xf5d989,0x95a5cf][n]);box(p,x,1.07,z,.82,.14,.79,0xdfa080);box(p,x,.57,z+.348,.18,.3,.015,0x466d78);}
   for(let n=0;n<7;n++){let a=n/7*Math.PI*2;palm(p,Math.cos(a)*4,Math.sin(a)*3.8,.65+rand()*.2);}
   for(let n=0;n<3;n++){const x=-1+n*1.15;add(p,new THREE.ConeGeometry(.38,.15,12),material(n%2?0x80d4c2:0xfba784),x,1.0,2.4);cylinder(p,x,.5,2.4,.024,.024,.95,0xece1bc,6);}
   tinyHuman(p,1.7,1.6,0xf6aa77);tinyHuman(p,-.2,.8,0xf3db9a);
  }else if(loc.id==='mexico'){
   [[-2.3,1.3,0xd69e82],[1.7,-1.5,0xf0c67e],[2,.5,0xcbafcf],[-2.5,-1.2,0x7aafa2]].forEach(([x,z,c],i)=>{box(p,x,.6,z,.85,1.2,.8,c);box(p,x,1.26,z,1,.16,.95,0xd88e6b);box(p,x,.52,z+.408,.23,.45,.02,0x577281);});
   for(let n=0;n<6;n++){const a=n/6*Math.PI*2,x=Math.cos(a)*3.5,z=Math.sin(a)*3.5,s=.75+rand()*.5;cylinder(p,x,.65*s,z,.15,.18,1.3*s,0x648d69,7);sphere(p,x,1.28*s,z,.15,0x648d69);box(p,x+.25,.7*s,z,.4,.13,.15,0x648d69);cylinder(p,x+.42,.95*s,z,.095,.12,.55*s,0x648d69,6);}
   const poles=[];for(let n=0;n<2;n++){cylinder(p,-2.5+n*5,1.2,2,.04,.04,2.4,0x8b7168,6);poles.push(new THREE.Vector3(-2.5+n*5,2.4,2));}const wire=new THREE.Line(new THREE.BufferGeometry().setFromPoints(poles),new THREE.LineBasicMaterial({color:0xf0d4a1}));p.add(wire);for(let n=0;n<8;n++){const flag=add(p,new THREE.PlaneGeometry(.32,.24),material([0xffb783,0x9ad9cb,0xc7b0e8][n%3],{side:THREE.DoubleSide}),-2.1+n*.6,2.25,2);flag.rotation.z=.1;}
   tinyHuman(p,1,1.3,0xa1d5d0);
  }else{
   cylinder(p,0,.15,-.1,2.7,2.85,.25,0x265562,64,{metalness:.5,roughness:.35});ring(p,0,.33,-.1,2.5,0x8df9d5,.05);ring(p,0,.36,-.1,1.75,0xa5f8db,.025);
   const core=add(p,new THREE.OctahedronGeometry(.83),material(0xb9ffe6,{emissive:0x2fcab0,emissiveIntensity:1.7,metalness:.55,roughness:.2}),0,2,-.3);lights.push({mesh:core,kind:'core'});
   const arch1=ring(p,0,1.8,-.3,1.6,0x85ebd7,.055);arch1.rotation.set(Math.PI/2.8,0,.4);lights.push({mesh:arch1,kind:'ring'});
   const arch2=ring(p,0,1.8,-.3,1.65,0x6ad7d6,.024);arch2.rotation.set(.1,.3,1.2);lights.push({mesh:arch2,kind:'ring2'});
   for(let n=0;n<4;n++){const a=n/4*Math.PI*2;cylinder(p,Math.sin(a)*2.9,.8,Math.cos(a)*2.9,.15,.3,1.7,0x5b9d9c,6);glow(p,Math.sin(a)*2.9,1.73,Math.cos(a)*2.9,.1,0x8df5d0);}
  }
  addIdentity(p,loc.id,{box,sphere,cylinder,material,add,ring},flags);
  if(loc.id==='brasil'||loc.id==='buenosaires'){
   const x=loc.r*.9,z=-.5;
   const waterfall=add(p,new THREE.PlaneGeometry(.55,6.2,1,12),new THREE.MeshBasicMaterial({color:0x85e6de,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false}),x,-3,z);waterfall.rotation.y=.7;
   for(let n=0;n<12;n++){const d=glow(p,x+(rand()-.5)*.5,-rand()*6,z+(rand()-.5)*.15,.023+rand()*.035,0x8ee8e2);floating.push({mesh:d,y:0,phase:rand()*6,speed:.7+rand(),water:true});}
  }
 }
 const hub=locations.find(x=>x.id==='nexton');
 for(const loc of locations.filter(x=>x.id!=='nexton')){
  const a=new THREE.Vector3(loc.x,loc.y+.4,loc.z),b=new THREE.Vector3(hub.x,hub.y+.4,hub.z),mid=a.clone().lerp(b,.5);mid.y+=4;
  const curve=new THREE.QuadraticBezierCurve3(a,mid,b);
  const routeMaterial=new THREE.MeshBasicMaterial({color:loc.color,transparent:true,opacity:.14,depthWrite:false});
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,50,.024,5,false),routeMaterial);scene.add(tube);
  const pts=curve.getPoints(80);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineDashedMaterial({color:loc.color,dashSize:.12,gapSize:.25,transparent:true,opacity:.45}));line.computeLineDistances();scene.add(line);
  const sparks=[];for(let n=0;n<4;n++){const spark=glow(scene,0,0,0,.052,loc.color);sparks.push(spark);}
  routes.push({id:loc.id,curve,tube,line,sparks,active:false});
 }
 // A field of distant fragments and soft clouds creates depth without blocking the islands.
 for(let i=0;i<36;i++){const a=rand()*Math.PI*2,r=27+rand()*31;const g=new THREE.Group();g.position.set(Math.cos(a)*r,-7-rand()*9,Math.sin(a)*r);scene.add(g);const mat=new THREE.MeshStandardMaterial({color:0xa1c5c6,roughness:1,transparent:true,opacity:.055,flatShading:true,depthWrite:false});for(let j=0;j<3;j++){const m=add(g,sphereGeo,mat,j*1.9,rand(),rand());m.scale.set(2.3,1.2,1.7);}clouds.push({mesh:g,x:g.position.x,phase:rand()*10});}
 for(let i=0;i<28;i++){const a=rand()*Math.PI*2,r=23+rand()*17;const m=add(scene,rockGeo,material(0x3b7181),Math.cos(a)*r,-5-rand()*10,Math.sin(a)*r);m.scale.setScalar(.1+rand()*.65);floating.push({mesh:m,y:m.position.y,phase:rand()*7,speed:.4});}
 const particleCount=210,positions=new Float32Array(particleCount*3);for(let i=0;i<particleCount;i++){positions[i*3]=(rand()-.5)*100;positions[i*3+1]=(rand()-.5)*50;positions[i*3+2]=(rand()-.5)*100;}const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(positions,3));const particles=new THREE.Points(pg,new THREE.PointsMaterial({color:0xa9ece0,size:.065,transparent:true,opacity:.65,depthWrite:false}));scene.add(particles);
 const ship=new THREE.Group();ship.scale.setScalar(1.4);scene.add(ship);
 const hull=add(ship,new THREE.SphereGeometry(1,32,20),material(0xdfece3,{metalness:.6,roughness:.35,flatShading:false}));hull.scale.set(.28,.17,.59);
 const cockpit=add(ship,new THREE.SphereGeometry(1,32,20),material(0x436979,{emissive:0x29628a,emissiveIntensity:.45,metalness:.7,roughness:.1,flatShading:false}),0,.13,-.1);cockpit.scale.set(.19,.14,.28);
 const wingShape=new THREE.Shape();wingShape.moveTo(-.65,.23);wingShape.lineTo(0,-.25);wingShape.lineTo(.65,.23);wingShape.lineTo(.55,.45);wingShape.lineTo(0,.18);wingShape.lineTo(-.55,.45);wingShape.closePath();const wings=add(ship,new THREE.ExtrudeGeometry(wingShape,{depth:.055,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:1,steps:1}),material(0x7ca4a9,{metalness:.5,roughness:.35}),0,-.02,0);wings.rotation.x=Math.PI/2;
 box(ship,0,.27,.34,.05,.35,.2,0xffc786);glow(ship,-.44,-.06,.27,.045,0xffd68d);glow(ship,.44,-.06,.27,.045,0xffd68d);
 const exhaust=add(ship,new THREE.ConeGeometry(.13,.7,9),new THREE.MeshBasicMaterial({color:0x9fffe3,transparent:true,opacity:.75,depthWrite:false}),0,-.015,.73);exhaust.rotation.x=Math.PI/2;
 const shipLight=new THREE.PointLight(0xa5ffe6,3,4);ship.add(shipLight);
 const shadow=add(scene,new THREE.CircleGeometry(.42,24),new THREE.MeshBasicMaterial({color:0x092539,transparent:true,opacity:.35,depthWrite:false}),0,0,0);shadow.rotation.x=-Math.PI/2;
 ship.position.copy(hub.pad);ship.position.y+=1.3;
 const trail=[];for(let i=0;i<24;i++){const m=glow(scene,0,0,0,.026,0xbfffdc);m.visible=false;trail.push(m);}
 const graphicsStats=batchStaticBoxes(islands.map(loc=>loc.group),boxGeo,cars.map(car=>car.mesh));
 function update(time,dt,reduced){
  const t=reduced?0:time;
  flags.forEach((flag,i)=>{const a=flag.geometry.attributes.position;for(let n=0;n<a.count;n++){const x=a.getX(n);a.setZ(n,Math.sin(x*3.5-t*2.7+i)*.14*(x+1.125)/2.25);}a.needsUpdate=true;flag.geometry.computeVertexNormals();});
  islands.forEach((loc,i)=>{loc.group.position.y=loc.baseY+Math.sin(t*.65+i)*.13;loc.beacon.rotation.y=t*.9;loc.beacon.position.y=1.25+Math.sin(t*2+i)*.13;loc.padRing.material.emissiveIntensity=1.6+Math.sin(t*2+i)*.5;});
  floating.forEach(o=>{if(o.water){o.mesh.position.y=-(t*o.speed+o.phase)%6;o.mesh.material.opacity=.6;}else{o.mesh.position.y=o.y+Math.sin(t*.7+o.phase)*.22;o.mesh.rotation.y+=dt*.1;}});
  clouds.forEach(o=>o.mesh.position.x=o.x+Math.sin(t*.04+o.phase)*2);
  cars.forEach(o=>{const f=(t*o.speed*.2+o.offset)%1;o.mesh.position.set(o.start+(o.end-o.start)*f,0,o.lane);});
  lights.forEach(o=>{if(o.kind==='core'){o.mesh.rotation.y=t*.45;o.mesh.position.y=2+Math.sin(t)*.13;}else{o.mesh.rotation.z+=reduced?0:dt*(o.kind==='ring'?.15:-.12);}});
  routes.forEach((r,i)=>r.sparks.forEach((m,j)=>{const f=(t*.1+j/4+i*.2)%1;m.position.copy(r.curve.getPoint(f));m.scale.setScalar(r.active?1.65:.65);m.material.emissiveIntensity=r.active?5:2;}));
  particles.rotation.y=t*.007;exhaust.scale.y=.75+Math.sin(time*31)*.2;shadow.position.set(ship.position.x,ship.position.y-.9,ship.position.z);
 }
 return {islands,routes,ship,trail,shadow,pickables,update,materials,hub,graphicsStats};
}

import * as THREE from 'three';

// Deliberately oversized landmarks remain legible from the world camera.
export function addIdentity(p,id,kit,flags){
 const {box,sphere,cylinder,material,add,ring}=kit;
 const group=(x,y,z,s=1)=>{const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(s);p.add(g);return g;};
 function beam(parent,a,b,r,color){const v=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const m=cylinder(parent,0,0,0,r,r,v.length(),color,8);m.position.copy(new THREE.Vector3(...a).addScaledVector(v,.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
 function flag(x,z,country){
  const g=group(x,0,z);cylinder(g,0,2.1,0,.035,.055,4.2,0xe5d7af,8);sphere(g,0,4.25,0,.075,0xffe6a9);
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=150;const c=canvas.getContext('2d');
  if(country==='ar'){c.fillStyle='#78c6f0';c.fillRect(0,0,240,150);c.fillStyle='#fff9e9';c.fillRect(0,50,240,50);c.fillStyle='#edb436';c.beginPath();c.arc(120,75,12,0,Math.PI*2);c.fill();for(let i=0;i<16;i++){const a=i*Math.PI/8;c.beginPath();c.moveTo(120+Math.cos(a)*15,75+Math.sin(a)*15);c.lineTo(120+Math.cos(a)*23,75+Math.sin(a)*23);c.strokeStyle='#edb436';c.lineWidth=2;c.stroke();}}
  if(country==='mx'){c.fillStyle='#087c4f';c.fillRect(0,0,80,150);c.fillStyle='#fff9e9';c.fillRect(80,0,80,150);c.fillStyle='#d64243';c.fillRect(160,0,80,150);c.fillStyle='#94723b';c.beginPath();c.ellipse(120,78,15,20,-.3,0,Math.PI*2);c.fill();c.strokeStyle='#298052';c.lineWidth=5;c.beginPath();c.arc(120,80,24,.2,Math.PI-.2);c.stroke();}
  if(country==='br'){c.fillStyle='#19974c';c.fillRect(0,0,240,150);c.fillStyle='#ffdc35';c.beginPath();c.moveTo(120,14);c.lineTo(218,75);c.lineTo(120,136);c.lineTo(22,75);c.closePath();c.fill();c.fillStyle='#2456a0';c.beginPath();c.arc(120,75,39,0,Math.PI*2);c.fill();c.strokeStyle='#fff';c.lineWidth=7;c.beginPath();c.moveTo(86,64);c.quadraticCurveTo(122,62,151,91);c.stroke();}
  if(country==='us'){for(let i=0;i<13;i++){c.fillStyle=i%2?'#fff9e9':'#c84450';c.fillRect(0,i*150/13,240,150/13+1);}c.fillStyle='#294e8b';c.fillRect(0,0,105,81);c.fillStyle='#fff';for(let y=0;y<5;y++)for(let x=0;x<6;x++){c.beginPath();c.arc(9+x*17,8+y*15,2.1,0,Math.PI*2);c.fill();}}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2.25,1.4,16,6),new THREE.MeshStandardMaterial({map:texture,side:THREE.DoubleSide,roughness:1,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.22}));mesh.position.set(1.13,3.4,0);g.rotation.y=.56;g.add(mesh);flags.push(mesh);
 }
 if(id==='buenosaires'){
  // Avenida 9 de Julio and its unmistakable obelisk.
  box(p,0,2.35,-1.1,.43,4.4,.43,0xfff3d6);add(p,new THREE.ConeGeometry(.31,.65,4),material(0xfff5dd),0,4.87,-1.1).rotation.y=Math.PI/4;
  // Casa Rosada: rose facade, central arch, colonnade and twin wings.
  const casa=group(-2.1,.05,-2.0,.85);casa.rotation.y=.15;
  box(casa,0,.85,0,2.3,1.7,1.15,0xf0a094);box(casa,0,1.82,0,2.5,.2,1.3,0xffc6b1);
  box(casa,-.83,1.98,0,.56,.28,1.15,0xe9988b);box(casa,.83,1.98,0,.56,.28,1.15,0xe9988b);
  box(casa,0,.45,.59,.36,.85,.025,0x704d57);add(casa,new THREE.CircleGeometry(.18,16,0,Math.PI),material(0x704d57),0,.875,.61);
  for(let i=-2;i<=2;i++){if(i!==0)box(casa,i*.41,.7,.59,.19,.39,.035,0x6c5868);box(casa,i*.41,1.3,.59,.19,.26,.035,0x7e6375);box(casa,i*.41,1.52,.63,.3,.065,.07,0xffd4b5);}
  // Caminito's saturated corrugated houses.
  [[1.7,.6,0x3c9cc5],[2.5,.4,0xe4b241],[3.15,.05,0xd56858]].forEach(([x,z,c])=>{box(p,x,.62,z,.68,1.24,.8,c);box(p,x,1.28,z,.76,.08,.85,0xe6c898);box(p,x,.8,z+.408,.23,.34,.02,0x244458);for(let n=0;n<5;n++)box(p,x-.28+n*.14,.6,z+.415,.012,1.1,.015,0xffffff,{transparent:true,opacity:.15});});
  flag(-3.0,1.0,'ar');
 }else if(id==='mexico'){
  // El Castillo, Chichén Itzá: nine terraces, temple and broad central stair.
  const temple=group(-.8,0,-.95);
  for(let n=0;n<9;n++)box(temple,0,.13+n*.27,0,3.5-n*.3,.29,3.5-n*.3,0xdec79b);
  box(temple,0,2.75,0,.95,.66,.92,0xf1d7a7);box(temple,0,3.11,0,1.15,.12,1.12,0xfce4b1);box(temple,0,2.75,.47,.3,.49,.03,0x695541);
  for(let n=0;n<12;n++){const z=1.78-n*.13;box(temple,0,.08+n*.2,z,.57,.17,.19,0xf1d9af);}
  // Plaza arcade and colorful colonial facades.
  const plaza=group(2.15,0,-1.5,.9);box(plaza,0,.67,0,1.3,1.34,.85,0xe88c65);box(plaza,0,1.45,0,1.48,.16,1,0xeec08c);
  for(let i=-1;i<=1;i++){box(plaza,i*.38,.42,.435,.23,.65,.025,0x786552);add(plaza,new THREE.CircleGeometry(.115,12,0,Math.PI),material(0x786552),i*.38,.75,.451);}
  cylinder(plaza,0,1.9,0,.3,.39,.85,0xf2c278,8);add(plaza,new THREE.SphereGeometry(.34,12,8,0,Math.PI*2,0,Math.PI/2),material(0x5ea8a3),0,2.32,0);
  flag(2.0,1.3,'mx');
 }else if(id==='brasil'){
  // The open-arm silhouette is a focal point, not a tiny detail.
  const christ=group(-1.4,3.9,-1.7,1.12);cylinder(christ,0,.07,0,.34,.44,.18,0xdad5b6,8);cylinder(christ,0,.76,0,.21,.42,1.35,0xfff2d1,8);
  beam(christ,[-1.35,1.14,0],[1.35,1.14,0],.12,0xfff2d1);sphere(christ,0,1.65,0,.205,0xfff2d1);box(christ,0,1.42,0,.18,.25,.18,0xfff2d1);
  // Copacabana's black-and-white wave mosaic along the shore.
  const cv=document.createElement('canvas');cv.width=384;cv.height=128;const cx=cv.getContext('2d');cx.fillStyle='#f3e7c7';cx.fillRect(0,0,384,128);cx.strokeStyle='#28424a';cx.lineWidth=11;for(let row=-2;row<6;row++){cx.beginPath();for(let x=0;x<=384;x+=3){const y=row*32+Math.sin(x/32)*18;x?cx.lineTo(x,y):cx.moveTo(x,y);}cx.stroke();}const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const walk=new THREE.Mesh(new THREE.PlaneGeometry(5.4,.73),new THREE.MeshStandardMaterial({map:tx}));walk.rotation.x=-Math.PI/2;walk.position.set(.5,.11,2.75);walk.rotation.z=.08;p.add(walk);
  const sea=add(p,new THREE.CircleGeometry(2.7,36),material(0x47bdc4,{metalness:.2,roughness:.25}),1.0,.035,1.2);sea.rotation.x=-Math.PI/2;sea.scale.y=.74;
  flag(2.3,-1.05,'br');
 }else if(id==='us'){
  // Liberty faces the world camera from the harbour at the island's front.
  const liberty=group(-2.4,.08,2.05,1.2);box(liberty,0,.22,0,1.3,.44,1.1,0xd6c3a0);box(liberty,0,.65,0,.86,.48,.72,0xc1b596);
  cylinder(liberty,0,1.57,0,.22,.48,1.46,0x72c5ac,8);sphere(liberty,0,2.5,0,.24,0x85d9b9);
  beam(liberty,[-.2,2.14,0],[-.61,2.74,0],.115,0x7bceb1);beam(liberty,[-.61,2.74,0],[-.73,3.26,0],.095,0x7bceb1);
  cylinder(liberty,-.74,3.46,0,.08,.06,.37,0xc5b886,8);add(liberty,new THREE.ConeGeometry(.16,.5,8),material(0xffd267,{emissive:0xffaa35,emissiveIntensity:1.3}),-.74,3.83,0);
  box(liberty,.35,1.94,.15,.33,.58,.13,0x65b99e).rotation.z=-.18;beam(liberty,[.2,2.12,0],[.39,1.9,.14],.11,0x7bceb1);
  for(let i=0;i<7;i++){const a=(i/6)*Math.PI;beam(liberty,[Math.cos(a)*.2,2.57+Math.sin(a)*.12,0],[Math.cos(a)*.4,2.63+Math.sin(a)*.38,0],.026,0x9adcb9);}
  // Yellow taxis and a red suspension bridge signal the US connection.
  const bridge=group(3.3,.1,2.0,.72);bridge.rotation.y=.2;box(bridge,0,.35,0,.52,.13,4.2,0x50616a);
  for(const z of [-1.2,1.2]){for(const x of [-.4,.4])box(bridge,x,1.06,z,.095,2.1,.12,0xd67859);box(bridge,0,1.65,z,.87,.12,.16,0xd67859);}
  for(const x of [-.39,.39]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x,.43,-2.1),new THREE.Vector3(x,2.06,-1.2),new THREE.Vector3(x,.85,0),new THREE.Vector3(x,2.06,1.2),new THREE.Vector3(x,.43,2.1)]);add(bridge,new THREE.TubeGeometry(curve,40,.027,5,false),material(0xf4a074));for(let z=-1.7;z<1.8;z+=.34)beam(bridge,[x,.41,z],[x,1.0+Math.abs(z)*.54,z],.013,0xf3b58d);}
  flag(3.5,-2.85,'us');
 }
}

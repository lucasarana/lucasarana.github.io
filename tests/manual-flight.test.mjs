import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import * as THREE from '../vendor/build/three.module.js';

// Exercise the actual animation/input code, without requiring WebGL rendering.
const source=readFileSync(new URL('../world.js',import.meta.url),'utf8');
const worldSource=readFileSync(new URL('../build-world.js',import.meta.url),'utf8');
const locationSource=worldSource.match(/export const locations = (\[[\s\S]*?\]);/)[1];
const locations=Function(`return ${locationSource}`)().map(loc=>({...loc,pad:new THREE.Vector3(loc.x,loc.y+1.25,loc.z+loc.r*.47)}));
const movementStart=source.indexOf(' const ship=built.ship;lastShipPosition.copy(ship.position);');
const movementEnd=source.indexOf(' velocity.copy(ship.position)',movementStart);
assert.ok(movementStart>0&&movementEnd>movementStart,'Animation movement section must be present');
const frame=Function('state','built','dt','yaw','locations','THREE','arrive','lastShipPosition','reduced','elapsed',source.slice(movementStart,movementEnd));
const keyStart=source.indexOf("addEventListener('keydown',");
const keyEnd=source.indexOf("document.addEventListener('visibilitychange'",keyStart);
const registerInput=Function('addEventListener','state','document','$','renderMission','dragging',source.slice(keyStart,keyEnd));

function game(id='buenosaires'){
 const origin=locations.find(loc=>loc.id===id);
 const state={started:true,flight:null,current:id,keys:new Set(),status:'landed'};
 const built={ship:{position:origin.pad.clone()}};
 const last=new THREE.Vector3(),arrivals=[],handlers={};let dialog=false;
 registerInput((name,fn)=>handlers[name]=fn,state,{querySelector:()=>dialog?{}:null},()=>({classList:{add(){}}}),()=>{},false);
 return {state,built,arrivals,
  press(key){handlers.keydown({key,preventDefault(){}});},
  release(key){handlers.keyup({key});},
  blur(){handlers.blur();},
  dialog(open){dialog=open;},
  tick(dt=1/60,yaw=.63){frame(state,built,dt,yaw,locations,THREE,id=>{arrivals.push(id);state.current=id;state.status='landed';},last,false,1);}
 };
}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

for(const hz of [12.5,30,60,144])test(`WASD and arrows leave every city at ${hz} FPS`,()=>{
 for(const loc of locations)for(const key of ['w','a','s','d','ArrowUp','ArrowLeft','ArrowDown','ArrowRight']){
  const g=game(loc.id);g.press(key);
  for(let i=0;i<Math.ceil(hz/4);i++)g.tick(1/hz);
  assert.ok(distance(g.built.ship.position,loc.pad)>1.45,`${loc.id}: ${key} must escape the landing pad`);
  assert.equal(g.arrivals.length,0,`${loc.id}: ${key} must not redock on departure`);
  assert.equal(g.state.status,'manual');
 }
});
test('Can return to the same city after leaving its pad',()=>{
 const g=game();g.press('w');for(let i=0;i<15;i++)g.tick();g.release('w');
 g.press('s');for(let i=0;i<20;i++)g.tick();
 assert.deepEqual(g.arrivals,['buenosaires']);assert.equal(g.state.keys.size,0);
});
test('Can pilot from every city to every other city',()=>{
 for(const from of locations)for(const to of locations){if(from.id===to.id)continue;
  const g=game(from.id),p=g.built.ship.position;
  // Resume after any intermediate pad on the route (e.g. the central hub).
  for(let i=0;i<240&&g.state.current!==to.id;i++){
   if(!g.state.keys.size)g.press('w');
   g.tick(1/60,Math.atan2(-(to.pad.x-p.x),-(to.pad.z-p.z)));
  }
  assert.equal(g.arrivals.at(-1),to.id,`${from.id} → ${to.id}`);
  assert.notEqual(g.arrivals[0],from.id);
  assert.equal(g.state.current,to.id);assert.equal(g.state.keys.size,0);
  assert.ok(distance(p,to.pad)<1e-9);
 }
});
test('Cancelling automatic flight inside a pad allows manual departure',()=>{
 const g=game();g.state.flight={};g.press('w');
 for(let i=0;i<15;i++)g.tick();
 assert.equal(g.state.flight,null);assert.equal(g.arrivals.length,0);
 assert.ok(distance(g.built.ship.position,locations.find(l=>l.id==='buenosaires').pad)>1.45);
});
test('Automatic flight still lands once',()=>{
 const g=game(),to=locations.find(l=>l.id==='mexico'),from=g.built.ship.position.clone();
 g.state.flight={id:to.id,time:0,duration:1,curve:new THREE.QuadraticBezierCurve3(from,from.clone().lerp(to.pad,.5),to.pad.clone())};
 for(let i=0;i<90;i++)g.tick();
 assert.deepEqual(g.arrivals,['mexico']);assert.equal(g.state.flight,null);
});
test('Diagonal motion has the same speed; opposing keys do not redock',()=>{
 const straight=game(),diagonal=game(),still=game();
 straight.press('w');diagonal.press('w');diagonal.press('d');still.press('w');still.press('s');
 for(let i=0;i<15;i++){straight.tick();diagonal.tick();still.tick();}
 const origin=locations.find(l=>l.id==='buenosaires').pad;
 assert.ok(Math.abs(distance(straight.built.ship.position,origin)-distance(diagonal.built.ship.position,origin))<1e-8);
 assert.equal(distance(still.built.ship.position,origin),0);assert.equal(still.arrivals.length,0);
});
test('Keyup, blur and dialogs retain their input safeguards',()=>{
 const g=game();g.press('W');g.tick();g.release('W');const p=g.built.ship.position.clone();g.tick();
 assert.equal(distance(g.built.ship.position,p),0);
 g.press('d');g.blur();g.tick();assert.equal(distance(g.built.ship.position,p),0);
 g.dialog(true);g.press('w');assert.equal(g.state.keys.size,0);
});

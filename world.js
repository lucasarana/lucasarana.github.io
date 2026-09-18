import * as THREE from 'three';
import {EffectComposer} from './vendor/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/examples/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './vendor/examples/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from './vendor/examples/jsm/postprocessing/OutputPass.js';
import {buildWorld,locations} from './build-world.js?v=3';
import {t,story,stationLabel,applyLanguage,setLanguage,getLanguage} from './language.js?v=4';

const $=id=>document.getElementById(id),world=$('world'),container=$('scene');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=()=>innerWidth<601;
const introView=()=>mobile()?75:innerWidth<1050?57:43;
const playingView=()=>mobile()?79:innerWidth<1050?58:45;
const state={started:false,connected:new Set(),complete:false,flight:null,current:null,sound:false,paused:false,keys:new Set(),lastArrival:null,status:'ready',discoveryMode:'note'};
applyLanguage();
let renderer,scene,camera,composer,built,frame,clock,lastTime=0,elapsed=0;
const target=new THREE.Vector3(),targetGoal=new THREE.Vector3();
let yaw=.63,pitch=.65,viewSize=45,viewGoal=45,dragging=false,dragMoved=false,lastPointer={x:0,y:0},pointerStart={x:0,y:0};
const velocity=new THREE.Vector3(),lastShipPosition=new THREE.Vector3();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const labels=new Map(),projected=new THREE.Vector3();
let burst=null,audioContext=null,musicInterval=null,engineNote=null,trailIndex=0,trailClock=0;

try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.35:1.65));
 renderer.setSize(container.clientWidth,container.clientHeight);
 renderer.shadowMap.enabled=!mobile();renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.outputColorSpace=THREE.SRGBColorSpace;
 container.appendChild(renderer.domElement);
 scene=new THREE.Scene();scene.background=new THREE.Color(0x10394a);scene.fog=new THREE.FogExp2(0x164351,.008);
 const hemi=new THREE.HemisphereLight(0xc2f2eb,0x3b3f65,2.05);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffd6a3,3.2);sun.position.set(-20,30,10);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-33;sun.shadow.camera.right=33;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;sun.shadow.camera.near=1;sun.shadow.camera.far=100;sun.shadow.normalBias=.1;sun.shadow.bias=-.00015;scene.add(sun);
 const rim=new THREE.DirectionalLight(0x5dd6ee,1.9);rim.position.set(15,10,-20);scene.add(rim);
 const sky=new THREE.Mesh(new THREE.SphereGeometry(180,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x061d35)},bottom:{value:new THREE.Color(0x286475)}},vertexShader:'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 bottom;varying vec3 vPosition;void main(){vec3 d=normalize(vPosition);float t=smoothstep(-.45,.5,d.y);vec3 color=mix(bottom,top,t);float light=pow(max(0.,dot(d,normalize(vec3(-.7,.16,-.3)))),12.);color+=vec3(.18,.12,.07)*light;gl_FragColor=vec4(color,1.);}'}));scene.add(sky);
 camera=new THREE.OrthographicCamera(-40,40,25,-25,.1,300);
 built=buildWorld(scene);
 composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.48,.55,1.3);composer.addPass(bloom);composer.addPass(new OutputPass());
 const labelContainer=$('world-labels');locations.forEach(loc=>{const button=document.createElement('button');button.className='world-label';button.style.setProperty('--station','#'+loc.color.toString(16).padStart(6,'0'));button.setAttribute('aria-label',t('flyLabel',{place:stationLabel(loc.id)}));const country={us:'us',mexico:'mx',brasil:'br',buenosaires:'ar'}[loc.id];button.innerHTML=(country?'<span class="country-flag flag-'+country+'"></span>':'<span class="label-dot"></span>')+'<span class="label-city">'+stationLabel(loc.id)+'</span><span class="label-sub">'+t(loc.id+'Sub')+'</span>';button.addEventListener('click',()=>{if(!state.started)start(false);goTo(loc.id);});labelContainer.appendChild(button);labels.set(loc.id,button);});
 const nt=new THREE.TextureLoader().load('./assets/nexton-logo.svg');nt.colorSpace=THREE.SRGBColorSpace;const nextonLogo=new THREE.Sprite(new THREE.SpriteMaterial({map:nt,transparent:true,depthWrite:false,toneMapped:false}));nextonLogo.position.set(0,5.35,1);nextonLogo.scale.set(4.5,4.5*28/111,1);scene.add(nextonLogo);
 const balloon=new THREE.Group();scene.add(balloon);const balloonBody=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),new THREE.MeshStandardMaterial({color:0xe8cbaa,roughness:.8,flatShading:true}));balloonBody.scale.set(1.5,.45,.55);balloon.add(balloonBody);const basket=new THREE.Mesh(new THREE.BoxGeometry(.7,.2,.4),new THREE.MeshStandardMaterial({color:0x5f7372}));basket.position.y=-.6;balloon.add(basket);const fin=new THREE.Mesh(new THREE.BoxGeometry(.4,.6,.06),new THREE.MeshStandardMaterial({color:0xcf9379}));fin.position.set(-1.25,.05,0);balloon.add(fin);
 built.balloon=balloon;
 target.copy(mobile()?new THREE.Vector3(0,-7,0):new THREE.Vector3(-9,0,6));targetGoal.copy(target);viewSize=introView();viewGoal=viewSize;
 lastShipPosition.copy(built.ship.position);resize();
 $('start').disabled=false;$('start-label').textContent=t('enter');
 clock=new THREE.Clock();frame=requestAnimationFrame(animate);
}catch(error){console.error('3D initialization failed',error);$('fallback').classList.remove('hidden');}

function resize(){if(!renderer)return;const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);composer.setSize(w,h);camera.left=-viewSize*w/h/2;camera.right=viewSize*w/h/2;camera.top=viewSize/2;camera.bottom=-viewSize/2;camera.updateProjectionMatrix();if(!state.started){targetGoal.copy(mobile()?new THREE.Vector3(0,-7,0):new THREE.Vector3(-9,0,6));viewGoal=introView();}else viewGoal=playingView();}
addEventListener('resize',resize);

function start(fly=true){
 if(!built||state.started)return;
 state.started=true;world.classList.remove('intro-mode');world.classList.add('playing');
 $('mission').classList.remove('hidden');$('flight-hint').classList.remove('hidden');$('destinations').classList.remove('hidden');
 $('intro-copy').inert=true;setTimeout(()=>{$('intro-copy').classList.add('hidden');},800);
 targetGoal.set(0,mobile()?1:0,0);viewGoal=playingView();
 tone(392,.3,.07);tone(587.33,.4,.04,.13);
 if(fly)goTo('buenosaires');
}
$('start').addEventListener('click',()=>start());

function goTo(id){
 const loc=locations.find(x=>x.id===id);if(!loc||!built)return;
 if(!state.started)start(false);
 state.keys.clear();state.lastArrival=null;state.current=null;
 $('discovery').classList.add('hidden');
 document.querySelectorAll('[data-destination]').forEach(b=>b.classList.toggle('selected',b.dataset.destination===id));
 const from=built.ship.position.clone(),to=loc.pad.clone();to.y+=.2;
 const dist=from.distanceTo(to),mid=from.clone().lerp(to,.5);mid.y=Math.max(from.y,to.y)+Math.min(6,dist*.22);
 state.flight={id,curve:new THREE.QuadraticBezierCurve3(from,mid,to),time:0,duration:THREE.MathUtils.clamp(dist/19,.65,1.7)};
 state.status='flying';renderMission();
 targetGoal.set(loc.x*.14,mobile()?1:0,loc.z*.14);tone(261.63,.16,.02);
}
document.querySelectorAll('[data-destination]').forEach(button=>button.addEventListener('click',()=>goTo(button.dataset.destination)));

function arrive(id){
 state.current=id;state.lastArrival=id;state.status='landed';state.discoveryMode='note';renderMission();
 if(id==='us'&&state.connected.size===3){complete();return;}
 renderDiscovery();$('discovery').classList.remove('hidden');tone(523.25,.25,.025);
}
function renderMission(){
 const phase=state.complete?'missionComplete':state.connected.size===3?'missionUS':'mission';
 $('mission-title').textContent=t(phase==='mission'?'missionTitle':phase);
 $('mission-description').textContent=t(phase==='mission'?'missionDescription':phase+'Description');
 $('progress-text').textContent=t('connections',{count:state.connected.size});
 $('flight-status').textContent=state.status==='flying'?t('flying',{place:stationLabel(state.flight?.id||'buenosaires')}):t(state.status==='complete'?'completeStatus':state.status);
}
function renderDiscovery(){
 if(!state.current)return;const id=state.current,info=story(id),action=$('discovery-action');
 $('discovery-kicker').textContent=info.kicker;$('discovery-title').textContent=info.title;$('discovery-body').textContent=info.body;
 if(state.discoveryMode==='connected'){
  $('discovery-kicker').textContent=t('connectionEstablished',{place:stationLabel(id)});$('discovery-title').textContent=t('oneLess');
  $('discovery-body').textContent=state.connected.size===3?t('allConnected'):t('nextConnection',{place:stationLabel(nextUnvisited())});
  action.textContent=t(state.connected.size===3?'finishUS':'flyNext');action.onclick=()=>goTo(nextUnvisited());
 }else if(id==='nexton'){action.textContent=info.action;action.onclick=()=>openDialog('profile-dialog');}
 else if(id==='us'){action.textContent=t('continueLATAM');action.onclick=()=>goTo(nextUnvisited());}
 else if(state.connected.has(id)){action.textContent=t(state.connected.size===3?'toUS':'nextHub');action.onclick=()=>goTo(state.connected.size===3?'us':nextUnvisited());$('discovery-kicker').textContent=info.kicker+' / '+t('connected');}
 else{action.textContent=info.action;action.onclick=()=>activate(id);}
}
function refreshLanguage(){
 $('start-label').textContent=t(built?'enter':'loading');renderMission();
 labels.forEach((button,id)=>{button.querySelector('.label-city').textContent=stationLabel(id);button.querySelector('.label-sub').textContent=t(id+'Sub');button.setAttribute('aria-label',t('flyLabel',{place:stationLabel(id)}));});
 $('sound').setAttribute('aria-label',t(state.sound?'soundOff':'soundOn'));
 $('scene').setAttribute('aria-label',getLanguage()==='en'?'3D world of Argentina, Mexico, Brazil, the United States and Nexton':'Mundo 3D de Argentina, México, Brasil, Estados Unidos y Nexton');
 $('world-labels').setAttribute('aria-label',getLanguage()==='en'?'World destinations':'Destinos del mundo');
 $('destinations').setAttribute('aria-label',getLanguage()==='en'?'Choose a destination':'Elegir destino');
 if(!$('discovery').classList.contains('hidden'))renderDiscovery();
}
$('language').addEventListener('click',()=>{setLanguage(getLanguage()==='en'?'es':'en');refreshLanguage();});

function nextUnvisited(){return ['buenosaires','brasil','mexico'].find(id=>!state.connected.has(id))||'us';}
function activate(id){
 if(state.connected.has(id))return;state.connected.add(id);
 const loc=locations.find(x=>x.id===id),route=built.routes.find(x=>x.id===id);route.active=true;route.tube.material.opacity=.8;route.line.material.opacity=.85;
 loc.beacon.material=new THREE.MeshStandardMaterial({color:0xd9ffac,emissive:0xa0ef7b,emissiveIntensity:3,roughness:.3});
 labels.get(id).classList.add('connected');document.querySelector('[data-destination="'+id+'"]').classList.add('connected');
 $('progress-fill').style.width=state.connected.size/3*100+'%';state.discoveryMode='connected';renderMission();renderDiscovery();
 makeBurst(loc.group.position.clone().add(new THREE.Vector3(0,2,0)),loc.color);
 [523.25,659.25,783.99].forEach((f,i)=>tone(f,.5,.04,i*.09));
}
function complete(){
 if(state.complete){$('discovery').classList.add('hidden');return;}
 state.complete=true;const route=built.routes.find(x=>x.id==='us');route.active=true;route.tube.material.opacity=1;route.line.material.opacity=1;
 labels.get('us').classList.add('connected');document.querySelector('[data-destination="us"]').classList.add('connected');
 state.status='complete';renderMission();
 $('transition-flash').classList.remove('flash');void $('transition-flash').offsetWidth;$('transition-flash').classList.add('flash');
 const loc=locations.find(x=>x.id==='us');makeBurst(new THREE.Vector3(loc.x,loc.y+5,loc.z),0xd4ff96,160);
 [392,523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,1.1,.05,i*.12));
 targetGoal.set(0,0,0);viewGoal=playingView();setTimeout(()=>openDialog('complete-dialog'),1100);
}
function makeBurst(position,color,count=75){
 if(burst){scene.remove(burst.mesh);burst.mesh.geometry.dispose();burst.mesh.material.dispose();}
 const positions=new Float32Array(count*3),velocities=[];
 for(let n=0;n<count;n++){positions.set([position.x,position.y,position.z],n*3);const direction=new THREE.Vector3(Math.random()-.5,Math.random()*.8+.2,Math.random()-.5).normalize().multiplyScalar(1.4+Math.random()*3.5);velocities.push(direction);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));const mat=new THREE.PointsMaterial({color,size:.12,transparent:true,opacity:1,depthWrite:false});const mesh=new THREE.Points(geometry,mat);scene.add(mesh);burst={mesh,velocities,time:0};
}
function reset(){
 state.connected.clear();state.complete=false;state.current=null;state.lastArrival=null;state.flight=null;state.keys.clear();
 document.querySelectorAll('dialog[open]').forEach(x=>x.close());$('discovery').classList.add('hidden');
 built.routes.forEach(r=>{r.active=false;r.tube.material.opacity=.14;r.line.material.opacity=.45;});
 built.islands.forEach(loc=>{loc.beacon.material=new THREE.MeshStandardMaterial({color:loc.color,emissive:loc.color,emissiveIntensity:2.7});labels.get(loc.id).classList.remove('connected');});
 document.querySelectorAll('[data-destination]').forEach(x=>x.classList.remove('connected','selected'));
 $('progress-fill').style.width='0';state.status='ready';state.discoveryMode='note';renderMission();
 built.ship.position.copy(built.hub.pad);built.ship.position.y+=1.3;goTo('buenosaires');
}
$('reset').addEventListener('click',reset);$('discovery-close').addEventListener('click',()=>{$('discovery').classList.add('hidden');});
$('overview').addEventListener('click',()=>{yaw=.63;pitch=.65;targetGoal.set(0,mobile()?1:0,0);viewGoal=playingView();});
$('keep-exploring').addEventListener('click',()=>{$('complete-dialog').close();$('discovery').classList.add('hidden');});
function openDialog(id){state.keys.clear();if(!$(id).open)$(id).showModal();}
$('mission-profile').addEventListener('click',()=>openDialog('profile-dialog'));
$('profile-open').addEventListener('click',()=>openDialog('profile-dialog'));$('fallback-profile').addEventListener('click',()=>openDialog('profile-dialog'));$('menu-open').addEventListener('click',()=>openDialog('help-dialog'));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}}));

container.addEventListener('pointerdown',e=>{if(!built)return;dragging=true;dragMoved=false;pointerStart={x:e.clientX,y:e.clientY};lastPointer={...pointerStart};container.setPointerCapture(e.pointerId);});
container.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastPointer.x,dy=e.clientY-lastPointer.y;if(Math.abs(e.clientX-pointerStart.x)+Math.abs(e.clientY-pointerStart.y)>5)dragMoved=true;if(dragMoved){yaw-=dx*.005;pitch=THREE.MathUtils.clamp(pitch+dy*.003,.3,1.2);}lastPointer={x:e.clientX,y:e.clientY};});
container.addEventListener('pointerup',e=>{dragging=false;if(dragMoved||!built)return;const r=container.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(built.pickables);if(hits.length)goTo(hits[0].object.userData.station);});
container.addEventListener('pointercancel',()=>dragging=false);
container.addEventListener('wheel',e=>{e.preventDefault();viewGoal=THREE.MathUtils.clamp(viewGoal+e.deltaY*.025,mobile()?44:23,mobile()?110:75);},{passive:false});
addEventListener('keydown',e=>{if(!state.started||document.querySelector('dialog[open]'))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();state.keys.add(key);if(state.flight)state.flight=null;state.current=null;$('discovery').classList.add('hidden');state.status='manual';renderMission();}});
addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{state.keys.clear();dragging=false;});
document.addEventListener('visibilitychange',()=>{state.keys.clear();if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=null;}else{clock?.getDelta();if(!frame&&renderer)frame=requestAnimationFrame(animate);}});

function tone(frequency,duration=.2,volume=.025,delay=0){if(!state.sound||!audioContext)return;const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),t=audioContext.currentTime+delay;oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.04);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(t);oscillator.stop(t+duration+.05);}
$('sound').addEventListener('click',async()=>{state.sound=!state.sound;if(state.sound){audioContext ||= new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();const notes=[130.81,196,261.63,329.63,392,329.63,261.63,196];let i=0;tone(261.63,.6,.025);musicInterval=setInterval(()=>{if(!document.hidden)tone(notes[i++%notes.length],1.9,.012);},700);}else{clearInterval(musicInterval);if(audioContext)await audioContext.suspend();}$('sound').setAttribute('aria-pressed',String(state.sound));$('sound').setAttribute('aria-label',t(state.sound?'soundOff':'soundOn'));$('sound-status').textContent=state.sound?'ON':'OFF';});

function animate(){
 frame=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.08);elapsed+=dt;
 built.update(elapsed,dt,reduced);
 const ship=built.ship;lastShipPosition.copy(ship.position);
 if(state.flight){const f=state.flight;f.time+=dt;const t=Math.min(f.time/f.duration,1),eased=t*t*(3-2*t);ship.position.copy(f.curve.getPoint(eased));if(t>=1){state.flight=null;arrive(f.id);}}
 else if(state.keys.size){const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));const input=new THREE.Vector3();if(state.keys.has('w')||state.keys.has('arrowup'))input.add(forward);if(state.keys.has('s')||state.keys.has('arrowdown'))input.sub(forward);if(state.keys.has('a')||state.keys.has('arrowleft'))input.sub(right);if(state.keys.has('d')||state.keys.has('arrowright'))input.add(right);input.normalize().multiplyScalar(dt*16);ship.position.add(input);ship.position.x=THREE.MathUtils.clamp(ship.position.x,-26,26);ship.position.z=THREE.MathUtils.clamp(ship.position.z,-27,27);ship.position.y=THREE.MathUtils.lerp(ship.position.y,5,.025);state.lastArrival=null;}
 else if(!reduced){ship.position.y+=Math.sin(elapsed*3)*.0025;}
 if(state.started&&!state.flight&&state.keys.size){for(const loc of locations){const distance=Math.hypot(ship.position.x-loc.pad.x,ship.position.z-loc.pad.z);if(distance<1.45&&state.lastArrival!==loc.id){state.keys.clear();ship.position.copy(loc.pad);ship.position.y+=.2;arrive(loc.id);break;}}}
 velocity.copy(ship.position).sub(lastShipPosition);const speed=velocity.length()/Math.max(dt,.001);
 if(speed>.05){const angle=Math.atan2(-velocity.x,-velocity.z);let delta=angle-ship.rotation.y;delta=Math.atan2(Math.sin(delta),Math.cos(delta));ship.rotation.y+=delta*.12;ship.rotation.z=THREE.MathUtils.lerp(ship.rotation.z,THREE.MathUtils.clamp(delta*.17,-.3,.3),.08);}else ship.rotation.z*=.92;
 trailClock+=dt;if(speed>1&&trailClock>.06){trailClock=0;const m=built.trail[trailIndex++%built.trail.length];m.position.copy(ship.position);m.userData.life=1;m.visible=true;}
 built.trail.forEach(m=>{if(m.visible){m.userData.life-=dt*.95;m.scale.setScalar(Math.max(.01,m.userData.life*1.7));if(m.userData.life<=0)m.visible=false;}});
 target.lerp(targetGoal,1-Math.exp(-dt*2.8));viewSize=THREE.MathUtils.lerp(viewSize,viewGoal,1-Math.exp(-dt*3));
 const orbit=!state.started&&!dragging&&!reduced?Math.sin(elapsed*.08)*.035:0,az=yaw+orbit;
 camera.position.set(target.x+Math.sin(az)*55*Math.cos(pitch),target.y+Math.sin(pitch)*55,target.z+Math.cos(az)*55*Math.cos(pitch));camera.lookAt(target);
 const aspect=container.clientWidth/container.clientHeight;camera.left=-viewSize*aspect/2;camera.right=viewSize*aspect/2;camera.top=viewSize/2;camera.bottom=-viewSize/2;camera.updateProjectionMatrix();
 locations.forEach(loc=>{const height=loc.id==='us'?9.8:loc.id==='nexton'?5.9:loc.id==='brasil'?8.1:loc.id==='buenosaires'?6.2:5.8;projected.set(loc.x,loc.group.position.y+height,loc.z).project(camera);const button=labels.get(loc.id);const x=(projected.x*.5+.5)*container.clientWidth,y=(-projected.y*.5+.5)*container.clientHeight;button.style.left=x+'px';button.style.top=y+'px';const obscured=(!state.started&&!mobile()&&x<innerWidth*.46)||(mobile()&&state.started&&y<235);button.style.visibility=(projected.z>1||x<20||x>innerWidth-20||y<70||y>innerHeight-70||obscured)?'hidden':'visible';});
 built.balloon.position.set(-13+Math.sin(elapsed*.055)*12,10+Math.sin(elapsed*.5)*.15,-27+Math.cos(elapsed*.055)*5);built.balloon.rotation.y=-elapsed*.055;
 if(burst){burst.time+=dt;const a=burst.mesh.geometry.attributes.position;for(let i=0;i<burst.velocities.length;i++){const v=burst.velocities[i];a.array[i*3]+=v.x*dt;a.array[i*3+1]+=v.y*dt;a.array[i*3+2]+=v.z*dt;v.y-=dt*1.8;}a.needsUpdate=true;burst.mesh.material.opacity=Math.max(0,1-burst.time/2.6);if(burst.time>2.7){scene.remove(burst.mesh);burst.mesh.geometry.dispose();burst.mesh.material.dispose();burst=null;}}
 composer.render();
}
function updateClock(){$('ba-time').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());}updateClock();setInterval(updateClock,30000);


refreshLanguage();

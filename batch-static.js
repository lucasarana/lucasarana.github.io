import * as THREE from 'three';

// Repeated static details share one draw call; animated objects stay independent.
export function batchStaticBoxes(roots,boxGeometry,movingRoots=[]){
 const moving=new Set(movingRoots),stats={meshes:0,batches:0};
 for(const root of roots){
  root.updateWorldMatrix(true,true);
  const inverseRoot=root.matrixWorld.clone().invert(),groups=new Map();
  root.traverse(mesh=>{
   if(!mesh.isMesh||mesh.geometry!==boxGeometry||!mesh.visible||Array.isArray(mesh.material)||mesh.material.transparent)return;
   for(let parent=mesh;parent!==root;parent=parent.parent)if(moving.has(parent)||!parent.visible)return;
   const key=[mesh.material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,mesh.layers.mask].join(':');
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(mesh);
  });
  for(const meshes of groups.values()){
   if(meshes.length<3)continue;
   const first=meshes[0],batch=new THREE.InstancedMesh(boxGeometry,first.material,meshes.length);
   batch.name='Static island details';batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
   batch.renderOrder=first.renderOrder;batch.layers.mask=first.layers.mask;
   meshes.forEach((mesh,index)=>batch.setMatrixAt(index,new THREE.Matrix4().multiplyMatrices(inverseRoot,mesh.matrixWorld)));
   batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();
   root.add(batch);meshes.forEach(mesh=>mesh.removeFromParent());
   stats.meshes+=meshes.length;stats.batches++;
  }
 }
 return stats;
}

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import waymarkUrl from './assets/west-bank-waymark.glb?url&no-inline';
import { crossing, deckHeight, ground, westBankWaymark } from './geography.js';

export function makeCrossing(scene) {
  const { west, east, z, halfWidth } = crossing;
  new GLTFLoader().loadAsync(waymarkUrl).then(({ scene: waymark }) => {
    const { x, z, yaw } = westBankWaymark;
    waymark.position.set(x, ground(x, z), z);
    waymark.rotation.y = yaw;
    scene.add(waymark);
  }).catch(error => console.warn('Could not load the west-bank waymark', error));

  const timber = new THREE.MeshStandardMaterial({ roughness: 0.91 });
  const stone = new THREE.MeshStandardMaterial({ color: '#4f5751', roughness: 1, flatShading: true });
  const box = new THREE.BoxGeometry();
  const plankCount = 61;
  const stride = (east - west) / plankCount;
  const planks = new THREE.InstancedMesh(box, timber, plankCount);
  const pose = new THREE.Object3D();
  const wood = ['#81674c', '#725941', '#8e7254', '#665444'].map(color => new THREE.Color(color));
  for (let i = 0; i < plankCount; i++) {
    const x = west + (i + 0.5) * stride;
    const angle = Math.atan2(deckHeight(x + stride / 2) - deckHeight(x - stride / 2), stride);
    pose.position.set(x, deckHeight(x) - 0.13, z);
    pose.rotation.set(0, 0, angle);
    pose.scale.set(stride - 0.025, 0.26, halfWidth * 2 + 0.24);
    pose.updateMatrix();
    planks.setMatrixAt(i, pose.matrix);
    planks.setColorAt(i, wood[(i * 7 + Math.floor(i / 6)) % wood.length]);
  }
  scene.add(planks);

  const batches = new Map();
  function beam(x, y, atZ, sx, sy, sz, material) {
    const mesh = new THREE.Object3D();
    mesh.position.set(x, y, atZ);
    mesh.scale.set(sx, sy, sz);
    if (!batches.has(material)) batches.set(material, []);
    batches.get(material).push(mesh);
    return mesh;
  }

  for (const x of [west + 0.35, -2, 8, 18, east - 0.35]) {
    const y = deckHeight(x);
    beam(x, (y - 3.2) / 2, z, 0.87, y + 2.7, 3.65, stone);
    beam(x, y - 0.39, z, 1.3, 0.47, 3.86, stone);
  }

  const edgeWood = new THREE.MeshStandardMaterial({ color: '#5f4936', roughness: 0.94 });
  for (const side of [-1, 1]) {
    const atZ = z + side * (halfWidth + 0.06);
    for (let x = west + 0.4; x < east; x += 3.1) {
      beam(x, deckHeight(x) + 0.41, atZ, 0.17, 0.97, 0.18, edgeWood);
    }
    for (let x = west + 0.4; x + 3.1 < east; x += 3.1) {
      const a = deckHeight(x);
      const b = deckHeight(x + 3.1);
      const rail = beam(x + 1.55, (a + b) / 2 + 0.70, atZ, Math.hypot(3.1, b - a), 0.11, 0.13, edgeWood);
      rail.rotation.z = Math.atan2(b - a, 3.1);
    }
  }
  for (const [material, blocks] of batches) {
    const mesh = new THREE.InstancedMesh(box, material, blocks.length);
    for (const [i, block] of blocks.entries()) {
      block.updateMatrix();
      mesh.setMatrixAt(i, block.matrix);
    }
    scene.add(mesh);
  }
}

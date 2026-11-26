import * as THREE from 'three';
import { discoveries, ground, measureHouse, sightline } from './geography.js';

export function makeMeasureHouse(scene) {
  const masonry = ['#424b4a', '#596362', '#6c6b60', '#777366'].map(color =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.95, flatShading: true }));
  const brass = new THREE.MeshStandardMaterial({ color: '#a68152', roughness: 0.66 });
  const mineral = new THREE.MeshStandardMaterial({ color: '#c3ada0', roughness: 0.88 });
  const box = new THREE.BoxGeometry();
  const { z, walls } = measureHouse;

  function block(x, y, atZ, sx, sy, sz, material = masonry[1]) {
    const mesh = new THREE.Mesh(box, material);
    mesh.position.set(x, y, atZ);
    mesh.scale.set(sx, sy, sz);
    scene.add(mesh);
    return mesh;
  }

  for (const [index, wall] of walls.entries()) {
    const { x, halfOpening, halfWidth, thickness, height } = wall;
    const crown = ground(x, z) + height;
    const lintel = ground(x, z) + 3.6 + index * 0.23;
    for (const side of [-1, 1]) {
      const atZ = z + side * (halfOpening + halfWidth) / 2;
      const base = ground(x, atZ) - 0.42;
      const width = halfWidth - halfOpening;
      for (let layer = 0; layer < 5; layer++) {
        const h = (crown - base) / 5;
        const cut = layer * 0.11;
        const course = block(x + (layer % 2) * 0.08, base + (layer + 0.5) * h, atZ + side * cut / 2,
          thickness - cut * 0.42, h - 0.025, width - cut, masonry[(index + layer + (side > 0 ? 1 : 0)) % masonry.length]);
        course.rotation.x = side * (layer % 2) * 0.016;
      }
      for (let seam = 0; seam < 3; seam++) {
        const y = base + 1.16 + seam * 0.63;
        block(x - thickness * 0.51, y, atZ, 0.06, 0.045, width * (0.91 - seam * 0.13), mineral);
      }
    }
    block(x, (lintel + crown) / 2, z, thickness * 0.97, crown - lintel, halfOpening * 2 + 0.34, masonry[index]);
    block(x - 0.09, crown + 0.18, z, thickness * 1.22, 0.39, halfWidth * 1.88, masonry[(index + 1) % masonry.length]);
    block(x - thickness * 0.52, lintel + 0.22, z, 0.07, 0.08, halfOpening * 2, brass);
  }

  for (let i = 0; i < 22; i++) {
    const x = 25 + i * 0.83;
    const atZ = z + Math.sin(i * 1.78) * 0.48;
    const slab = block(x, ground(x, atZ) - 0.08, atZ, 0.76, 0.19, 2.05 + Math.sin(i * 1.6) * 0.44,
      masonry[i % masonry.length]);
    slab.rotation.y = Math.sin(i * 3.78) * 0.10;
  }

  const eye = ground(sightline.x, sightline.z) + 1.67;
  const patina = new THREE.MeshStandardMaterial({ color: '#c39d67', emissive: '#624019', emissiveIntensity: 0.68, side: THREE.DoubleSide });
  for (const [i, x] of sightline.layers.entries()) {
    const depth = sightline.x - x;
    const radius = sightline.radius * depth;
    const arc = new THREE.Mesh(new THREE.RingGeometry(radius * 0.87, radius, 14, 1, 0.20 + i * 2.09, i === 2 ? 1.60 : 1.95), patina);
    arc.rotation.y = Math.PI / 2;
    arc.position.set(x, eye + sightline.rise * depth, z);
    scene.add(arc);
  }

  const witnessY = ground(sightline.x, z);
  block(sightline.x, witnessY - 0.035, z, 1.46, 0.19, 1.32, masonry[2]);
  for (const side of [-1, 1]) {
    block(sightline.x + 0.21, witnessY + 0.075, z + side * 0.32, 0.4, 0.043, 0.10, brass);
  }
  block(sightline.x + 0.17, witnessY + 0.06, z, 0.61, 0.04, 0.08, brass);

  const gauge = discoveries.find(site => site.id === 'dry-gauge');
  const base = ground(gauge.x, gauge.z);
  block(gauge.x, base + 0.88, gauge.z, 1.16, 2.21, 0.56, masonry[2]);
  block(gauge.x, base + 1.13, gauge.z - 0.294, 0.81, 1.06, 0.07, brass);
  for (let i = 0; i < 7; i++) {
    block(gauge.x - 0.19 + (i % 2) * 0.08, base + 0.72 + i * 0.13, gauge.z - 0.336,
      0.34 + i * 0.039, 0.018, 0.025, masonry[0]);
  }
  block(gauge.x + 0.19, base + 1.35, gauge.z - 0.35, 0.20, 0.044, 0.025, mineral);
}

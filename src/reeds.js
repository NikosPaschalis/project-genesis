import * as THREE from 'three';
import { crossing, ground, waterline } from './geography.js';

export function reedBed() {
  const centers = [];
  for (let z = -43; z < 29; z += 1.35) {
    if (Math.abs(z - crossing.z) < 3.2 || Math.sin(z * 0.48) < -0.57) continue;
    for (let x = 8; x < 28; x += 0.5) {
      const y = ground(x, z);
      if (y < waterline + 0.10 || y > waterline + 0.53) continue;
      centers.push({ x, y, z });
      break;
    }
  }
  return centers;
}

export function makeReeds(scene) {
  const vertices = [
    -.025, 0, 0, .025, 0, 0, .050, .63, 0,
    .025, 0, 0, .076, .64, 0, .050, .63, 0,
    .050, .63, 0, .076, .64, 0, .13, 1, 0,
    .068, .77, 0, .14, .85, 0, .13, 1, 0,
    .068, .77, 0, .045, .85, 0, .13, 1, 0,
    0, .14, 0, -.04, .43, -.077, -.16, .66, -.25,
    0, .14, 0, -.16, .66, -.25, -.11, .36, -.074,
    .036, .32, 0, .15, .52, .03, .26, .65, .16,
    .036, .32, 0, .15, .45, .085, .26, .65, .16,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  const colors = [];
  const root = new THREE.Color('#636847');
  const tips = new THREE.Color('#c7a16a');
  for (let i = 1; i < vertices.length; i += 3) {
    const tone = root.clone().lerp(tips, THREE.MathUtils.smoothstep(vertices[i], .3, .93));
    colors.push(tone.r, tone.g, tone.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const time = { value: 0 };
  const material = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, vertexColors: true, roughness: 1 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.reedTime = time;
    shader.vertexShader = 'uniform float reedTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      float phase = instanceMatrix[3].x * .29 + instanceMatrix[3].z * .43;
      float bending = sin(reedTime * 1.7 + phase) * .082 + sin(reedTime * .59 + phase * .42) * .045;
      transformed.x += bending * transformed.y * transformed.y;
    `);
  };

  const centers = reedBed();
  const stemsPerTuft = 11;
  const mesh = new THREE.InstancedMesh(geometry, material, centers.length * stemsPerTuft);
  const pose = new THREE.Object3D();
  for (const [i, center] of centers.entries()) {
    for (let j = 0; j < stemsPerTuft; j++) {
      const angle = j * 2.39996 + i * .47;
      const radius = Math.sqrt(j / stemsPerTuft) * .84;
      const x = center.x + Math.cos(angle) * radius;
      const z = center.z + Math.sin(angle) * radius * 1.20;
      const scale = .67 + .42 * (1 + Math.sin(j * 1.71 + i * 2.14));
      pose.position.set(x, ground(x, z) - .09, z);
      pose.rotation.set(0, angle, 0);
      pose.scale.set(scale, scale * 1.34, scale);
      pose.updateMatrix();
      mesh.setMatrixAt(i * stemsPerTuft + j, pose.matrix);
    }
  }
  scene.add(mesh);
  return time;
}

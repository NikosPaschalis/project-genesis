import * as THREE from 'three';
import { makeCrossing } from './crossing.js';
import { makeMeasureHouse } from './measure-house.js';
import { makeReeds } from './reeds.js';

import { discoveries, ground, measureHouse, reedStairDistance, shorePath, spurDistance, trailDistance, waterline } from './geography.js';

function generator(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

const smooth = THREE.MathUtils.smoothstep;

const sky = new THREE.Color('#91aaa8');
const water = new THREE.Color('#456d68');
const sun = new THREE.Vector3(0.58, 0.292, -1).normalize();

const skyFragment = /* glsl */`
uniform vec3 sun;
varying vec3 direction;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

void main() {
  vec3 ray = normalize(direction);
  float h = max(ray.y, 0.0);
  float facing = max(dot(normalize(vec3(ray.x, 0.001, ray.z)), normalize(vec3(sun.x, 0.001, sun.z))), 0.0);
  vec3 horizon = mix(vec3(0.34, 0.51, 0.51), vec3(0.72, 0.52, 0.34), pow(facing, 5.0));
  vec3 color = mix(horizon, vec3(0.050, 0.17, 0.23), smoothstep(0.0, 0.66, h));
  float angular = distance(ray, sun);
  color += vec3(0.42, 0.23, 0.10) * exp(-angular * 7.0);
  color = mix(color, vec3(1.0, 0.83, 0.55), 0.96 * (1.0 - smoothstep(0.025, 0.028, angular)));

  vec2 p = ray.xz / (0.19 + h) * vec2(3.2, 10.0) + vec2(14.0, 3.0);
  float cloud = noise(p) * 0.58 + noise(p * 2.13) * 0.29 + noise(p * 4.27) * 0.13;
  float veil = smoothstep(0.59, 0.77, cloud) * smoothstep(0.015, 0.07, h) * (1.0 - smoothstep(0.20, 0.6, h));
  color = mix(color, mix(vec3(0.38, 0.47, 0.48), vec3(0.90, 0.64, 0.43), pow(facing, 4.0)), veil * 0.62);
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}`;

function makeSky(scene) {
  const material = new THREE.ShaderMaterial({
    uniforms: { sun: { value: sun } },
    vertexShader: `varying vec3 direction;
      void main() { direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: skyFragment,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 16), material);
  dome.renderOrder = -10;
  scene.add(dome);
  return dome;
}

function makeTerrain(scene) {
  const random = generator(39);
  const geometry = new THREE.PlaneGeometry(214, 232, 110, 116);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, -42);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) + (random() - 0.5) * 1.15;
    const z = positions.getZ(i) + (random() - 0.5) * 1.15;
    positions.setXYZ(i, x, ground(x, z), z);
  }
  const faces = geometry.toNonIndexed();
  const points = faces.attributes.position;
  const colors = [];
  const loam = new THREE.Color('#757856');
  const grass = new THREE.Color('#536650');
  const sand = new THREE.Color('#9d8e6f');
  const trail = new THREE.Color('#a69b76');
  const gravel = new THREE.Color('#b0a18b');
  const shale = new THREE.Color('#a68a76');
  for (let i = 0; i < points.count; i += 3) {
    const x = (points.getX(i) + points.getX(i + 1) + points.getX(i + 2)) / 3;
    const z = (points.getZ(i) + points.getZ(i + 1) + points.getZ(i + 2)) / 3;
    const y = ground(x, z);
    const color = grass.clone().lerp(loam, 0.5 + 0.5 * Math.sin(x * 0.15 + z * 0.15));
    color.lerp(sand, 1 - smooth(y, -0.6, 1.5));
    color.lerp(trail, (1 - smooth(trailDistance(x, z), 0.8, 3.0)) * 0.82);
    color.lerp(gravel, (1 - smooth(spurDistance(x, z), 0.65, 2.6)) * 0.77);
    color.lerp(shale, (1 - smooth(reedStairDistance(x, z), 0.85, 2.9)) * 0.86);
    color.multiplyScalar(0.85 + random() * 0.29);
    for (let j = 0; j < 3; j++) colors.push(color.r, color.g, color.b);
  }
  geometry.dispose();
  faces.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  faces.computeVertexNormals();
  scene.add(new THREE.Mesh(faces, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })));
}

function makeMountains(scene) {
  const ranges = [
    { z: -255, base: '#648681', relief: 64, seeds: [0.8, 0.48, 1.1, 0.77, 1.38, 1.05, 1.19, 0.62, 1.0] },
    { z: -177, base: '#516a66', relief: 55, seeds: [0.8, 1.23, 0.91, 0.64, 0.49, 0.69, 1.02, 1.49, 0.68] },
    { z: -126, base: '#3c5652', relief: 42, seeds: [1.12, 1.53, 1.10, 0.55, 0.30, 0.46, 0.77, 1.23, 1.57] },
  ];
  for (const [index, range] of ranges.entries()) {
    const random = generator(51 + index);
    const width = 450;
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });
    const position = [];
    const colors = [];
    const rows = 7;
    const columns = 61;
    const vertices = [];
    const stone = new THREE.Color(range.base);
    const lush = new THREE.Color('#384c49');
    const snow = new THREE.Color('#a8b4a6');
    for (let row = 0; row < rows; row++) {
      const t = row / (rows - 1);
      for (let col = 0; col < columns; col++) {
        const u = col / (columns - 1);
        const x = (u - 0.5) * width + (random() - 0.5) * 6;
        const peak = Math.max(...range.seeds.map((height, i) => {
          const center = (i + 0.45) / range.seeds.length;
          return height * Math.max(0, 1 - Math.abs(u - center) * (8.5 + 2 * Math.sin(i * 3.8)));
        }));
        const ridge = Math.pow(Math.sin(t * Math.PI), 1.12);
        const height = -5 + ridge * (13 + peak * range.relief + (random() - 0.5) * 13);
        const z = range.z - t * 96 + (random() - 0.5) * 11;
        vertices.push([x, height, z]);
      }
    }
    function face(a, b, c) {
      const height = (a[1] + b[1] + c[1]) / 3;
      const fade = smooth(height, range.relief * 0.24, range.relief * 0.72);
      const color = lush.clone().lerp(stone, fade * 0.82 + 0.18);
      color.lerp(snow, smooth(height, range.relief * 0.78, range.relief * 1.23) * (0.38 + random() * 0.49));
      color.multiplyScalar(0.83 + random() * 0.31);
      for (const point of [a, b, c]) {
        position.push(...point);
        colors.push(color.r, color.g, color.b);
      }
    }
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < columns - 1; i++) {
        const k = j * columns + i;
        const [a, b, c, d] = [vertices[k], vertices[k + 1], vertices[k + columns], vertices[k + columns + 1]];
        if ((i + j) % 2) {
          face(a, b, c);
          face(b, d, c);
        } else {
          face(a, b, d);
          face(a, d, c);
        }
      }
    }
    const mesh = new THREE.BufferGeometry();
    mesh.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
    mesh.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    mesh.computeVertexNormals();
    scene.add(new THREE.Mesh(mesh, material));
  }
}

function makeWater(scene) {
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, water: { value: water }, sky: { value: sky }, sun: { value: sun } },
    vertexShader: /* glsl */`
      varying vec3 world;
      void main() {
        world = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float time;
      uniform vec3 water, sky, sun;
      varying vec3 world;
      void main() {
        vec3 eye = normalize(cameraPosition - world);
        float a = sin(world.x * 1.22 + world.z * 1.76 + time * 0.82);
        float b = sin(world.x * 0.48 - world.z * 3.02 - time * 1.11);
        float c = sin(world.x * 2.15 + world.z * 3.83 + time * 0.45);
        vec3 refl = reflect(-eye, normalize(vec3(a * 0.034 + c * 0.019, 1.0, a * 0.044 + b * 0.034)));
        float fresnel = pow(1.0 - max(eye.y, 0.0), 3.0);
        float glow = pow(max(dot(refl, sun), 0.0), 100.0);
        float distanceFade = 1.0 - smoothstep(22.0, 135.0, length(cameraPosition - world));
        float ripple = smoothstep(0.71, 0.98, a * 0.58 + b * 0.29 + c * 0.13);
        vec3 color = mix(water * (0.58 + 0.055 * a + 0.032 * b), sky * 0.56, fresnel);
        color += vec3(0.85, 0.57, 0.27) * glow * (0.41 + 0.58 * ripple);
        color += vec3(0.15, 0.25, 0.22) * ripple * distanceFade * 0.30;
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(205, 220), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, waterline, -44);
  scene.add(mesh);
  return material.uniforms.time;
}

function instancer(scene, geometry, material, items) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  const pose = new THREE.Object3D();
  items.forEach(({ x, y, z, sx, sy, sz, tilt = 0, rotation = 0, color }, i) => {
    pose.position.set(x, y, z);
    pose.scale.set(sx, sy, sz);
    pose.rotation.set(0, rotation, tilt);
    pose.updateMatrix();
    mesh.setMatrixAt(i, pose.matrix);
    mesh.setColorAt(i, color);
  });
  scene.add(mesh);
}

function makePlants(scene) {
  const houseAisle = (x, z, width) => x > 24 && x < 45.5 && Math.abs(z - measureHouse.z) < width;
  const random = generator(42);
  const pick = (options) => options[Math.floor(random() * options.length)];
  const greens = ['#77894e', '#a39455', '#647b51', '#556d50', '#c1ab68', '#829060', '#9c7951'].map((color) => new THREE.Color(color));
  const blade = new THREE.BufferGeometry();
  blade.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.52, 0, 0, 0.52, 0, 0, 0.21, 1.0, 0.29,
    0, 0, -0.43, 0, 0, 0.43, -0.47, 0.72, 0.01,
    -0.33, 0, -0.30, 0.34, 0, 0.33, 0.54, 0.63, -0.09,
  ], 3));
  blade.computeVertexNormals();
  const grass = [];
  for (let i = 0; i < 24000; i++) {
    const x = random() * 137 - 64;
    const z = random() * 126 - 79;
    const y = ground(x, z);
    if (y < waterline + 0.13 || (trailDistance(x, z) < 1.55 && random() < 0.93)) continue;
    const tuft = 0.6 + random() * 0.7;
    grass.push({ x, y: y - 0.09, z, sx: tuft * 0.35, sy: tuft * (0.18 + random() * 0.69), sz: tuft * 0.54, rotation: random() * 6.28, color: pick(greens) });
  }
  instancer(scene, blade, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 1 }),
    grass.filter(({ x, z, sy }) => !houseAisle(x, z, 1.75) &&
      (Math.min(spurDistance(x, z), reedStairDistance(x, z)) > 1.25 || sy < 0.29)));

  const rocks = [];
  const rockColors = ['#66716c', '#555f62', '#aba18b', '#7e8776', '#3e5355'].map((color) => new THREE.Color(color));
  for (let i = 0; i < 455; i++) {
    const x = random() * 157 - 76;
    const z = random() * 164 - 109;
    const y = ground(x, z);
    if (y < waterline - 0.2 || trailDistance(x, z) < 2.1 || Math.hypot(x - 31, z + 53) < 13) continue;
    const size = 0.1 + Math.pow(random(), 4) * 2.7;
    rocks.push({ x, y, z, sx: size * 1.3, sy: size * (0.35 + random() * 0.65), sz: size, rotation: random() * 6, color: pick(rockColors) });
  }
  instancer(scene, new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ flatShading: true }), rocks.filter(({ x, z, sx }) => !houseAisle(x, z, 1.8 + sx) &&
    Math.min(spurDistance(x, z), reedStairDistance(x, z)) > Math.max(2.1, 1.15 + sx * 0.9)));

  const trunks = [];
  const houseClearance = (x, z) => x > 26 && x < 45 && Math.abs(z - measureHouse.z) < 8;
  const needles = [];
  const wood = new THREE.Color('#564940');
  const needlesColors = ['#354a44', '#455c4e', '#50624e', '#667353', '#384c4c'].map((color) => new THREE.Color(color));
  for (let i = 0; i < 245; i++) {
    const x = random() * 170 - 85;
    const z = random() * 147 - 115;
    const y = ground(x, z);
    if (y < 0.9 || (x > -32 && x < 48 && z > -80 && random() < 0.89)
      || Math.hypot(x - 27, z + 53) < 17 || Math.abs(x - shorePath(z)) < 5) continue;
    const height = 2.0 + random() * 6;
    const tilt = (random() - 0.5) * 0.22;
    const radius = height * (0.16 + random() * 0.10);
    if (houseClearance(x, z)) {
      // Consume the same samples so distant trees keep their authored silhouettes.
      for (let layer = 0; layer < 3; layer++) { random(); pick(needlesColors); }
      continue;
    }
    trunks.push({ x, y: y + height * 0.35, z, sx: 0.15, sy: height * 0.7, sz: 0.15, tilt, color: wood });
    for (let layer = 0; layer < 3; layer++) {
      needles.push({ x, y: y + height * (0.50 + layer * 0.20), z, sx: radius * (1 - layer * 0.23),
        sy: height * (0.62 - layer * 0.07), sz: radius * (1 - layer * 0.23), tilt, rotation: random() * 2,
        color: pick(needlesColors) });
    }
  }
  instancer(scene, new THREE.CylinderGeometry(0.5, 1.4, 1, 5), new THREE.MeshStandardMaterial(), trunks);
  instancer(scene, new THREE.ConeGeometry(1, 1, 5), new THREE.MeshStandardMaterial(), needles);
}

function makeRuins(scene) {
  const random = generator(900);
  const stone = ['#696d65', '#818073', '#928978', '#555e59', '#abb09b'].map((color) => (
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, flatShading: true })
  ));
  const metal = new THREE.MeshStandardMaterial({ color: '#9a7b53', metalness: 0.45, roughness: 0.42 });
  const light = new THREE.MeshBasicMaterial({ color: '#ffd18b' });
  const wornMetal = new THREE.MeshStandardMaterial({ color: '#65523c', roughness: 0.83 });
  const freshMetal = new THREE.MeshStandardMaterial({ color: '#dba064', roughness: 0.48, emissive: '#442719', emissiveIntensity: 0.28 });
  const box = new THREE.BoxGeometry();
  const pillar = new THREE.CylinderGeometry(0.86, 1, 1, 5);
  const shard = new THREE.IcosahedronGeometry(1, 0);

  function object(geometry, material, x, y, z, sx, sy, sz, yaw = 0, tilt = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.rotation.set(0, yaw, tilt);
    scene.add(mesh);
    return mesh;
  }

  function panel(x, bottom, z, sx, sy, sz, yaw = 0, tone = 0) {
    return object(box, stone[tone], x, bottom + sy / 2, z, sx, sy, sz, yaw);
  }

  const ringX = 35;
  const ringZ = -58;
  const base = ground(ringX, ringZ);
  const crown = new THREE.Group();
  crown.position.set(ringX, base + 3.1, ringZ);
  crown.rotation.y = -0.33;
  scene.add(crown);

  for (let i = 0; i < 4; i++) {
    panel(ringX, base - 0.9 + i * 0.59, ringZ - i * 0.28, 25 - 2.05 * i, 0.63, 12 - 1.25 * i, -0.33, i % 3);
  }
  panel(ringX, base + 1.46, ringZ - 0.8, 20.5, 1.5, 8.0, -0.33, 1);
  for (let i = 0; i < 12; i++) {
    const x = ringX + (random() - 0.5) * 38;
    const z = ringZ + 6 + (random() - 0.5) * 19;
    object(shard, stone[i % 4], x, ground(x, z) + 0.45, z, 0.5 + random() * 2.2, 0.8 + random() * 1.9, 0.6 + random() * 0.9, random() * 2, random() - 0.5);
  }

  const radius = 9.5;
  const ringCenterY = 9.62;
  const blocks = 22;
  for (let i = 0; i < blocks; i++) {
    if (i === 5 || i === 6 || i === 13) continue;
    const angle = i / blocks * Math.PI * 2;
    const shape = new THREE.Shape();
    const inner = radius - 1.14;
    const outer = radius + 1.15 + random() * 0.45;
    const end = angle + Math.PI * 2 / blocks - 0.012;
    shape.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    shape.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    shape.lineTo(Math.cos((angle + end) / 2) * (outer + 0.09), Math.sin((angle + end) / 2) * (outer + 0.09));
    shape.lineTo(Math.cos(end) * outer, Math.sin(end) * outer);
    shape.lineTo(Math.cos(end) * inner, Math.sin(end) * inner);
    shape.closePath();
    const depth = 1.42 + random() * 0.65;
    const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1, steps: 1 });
    const segment = new THREE.Mesh(geometry, stone[(i + (i % 3)) % stone.length]);
    segment.position.set(0, ringCenterY, -0.83);
    crown.add(segment);

    if (i % 5 !== 2) {
      const band = new THREE.Mesh(new THREE.RingGeometry(inner + 0.18, inner + 0.225, 6, 1, angle + 0.05, 0.18), light);
      band.position.set(0, ringCenterY, depth - 0.70);
      crown.add(band);
    }
  }
  [-10.5, 10.5].forEach((x, i) => {
    const stoneFoot = object(pillar, stone[1], ringX + x, base + 1.5, ringZ - 0.2, 1.35, 4.8, 1.55, 0.3, i ? -0.12 : 0.12);
    stoneFoot.rotation.x = 0.05;
  });
  const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), metal);
  pendant.scale.set(0.9, 3.0, 0.9);
  pendant.position.set(0, ringCenterY + 1.1, 0);
  crown.add(pendant);
  const innerLight = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), light);
  innerLight.scale.set(0.6, 1.1, 0.6);
  pendant.add(innerLight);
  const crownSite = discoveries[2];
  const crownY = ground(crownSite.x, crownSite.z);
  panel(crownSite.x, crownY - 0.08, crownSite.z, 0.62, 1.35, 0.47, -0.33, 0);
  for (let i = 0; i < 3; i++) {
    object(box, i === 2 ? freshMetal : wornMetal, crownSite.x - 0.15 + i * 0.14, crownY + 0.81, crownSite.z + 0.24, 0.038, 0.22, 0.026, -0.33, -0.17);
  }
  // Weathered stair fragments lead toward the foot of the monument.
  for (let i = 0; i < 7; i++) {
    const x = 33.6 - (i - 3) * 0.11;
    const z = -48.8 - i * 0.74;
    panel(x, THREE.MathUtils.lerp(ground(x, z) - 0.35, crownY, i * 0.085), z, 3.2 - (i % 3) * 0.21, 0.39, 0.81, -0.12, i % 3);
  }

  const threshold = discoveries[0];
  const y = ground(threshold.x, threshold.z);
  object(pillar, stone[0], threshold.x, y + 1.04, threshold.z, 0.77, 2.7, 0.48, 0.27, -0.17);
  panel(threshold.x + 0.58, y - 0.13, threshold.z + 0.34, 1.80, 0.31, 1.3, 0.26, 2);
  for (let i = 0; i < 3; i++) {
    object(box, i === 2 ? freshMetal : wornMetal, threshold.x + 0.09 + i * 0.16, y + 1.25 + i * 0.13, threshold.z + 0.49, 0.042 - i * 0.005, 0.45, 0.024, 0.14, -0.40);
  }

  const landing = discoveries[1];
  const dockY = ground(landing.x, landing.z);
  for (let i = 0; i < 8; i++) {
    const x = landing.x + (i - 4) * 0.88;
    const top = ground(x, landing.z) + 0.15;
    panel(x, top - 0.55, landing.z + 0.1 * Math.sin(i), 0.94, 0.55, 2.8 - i * 0.095, i * 0.035, i % 3);
  }
  object(pillar, stone[1], landing.x, dockY + 0.53, landing.z, 0.39, 1.3, 0.39, 0.6);
  object(new THREE.TorusGeometry(0.23, 0.047, 5, 11), freshMetal,
    landing.x - 0.29, dockY + 0.85, landing.z + 0.19, 1, 1, 1, -0.98);
  object(pillar, stone[0], landing.x + 1.65, ground(landing.x + 1.65, landing.z) + 0.38, landing.z - 0.9, 0.27, 1.4, 0.27, 0.7, 0.18);

  for (const [x, z] of [[-21, -28], [-20, -39], [-16, -53], [-7, -57], [3, -59], [14, -58], [25, -54]]) {
    const y = ground(x, z);
    object(shard, stone[2], x, y + 0.18, z, 0.59, 0.45, 0.55, 0.52);
    object(shard, stone[4], x - 0.05, y + 0.61, z, 0.38, 0.26, 0.34, 0.85);
    object(shard, stone[1], x + 0.01, y + 0.83, z, 0.24, 0.21, 0.22, 0.32);
  }

  // The broken opening stands across the old drainage bed, with room to pass beside it.
  const siltGate = discoveries.find(({ id }) => id === 'silt-gate');
  const gateY = ground(siltGate.x, siltGate.z);
  const basalt = new THREE.MeshStandardMaterial({ color: '#484f50', roughness: 0.94, flatShading: true });
  object(pillar, basalt, siltGate.x, gateY + 1.96, siltGate.z, 1.05, 4.65, 0.78, 0.23, -0.19);
  object(pillar, stone[0], -23.55, ground(-23.55, -41) + 1.52, -41, 0.83, 3.8, 0.67, -0.35, 0.19);
  object(shard, basalt, -30.4, ground(-30.4, -41.85) + 0.09, -41.85, 1.08, 0.55, 0.87, 0.72, -0.13);
  object(shard, stone[1], -29.15, gateY + 0.42, -40.2, 1.31, 0.83, 1.1, 0.52);
  for (let i = 0; i < 3; i++) {
    object(box, stone[2], siltGate.x + 0.42 + i * 0.057, gateY + 0.89 + i * 0.32, siltGate.z + 0.57,
      0.85 - i * 0.15, 0.045, 0.025, 0.23, -0.19);
  }
  // Rounded stones show the direction of the dry channel on either approach.
  for (const [x, z, size] of [
    [-25.0, -33.4, 0.42], [-26.0, -34.8, 0.32], [-27.3, -36.5, 0.53],
    [-26.8, -42.9, 0.44], [-26.9, -45.1, 0.53], [-26.0, -47.2, 0.36], [-24.2, -48.6, 0.45],
    [-22.0, -51.0, 0.32],
  ]) {
    object(shard, stone[2], x, ground(x, z) + size * 0.12, z, size, size * 0.43, size * 0.67, x);
  }

  // Silhouettes lead the eye between the overlook and the far side of the basin.
  for (const [x, z, height, tilt] of [
    [24, -39, 5.1, 0.16], [46, -45, 7.1, -0.08], [49, -47, 3.9, -0.18],
    [-26, -14, 3.4, -0.23], [-23, -19, 6.4, 0.12], [-25, -22, 4.5, 0.06],
    [51, -57, 5.0, -0.12], [13, -49, 4.2, 0.12], [9, -59, 6.7, 0.08],
    [-32, 25, 5.4, -0.21], [-29, 23, 2.7, 0.12], [-11, 26, 1.8, 0.20],
  ]) {
    const y = ground(x, z);
    panel(x, y - 0.35, z, 1.88, 0.68, 1.48, tilt * 2, 1);
    object(pillar, stone[0], x, y + height / 2, z, 0.69, height, 0.61, tilt * 3, tilt);
  }

  return pendant;
}

function makeDrift(scene) {
  const random = generator(814);
  const coordinates = new Float32Array(105 * 3);
  for (let i = 0; i < coordinates.length; i += 3) {
    coordinates[i] = random() * 115 - 57;
    coordinates[i + 1] = random() * 19;
    coordinates[i + 2] = random() * 111 - 76;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(coordinates, 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: '#f3cd8d', size: 0.095, opacity: 0.45, transparent: true, depthWrite: false,
  }));
  scene.add(points);
  return points;
}

export function landscape(scene) {
  scene.fog = new THREE.FogExp2('#96a19a', 0.0048);
  const dome = makeSky(scene);
  scene.add(new THREE.HemisphereLight('#e0e8d9', '#777b65', 1.40));
  const sunlight = new THREE.DirectionalLight('#ffd4a1', 2.2);
  sunlight.position.set(42, 48, -36);
  scene.add(sunlight);
  const skylight = new THREE.DirectionalLight('#afc8eb', 0.36);
  skylight.position.set(-40, 22, 60);
  scene.add(skylight);

  makeMountains(scene);
  makeTerrain(scene);
  const time = makeWater(scene);
  makePlants(scene);
  makeCrossing(scene);
  makeMeasureHouse(scene);
  const reedTime = makeReeds(scene);
  const pendant = makeRuins(scene);
  const drift = makeDrift(scene);

  return (elapsed, position) => {
    dome.position.copy(position);
    time.value = elapsed;
    reedTime.value = elapsed;
    drift.position.set(Math.sin(elapsed * 0.17) * 1.5, Math.sin(elapsed * 0.4) * 0.5, 0);
    pendant.rotation.y = elapsed * 0.16;
    pendant.position.y = 10.72 + Math.sin(elapsed * 0.72) * 0.38;
  };
}

import * as THREE from 'three';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import './style.css';
import { ambience } from './ambience.js';
import { discoveries, ground, landscape, spawn, waterline } from './landscape.js';

const get = (id) => document.getElementById(id);
const canvas = get('world');
const journal = get('journal');
const inspect = get('inspect');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(57, 1, 0.12, 550);
const keys = new Set();
const boundKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'KeyE', 'KeyJ']);
const storageKey = 'genesis:quiet-reach:journal:1';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
let renderer, animate, drag, near, noticeTimer, playAudio;
let exploring = false;
let soundOn = false;
let yaw = spawn.yaw;
let pitch = spawn.pitch;
let lastFrame = 0;
let elapsed = 0;
let footsteps = 0;
let tideWarningShown = false;

const found = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  for (const id of Array.isArray(saved) ? saved : []) {
    if (discoveries.some((site) => site.id === id)) found.add(id);
  }
} catch {
  // The current expedition still works when browser storage is unavailable.
}

function revertCamera() {
  yaw = spawn.yaw;
  pitch = spawn.pitch;
  camera.position.set(spawn.x, ground(spawn.x, spawn.z) + 1.67, spawn.z);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  camera.aspect = width / height;
  camera.fov = camera.aspect < 0.8 ? 70 : 57;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function announce(message) {
  clearTimeout(noticeTimer);
  get('message').textContent = message;
  noticeTimer = setTimeout(() => { get('message').textContent = ''; }, 3400);
}

function renderJournal() {
  get('journal-count').textContent = `${found.size} / ${discoveries.length}`;
  get('journal-summary').textContent = found.size
    ? `${found.size} of ${discoveries.length} field observations recorded.`
    : 'Your observations will be recorded here as you examine sites across the Reach.';
  const entries = get('entries');
  entries.replaceChildren();
  for (const { id, name, note } of discoveries) {
    if (!found.has(id)) continue;
    const item = document.createElement('li');
    const title = document.createElement('h3');
    const text = document.createElement('p');
    title.textContent = name;
    text.textContent = note;
    item.append(title, text);
    entries.append(item);
  }
}

function openJournal() {
  keys.clear();
  drag = undefined;
  renderJournal();
  journal.showModal();
}

function examine() {
  if (!exploring || journal.open || !near) return;
  found.add(near.id);
  try {
    localStorage.setItem(storageKey, JSON.stringify([...found]));
  } catch {
    // Entries remain available in memory for this visit.
  }
  openJournal();
}

function move(dt) {
  const forward = Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown'));
  const side = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  yaw += (Number(keys.has('ArrowLeft')) - Number(keys.has('ArrowRight'))) * 1.6 * dt;
  const { position } = camera;
  let moved = false;
  if (forward || side) {
    const running = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = (running ? 11.5 : 7.1) * dt / Math.hypot(forward, side);
    const x = THREE.MathUtils.clamp(position.x + (side * Math.cos(yaw) - forward * Math.sin(yaw)) * speed, -65, 69);
    const z = THREE.MathUtils.clamp(position.z - (side * Math.sin(yaw) + forward * Math.cos(yaw)) * speed, -104, 45);
    const canWalk = (nextX, nextZ) => ground(nextX, nextZ) >= waterline - 0.31;
    if (canWalk(x, z)) {
      moved = x !== position.x || z !== position.z;
      position.x = x;
      position.z = z;
    } else {
      if (canWalk(x, position.z) && x !== position.x) { position.x = x; moved = true; }
      if (canWalk(position.x, z) && z !== position.z) { position.z = z; moved = true; }
      if (!tideWarningShown) {
        tideWarningShown = true;
        announce('The water is too deep here. Follow the shore around the basin.');
      }
    }
  }
  if (moved) footsteps += dt * 10;
  const bob = moved && !reduceMotion ? Math.sin(footsteps) * 0.035 : 0;
  const height = Math.max(ground(position.x, position.z), waterline) + 1.67;
  position.y = THREE.MathUtils.damp(position.y, height + bob, 12, dt);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');

  near = discoveries.find((site) => Math.hypot(site.x - position.x, site.z - position.z) < 3.6);
  inspect.hidden = !near;
  if (near) inspect.querySelector('span').textContent = `Examine ${near.name}`;
  const bearing = Math.round(-yaw / (Math.PI / 4));
  const index = ((bearing % compass.length) + compass.length) % compass.length;
  get('heading-left').textContent = compass[(index + compass.length - 1) % compass.length];
  get('heading').textContent = compass[index];
  get('heading-right').textContent = compass[(index + 1) % compass.length];
  get('region').textContent = position.x > 18 && position.z < -30
    ? 'The Crown Bank'
    : position.z < 2 ? 'Stillwater Basin' : 'The Quiet Reach';
}

function draw(now) {
  const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
  lastFrame = now;
  if (exploring && !journal.open) move(dt);
  if (!reduceMotion && !journal.open) elapsed += dt;
  if (!exploring) {
    const openingYaw = camera.aspect < 0.8 ? -0.39 : spawn.yaw;
    camera.rotation.set(spawn.pitch, openingYaw, 0, 'YXZ');
  }
  animate(elapsed, camera.position);
  renderer.render(scene, camera);
}

try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  animate = landscape(scene);
  revertCamera();
  resize();
  renderer.setAnimationLoop(draw);
  window.addEventListener('resize', resize);
} catch (error) {
  console.error('The world failed to initialize', error);
  get('arrival').hidden = true;
  get('fallback').hidden = false;
}

get('enter').addEventListener('click', () => {
  exploring = true;
  yaw = spawn.yaw;
  get('experience').classList.add('exploring');
  get('arrival').hidden = true;
  get('field-hud').hidden = false;
  get('journal-button').hidden = false;
  canvas.tabIndex = 0;
  canvas.focus({ preventScroll: true });
  announce(matchMedia('(pointer: coarse)').matches ? 'Drag to look. Hold the arrows to walk.' : 'Walk the path. Drag the scene to look around.');
});

get('journal-button').addEventListener('click', openJournal);
get('close-journal').addEventListener('click', () => journal.close());
get('return').addEventListener('click', () => {
  revertCamera();
  near = undefined;
  tideWarningShown = false;
  journal.close();
  announce('Returned to the overlook.');
});
journal.addEventListener('close', () => canvas.focus({ preventScroll: true }));
inspect.addEventListener('click', examine);
get('sound').addEventListener('click', async () => {
  const button = get('sound');
  button.disabled = true;
  try {
    playAudio ??= ambience();
    await playAudio(!soundOn);
    soundOn = !soundOn;
    button.setAttribute('aria-pressed', String(soundOn));
    button.setAttribute('aria-label', soundOn ? 'Mute ambient sound' : 'Enable ambient sound');
    button.querySelector('span').textContent = soundOn ? 'Sound on' : 'Sound off';
  } catch {
    announce('Ambient sound is unavailable in this browser.');
  } finally {
    button.disabled = false;
  }
});

window.addEventListener('keydown', (event) => {
  if (!exploring || journal.open || !boundKeys.has(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
  event.preventDefault();
  keys.add(event.code);
  if (event.repeat) return;
  if (event.code === 'KeyE') examine();
  if (event.code === 'KeyJ') openJournal();
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => {
  keys.clear();
  drag = undefined;
});
canvas.addEventListener('pointerdown', (event) => {
  if (!exploring || event.button !== 0 || drag) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (drag?.id !== event.pointerId) return;
  yaw -= (event.clientX - drag.x) * 0.0042;
  pitch = THREE.MathUtils.clamp(pitch - (event.clientY - drag.y) * 0.0042, -1.12, 1.04);
  drag.x = event.clientX;
  drag.y = event.clientY;
});
canvas.addEventListener('lostpointercapture', (event) => {
  if (drag?.id === event.pointerId) drag = undefined;
});
for (const button of document.querySelectorAll('[data-key]')) {
  button.addEventListener('pointerdown', (event) => {
    button.setPointerCapture(event.pointerId);
    keys.add(button.dataset.key);
  });
  button.addEventListener('lostpointercapture', () => keys.delete(button.dataset.key));
}

renderJournal();

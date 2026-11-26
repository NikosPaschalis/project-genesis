import { MathUtils } from 'three';

export const spawn = { x: -18, z: 34, yaw: -0.17, pitch: -0.07 };
export const waterline = -0.55;

export const discoveries = [
  {
    id: 'threshold', name: 'The Leaning Stone', x: -18, z: 22, footprint: 0.98, targetHeight: 1.38,
    note: 'Three grooves turn toward the basin. Rain has softened two of them. The third still looks freshly cut.',
  },
  {
    id: 'landing', name: 'The Boatless Landing', x: -20.5, z: -21, footprint: 0.51, targetHeight: 0.86,
    note: 'A mooring ring is polished on its landward edge. Someone used to tie something here, on the wrong side of the water.',
  },
  {
    id: 'crown', name: 'The Listening Crown', x: 36, z: -48, footprint: 0.56, targetHeight: 0.86,
    note: 'The stone holds the day’s warmth. Pressing a palm to it, you feel three pulses and a silence long enough to mistake for an answer.',
  },
  {
    id: 'silt-gate', name: 'The Silt Gate', x: -28.2, z: -38.5, footprint: 1.3, targetHeight: 1.44,
    note: 'Three bands of silt cross the stone at a slant, each rising toward the hill. The water would have had to climb to leave them that way.',
  },
];

const smooth = MathUtils.smoothstep;
const river = (z) => 5 + Math.sin(z * 0.046 - 0.4) * 9;
const path = (z) => -18 + 2.4 * Math.sin((z - 20) * 0.077);

export function trailDistance(x, z) {
  if (z > -51) {
    const shore = Math.abs(x - path(z));
    if (z < 7 || z > 22 || x < -24 || x > -9) return shore;
    return Math.min(shore, distanceToPath(x, z, westApproach));
  }
  if (x < -20 || x > 35) return Infinity;
  return Math.abs(z + 55 + 2 * Math.sin((x + 13) * 0.11));
}

const westApproach = [[-18, 19], [-16, 15], [-12, 12], [-10, 12]];
const spur = [[-19.5, -27], [-23.4, -32], [-26.2, -38.5], [-25.7, -45.5], [-18.4, -53.5]];

export const reedStair = [[36, -46], [34, -38], [29, -30], [24, -22], [22, -15], [25, -7], [27, 3], [26, 12]];

function distanceToPath(x, z, points) {
  let distance = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1];
    const [bx, bz] = points[i];
    const dx = bx - ax;
    const dz = bz - az;
    const t = MathUtils.clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    distance = Math.min(distance, Math.hypot(x - ax - dx * t, z - az - dz * t));
  }
  return distance;
}

export function spurDistance(x, z) {
  if (x < -31 || x > -16 || z < -57 || z > -24) return Infinity;
  return distanceToPath(x, z, spur);
}

export function reedStairDistance(x, z) {
  if (x < 17 || x > 42 || z < -51 || z > 17) return Infinity;
  return distanceToPath(x, z, reedStair);
}
export function ground(x, z) {
  const bank = smooth(Math.abs(x - river(z)), 7.5, 22);
  const channel = 1 - smooth(z, -57, -42);
  const embankment = smooth(Math.max(Math.abs(x) - 40, -z - 65, z - 43), 0, 58);
  const rolls = 0.56 * Math.sin(x * 0.19 + z * 0.11) + 0.35 * Math.cos(z * 0.23 - x * 0.08);
  const overlook = 3.6 * smooth(z, 12, 44) * (1 - smooth(x, -18, -4));
  const mound = 3.8 * Math.exp(-((x - 37) ** 2 / 150 + (z + 51) ** 2 / 195));
  const shelf = 2.9 * (1 - smooth(Math.hypot((x + 34) / 10, (z + 42) / 15), 0.1, 1.6));
  const spurRidge = 4.1 * Math.exp(-(((x - 34) / 5.8) ** 2 + ((z + 25) / 14) ** 2));
  const reedShelf = 2.4 * Math.exp(-(((x - 27) / 7.2) ** 2 + ((z + 5) / 11) ** 2));
  return -2.4 + Math.max(bank, channel) * (3.8 + rolls) + overlook + embankment * 22 + mound + shelf + spurRidge + reedShelf;
}

export const crossing = { west: -12, east: 26, z: 12, halfWidth: 1.55 };

export function deckHeight(x) {
  const t = (x - crossing.west) / (crossing.east - crossing.west);
  const west = ground(crossing.west, crossing.z) + 0.14;
  const east = ground(crossing.east, crossing.z) + 0.14;
  return MathUtils.lerp(west, east, t) + Math.sin(Math.PI * t) * 0.37;
}

export function onDeck(x, z) {
  return x >= crossing.west && x <= crossing.east && Math.abs(z - crossing.z) <= crossing.halfWidth;
}

export function walkingHeight(x, z) {
  const terrain = ground(x, z);
  return onDeck(x, z) ? Math.max(terrain, deckHeight(x)) : Math.max(terrain, waterline);
}

export const bounds = { minX: -65, maxX: 69, minZ: -104, maxZ: 45 };

export function waterTooDeep(x, z) {
  return !onDeck(x, z) && ground(x, z) < waterline - 0.31;
}

export function canWalk(x, z) {
  return x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ &&
    !waterTooDeep(x, z) &&
    !discoveries.some((site) => Math.hypot(site.x - x, site.z - z) < site.footprint);
}

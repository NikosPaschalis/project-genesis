import { bounds, canWalk, ground, waterline } from '../src/geography.js';

// A cardinal half-metre grid gives a repeatable connectivity check, not a walking time estimate.
const spacing = 0.5;
const columns = 1 + (bounds.maxX - bounds.minX) / spacing;
const rows = 1 + (bounds.maxZ - bounds.minZ) / spacing;
const cell = (x, z) => Math.round((z - bounds.minZ) / spacing) * columns + Math.round((x - bounds.minX) / spacing);

function distanceBetween(start, finish) {
  const origin = cell(...start);
  const goal = cell(...finish);
  if (!canWalk(...start) || !canWalk(...finish)) return null;
  const distances = new Int32Array(columns * rows).fill(-1);
  const queue = [origin];
  distances[origin] = 0;
  for (let offset = 0; offset < queue.length; offset++) {
    const current = queue[offset];
    if (current === goal) return distances[current] * spacing;
    const column = current % columns;
    const row = Math.floor(current / columns);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = column + dx;
      const r = row + dz;
      if (c < 0 || c >= columns || r < 0 || r >= rows) continue;
      const next = r * columns + c;
      if (distances[next] !== -1 || !canWalk(bounds.minX + c * spacing, bounds.minZ + r * spacing)) continue;
      distances[next] = distances[current] + 1;
      queue.push(next);
    }
  }
  return null;
}

const transects = [12, 8, 4, 0].map((z) => {
  const start = [-15, z];
  const finish = [27, z];
  const submerged = [];
  const blocked = [];
  for (let x = start[0]; x <= finish[0]; x += spacing) {
    if (ground(x, z) < waterline - 0.31) submerged.push(x);
    if (!canWalk(x, z)) blocked.push(x);
  }
  return {
    west: start,
    east: finish,
    submergedSpan: submerged.length ? [submerged[0], submerged.at(-1)] : null,
    blockedCells: blocked.length,
    cardinalDistance: distanceBetween(start, finish),
  };
});

console.log(JSON.stringify({ spacing, transects }, null, 2));

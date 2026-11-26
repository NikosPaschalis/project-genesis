import { MathUtils } from 'three';
import { crossing, measureHouse } from './geography.js';

export function acousticField(x, z, yaw) {
  const stoneSource = measureHouse.walls[1].x;
  const dx = stoneSource - x;
  const dz = measureHouse.z - z;
  const distance = Math.hypot(dx, dz);
  const across = (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / Math.max(distance, 1);
  const enclosure = (1 - MathUtils.smoothstep(Math.abs(z - measureHouse.z), 2.4, 9.5)) *
    (1 - MathUtils.smoothstep(Math.abs(x - stoneSource), 6, 18));
  const nearWater = (1 - MathUtils.smoothstep(Math.abs(z - crossing.z), 1.6, 9)) *
    (1 - MathUtils.smoothstep(Math.abs(x - 7), 10, 22));
  return {
    wind: 1 - enclosure * 0.63,
    windCutoff: 330 + 180 * nearWater - 100 * enclosure,
    resonance: enclosure * (1 - MathUtils.smoothstep(distance, 3, 16)),
    pan: MathUtils.clamp(across, -1, 1),
  };
}

import { MathUtils } from 'three';
import { discoveries, ground, sightline } from './geography.js';

export function findObservation(position, yaw, pitch, fieldOfView) {
  return discoveries.find((site) => {
    if (site.id === 'seam') {
      return Math.abs(position.x - sightline.x) < 0.96 &&
        Math.abs(position.z - sightline.z) < 0.36 &&
        Math.abs(pitch - Math.atan(sightline.rise)) < 0.24 &&
        Math.cos(yaw - Math.PI / 2) > Math.cos(0.29);
    }
    const dx = site.x - position.x;
    const dz = site.z - position.z;
    const distance = Math.hypot(dx, dz);
    if (distance >= 3.6 || (-dx * Math.sin(yaw) - dz * Math.cos(yaw)) <= distance * 0.55) return false;
    const height = ground(site.x, site.z) + site.targetHeight - position.y;
    const targetPitch = Math.atan2(height, distance);
    const verticalAllowance = MathUtils.degToRad(fieldOfView * 0.5 + 8);
    return Math.abs(targetPitch - pitch) <= verticalAllowance;
  });
}

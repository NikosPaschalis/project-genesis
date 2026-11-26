import assert from 'node:assert/strict';
import test from 'node:test';
import { acousticField } from '../src/acoustics.js';
import { journalEvidence } from '../src/field-journal.js';
import {
  canWalk, crossing, deckHeight, discoveries, ground, measureHouse, reedStair,
  sightline, walkingHeight, waterline, waterTooDeep,
} from '../src/geography.js';
import { findObservation } from '../src/observations.js';
import { reedBed } from '../src/reeds.js';

test('the east trail is walkable and connects to both its ends', () => {
  for (let i = 1; i < reedStair.length; i++) {
    const [ax, az] = reedStair[i - 1];
    const [bx, bz] = reedStair[i];
    for (let step = 0; step <= 50; step++) {
      const fraction = step / 50;
      assert.ok(canWalk(ax + (bx - ax) * fraction, az + (bz - az) * fraction));
    }
  }
});

test('the deck supports movement while deep water blocks either side', () => {
  for (let x = crossing.west; x <= crossing.east; x += 0.125) {
    for (const offset of [-1.5, 0, 1.5]) {
      assert.ok(canWalk(x, crossing.z + offset));
      assert.ok(walkingHeight(x, crossing.z + offset) >= deckHeight(x));
    }
  }
  for (const x of [-5, 0, 5, 10, 15, 19]) {
    assert.ok(waterTooDeep(x, crossing.z - 1.75));
    assert.ok(waterTooDeep(x, crossing.z + 1.75));
  }
});

test('all stone bays have an open aisle and solid walls', () => {
  for (let x = 25; x <= 44; x += 0.125) {
    for (const offset of [-1.15, 0, 1.15]) assert.ok(canWalk(x, measureHouse.z + offset));
  }
  for (const wall of measureHouse.walls) {
    for (const side of [-1, 1]) {
      assert.equal(canWalk(wall.x, measureHouse.z + side * (wall.halfOpening + 1)), false);
      assert.ok(canWalk(wall.x, measureHouse.z + side * (wall.halfWidth + 0.7)));
    }
  }
});

test('the view observation requires both location and facing', () => {
  const { x, z, rise } = sightline;
  const eye = { x, z, y: ground(x, z) + 1.67 };
  for (const fov of [57, 70]) {
    assert.equal(findObservation(eye, Math.PI / 2, Math.atan(rise), fov)?.id, 'seam');
    assert.equal(findObservation(eye, Math.PI * 2.5, Math.atan(rise), fov)?.id, 'seam');
    for (const [dx, dz, yaw, pitch] of [
      [0, 0, Math.PI / 2 + 0.4, 0],
      [0, 0, -Math.PI / 2, 0],
      [0, 0.85, Math.PI / 2, 0],
      [1.3, 0, Math.PI / 2, 0],
      [0, 0, Math.PI / 2, 0.4],
    ]) {
      assert.notEqual(findObservation({ x: x + dx, z: z + dz, y: eye.y }, yaw, pitch, fov)?.id, 'seam');
    }
  }
});

test('the house inherits sound position and water has its own wind character', () => {
  const overlook = acousticField(-18, 34, 0);
  const deck = acousticField(7, crossing.z, 0);
  const center = acousticField(measureHouse.walls[1].x, measureHouse.z, 0);
  const approach = acousticField(30, measureHouse.z, 0);
  const reversed = acousticField(30, measureHouse.z, Math.PI);
  assert.equal(overlook.resonance, 0);
  assert.equal(deck.resonance, 0);
  assert.equal(center.resonance, 1);
  assert.ok(center.windCutoff < overlook.windCutoff && deck.windCutoff > overlook.windCutoff);
  assert.equal(approach.resonance, reversed.resonance);
  assert.equal(approach.pan, 1);
  assert.equal(reversed.pan, -1);
});

test('reed anchors stay above water and leave both bridge approaches clear', () => {
  const bed = reedBed();
  assert.deepEqual(bed, reedBed());
  assert.ok(bed.length > 25);
  assert.ok(bed.every(({ y, z }) => y >= waterline + .1 && y <= waterline + .53 && Math.abs(z - crossing.z) >= 3.2));
});

test('all discovery subsets preserve recorded order and reveal only known comparisons', () => {
  const ids = discoveries.map(site => site.id);
  for (let mask = 0; mask < 2 ** ids.length; mask++) {
    const known = ids.filter((_, index) => mask & (1 << index)).reverse();
    const { entries, comparisons } = journalEvidence(new Set([...known, 'obsolete-id']));
    assert.deepEqual(entries.map(site => site.id), known);
    for (const pair of comparisons) assert.ok(pair.sites.every(({ id }) => known.includes(id)));
  }
  assert.equal(journalEvidence(new Set(ids)).comparisons.length, 3);
  assert.equal(journalEvidence(new Set(['threshold', 'landing', 'crown', 'silt-gate'])).comparisons.length, 0);
});

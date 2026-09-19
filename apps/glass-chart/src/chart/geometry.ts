import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BAR_WIDTH = 0.62;
export const BAR_DEPTH = 0.62;
export const BAR_GAP = 0.3;
export const MAX_BAR_HEIGHT = 5.4;

/** Inset of the plastic core inside the glass shell, as a fraction of the bar. */
export const CORE_INSET = 0.58;

export const PLATE_THICKNESS = 0.16;
export const PLATE_PAD = 0.42;

function baseAnchored(geometry: THREE.BufferGeometry) {
  // Shift so y=0 is the foot of the bar; scaling y then grows it upwards.
  geometry.translate(0, 0.5, 0);
  return geometry;
}

/** Unit-height shell. Scale y by the bar height at draw time. */
export const shellGeometry = baseAnchored(
  new RoundedBoxGeometry(BAR_WIDTH, 1, BAR_DEPTH, 5, 0.055),
);

export const coreGeometry = baseAnchored(
  new RoundedBoxGeometry(BAR_WIDTH * CORE_INSET, 1, BAR_DEPTH * CORE_INSET, 4, 0.045),
);

/** The emissive puck that caps each bar. */
export const capGeometry = new RoundedBoxGeometry(
  BAR_WIDTH * 0.82,
  0.055,
  BAR_DEPTH * 0.82,
  3,
  0.024,
);

export function barOffsetX(index: number, count: number) {
  const pitch = BAR_WIDTH + BAR_GAP;
  return (index - (count - 1) / 2) * pitch;
}

export function rowWidth(count: number) {
  return count * BAR_WIDTH + (count - 1) * BAR_GAP;
}

/** The base slab's footprint. The rig frames against this, not the bars. */
export function plateWidth(count: number) {
  return rowWidth(count) + PLATE_PAD * 2;
}

export function plateDepth() {
  return BAR_DEPTH + PLATE_PAD * 2;
}

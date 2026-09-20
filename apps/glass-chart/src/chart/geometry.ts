import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BAR_WIDTH = 0.62;
export const BAR_DEPTH = 0.62;
export const BAR_GAP = 0.3;
export const MAX_BAR_HEIGHT = 5.4;

export const PLATE_THICKNESS = 0.16;
export const PLATE_PAD = 0.42;

/** A bar is one box. Nothing nested, nothing capping it. */
export type BarGeometries = {
  shell: THREE.BufferGeometry;
};

function baseAnchored(geometry: THREE.BufferGeometry) {
  // Shift so y=0 is the foot of the bar; scaling y then grows it upwards.
  geometry.translate(0, 0.5, 0);
  return geometry;
}

/** Below this the radius is not worth a rounded mesh; build a true box. */
const SHARP = 0.0015;

/**
 * Bars are square-edged by default: plain `BoxGeometry`, hard 90-degree
 * corners, per-face normals. That also sidesteps a wrinkle of the rest of the
 * rig — bars are unit-height and scaled on Y at draw time, so any corner
 * radius would stretch into an ellipse as a bar grows. A true box has nothing
 * to stretch.
 *
 * The dev sheet can still dial a radius in, which switches to a rounded mesh.
 */
export function makeBarGeometries(bevel: number): BarGeometries {
  const maxRadius = Math.min(BAR_WIDTH, BAR_DEPTH) / 2 - 0.01;
  const radius = THREE.MathUtils.clamp(bevel, 0, maxRadius);

  if (radius < SHARP) {
    return { shell: baseAnchored(new THREE.BoxGeometry(BAR_WIDTH, 1, BAR_DEPTH)) };
  }

  const segments = radius > 0.05 ? 4 : 2;
  return {
    shell: baseAnchored(new RoundedBoxGeometry(BAR_WIDTH, 1, BAR_DEPTH, segments, radius)),
  };
}

export function disposeBarGeometries(geometries: BarGeometries) {
  geometries.shell.dispose();
}

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

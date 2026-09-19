import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const BAR_WIDTH = 0.62;
export const BAR_DEPTH = 0.62;
export const BAR_GAP = 0.3;
export const MAX_BAR_HEIGHT = 5.4;

/** Inset of the core inside a translucent shell, as a fraction of the bar. */
export const CORE_INSET = 0.58;

export const PLATE_THICKNESS = 0.16;
export const PLATE_PAD = 0.42;

export type BarGeometries = {
  shell: THREE.BufferGeometry;
  core: THREE.BufferGeometry;
  cap: THREE.BufferGeometry;
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
    return {
      shell: baseAnchored(new THREE.BoxGeometry(BAR_WIDTH, 1, BAR_DEPTH)),
      core: baseAnchored(
        new THREE.BoxGeometry(BAR_WIDTH * CORE_INSET, 1, BAR_DEPTH * CORE_INSET),
      ),
      cap: new THREE.BoxGeometry(BAR_WIDTH * 0.84, 0.05, BAR_DEPTH * 0.84),
    };
  }

  const segments = radius > 0.05 ? 4 : 2;
  return {
    shell: baseAnchored(new RoundedBoxGeometry(BAR_WIDTH, 1, BAR_DEPTH, segments, radius)),
    core: baseAnchored(
      new RoundedBoxGeometry(
        BAR_WIDTH * CORE_INSET,
        1,
        BAR_DEPTH * CORE_INSET,
        segments,
        Math.min(radius, BAR_WIDTH * CORE_INSET * 0.45),
      ),
    ),
    // The cap is thin, so its radius has to stay under half its height or
    // RoundedBoxGeometry degenerates.
    cap: new RoundedBoxGeometry(
      BAR_WIDTH * 0.84,
      0.05,
      BAR_DEPTH * 0.84,
      2,
      Math.min(radius, 0.018),
    ),
  };
}

export function disposeBarGeometries(geometries: BarGeometries) {
  geometries.shell.dispose();
  geometries.core.dispose();
  geometries.cap.dispose();
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

import * as THREE from 'three';

/**
 * Where the light is being pushed from.
 *
 * The pointer writes to this from inside the Canvas; the device's tilt writes
 * to it from outside. It is a plain mutable singleton rather than React state
 * because it changes every frame and is only ever read inside `useFrame` —
 * routing it through the reconciler would re-render the scene tree sixty
 * times a second to move a highlight.
 */
export const lightInput = {
  /** Pointer over the canvas, -1..1, origin at centre. */
  pointerX: 0,
  pointerY: 0,
  /** True once the pointer has actually been over the canvas. */
  pointerSeen: false,
  /** Device tilt, already normalised to roughly -1..1. */
  tiltX: 0,
  tiltY: 0,
  hasTilt: false,
};

/** Smoothed aim, so a jumpy sensor or a fast flick doesn't strobe the rim. */
const smoothed = { x: 0, y: 0 };

/**
 * Combines pointer and tilt into a single -1..1 aim. Tilt wins when the
 * device reports it, since on a phone there is no pointer to speak of; the
 * pointer is the desktop and simulator fallback.
 */
export function aim(damping: number, delta: number) {
  const targetX = lightInput.hasTilt ? lightInput.tiltX : lightInput.pointerX;
  const targetY = lightInput.hasTilt ? lightInput.tiltY : lightInput.pointerY;
  const t = 1 - Math.exp(-damping * Math.min(delta, 1 / 20));
  smoothed.x += (targetX - smoothed.x) * t;
  smoothed.y += (targetY - smoothed.y) * t;
  return smoothed;
}

const scratch = new THREE.Vector3();

/**
 * The aim as a world-space direction pointing from the scene towards the
 * light, for the edge highlight and the caustic offset.
 */
export function aimDirection(damping: number, delta: number, spread: number) {
  const a = aim(damping, delta);
  return scratch.set(a.x * spread, 0.55 + a.y * spread * 0.5, 1).normalize();
}

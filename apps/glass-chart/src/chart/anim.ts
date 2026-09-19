import { MathUtils } from 'three';

/**
 * Frame-rate independent exponential smoothing. `lambda` is roughly
 * "how much of the gap is closed per second" — higher is snappier.
 */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return MathUtils.damp(current, target, lambda, Math.min(dt, 1 / 20));
}

/** Critically-damped spring, for anything that should overshoot a little. */
export class Spring {
  value: number;
  velocity = 0;

  constructor(
    value: number,
    private stiffness = 120,
    private damping = 18,
  ) {
    this.value = value;
  }

  step(target: number, dt: number) {
    // Clamp dt so a dropped frame can never blow the integrator up.
    const step = Math.min(dt, 1 / 20);
    const accel = (target - this.value) * this.stiffness - this.velocity * this.damping;
    this.velocity += accel * step;
    this.value += this.velocity * step;
    return this.value;
  }
}

export const clamp = MathUtils.clamp;

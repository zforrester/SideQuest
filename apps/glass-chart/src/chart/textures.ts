import * as THREE from 'three';

/**
 * Procedural data maps. Generated in code so the app still ships no image
 * assets — the point of these is micro-variation: a powder coat that is
 * perfectly uniform reads as plastic, and a brushed metal needs its grain.
 */

function makeRgbTexture(
  size: number,
  fill: (x: number, y: number) => [number, number, number],
) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const [r, g, b] = fill(x, y);
      data[i] = Math.max(0, Math.min(255, Math.round(r * 255)));
      data[i + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
      data[i + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function makeDataTexture(size: number, fill: (x: number, y: number) => number) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const v = Math.max(0, Math.min(255, Math.round(fill(x, y) * 255)));
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Value noise: smoother and less fizzy than raw per-texel random. */
function valueNoise(size: number, cells: number, seed: number) {
  const grid: number[] = [];
  let state = seed;
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  for (let i = 0; i < cells * cells; i++) grid.push(rand());

  const at = (cx: number, cy: number) =>
    grid[((cy + cells) % cells) * cells + ((cx + cells) % cells)];

  return (x: number, y: number) => {
    const fx = (x / size) * cells;
    const fy = (y / size) * cells;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    // Smoothstep the interpolation so cell edges don't show.
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const top = at(x0, y0) * (1 - sx) + at(x0 + 1, y0) * sx;
    const bottom = at(x0, y0 + 1) * (1 - sx) + at(x0 + 1, y0 + 1) * sx;
    return top * (1 - sy) + bottom * sy;
  };
}

let dusted: THREE.Texture | null = null;

/** Fine speckle for a powder-coated finish. Two octaves, mostly high frequency. */
export function dustedRoughness() {
  if (dusted) return dusted;
  const size = 256;
  const fine = valueNoise(size, 96, 7);
  const broad = valueNoise(size, 12, 31);
  dusted = makeDataTexture(size, (x, y) => 0.62 + fine(x, y) * 0.3 + broad(x, y) * 0.12);
  dusted.repeat.set(2, 5);
  return dusted;
}

let bisque: THREE.Texture | null = null;

/** Soft, broad undulation for an unglazed ceramic surface. */
export function ceramicRoughness() {
  if (bisque) return bisque;
  const size = 128;
  const broad = valueNoise(size, 8, 101);
  const fine = valueNoise(size, 40, 17);
  bisque = makeDataTexture(size, (x, y) => 0.68 + broad(x, y) * 0.22 + fine(x, y) * 0.08);
  bisque.repeat.set(1, 3);
  return bisque;
}

let brushed: THREE.Texture | null = null;

/** Vertical grain for brushed metal: noise stretched along one axis. */
export function brushedRoughness() {
  if (brushed) return brushed;
  const size = 256;
  const streak = valueNoise(size, 160, 5);
  const drift = valueNoise(size, 6, 61);
  // Sampling the same row repeatedly stretches the noise into strands.
  brushed = makeDataTexture(size, (x, y) => 0.1 + streak(x, y * 0.06) * 0.26 + drift(x, y) * 0.07);
  brushed.repeat.set(3, 1);
  return brushed;
}

let frostRough: THREE.Texture | null = null;

/** Broad, shallow variation: etched glass is uneven, not grainy. */
export function frostRoughness() {
  if (frostRough) return frostRough;
  const size = 256;
  const broad = valueNoise(size, 14, 211);
  const fine = valueNoise(size, 56, 89);
  frostRough = makeDataTexture(size, (x, y) => 0.24 + broad(x, y) * 0.5 + fine(x, y) * 0.16);
  frostRough.repeat.set(2, 4);
  return frostRough;
}

let frostNorm: THREE.Texture | null = null;

/**
 * Tangent-space normals derived from the same kind of noise, so the frosting
 * bends light rather than only dulling it — a roughness map alone flattens
 * the surface instead of scattering across it.
 *
 * three perturbs normals from screen-space derivatives when a mesh has no
 * tangents, so a plain box needs no extra attributes for this.
 */
export function frostNormal() {
  if (frostNorm) return frostNorm;
  const size = 256;
  const height = valueNoise(size, 28, 401);
  const strength = 2.4;
  frostNorm = makeRgbTexture(size, (x, y) => {
    // Central differences on the height field give the surface gradient.
    const dx = (height(x + 1, y) - height(x - 1, y)) * strength;
    const dy = (height(x, y + 1) - height(x, y - 1)) * strength;
    const len = Math.hypot(dx, dy, 1);
    return [(-dx / len) * 0.5 + 0.5, (-dy / len) * 0.5 + 0.5, 1 / len * 0.5 + 0.5];
  });
  frostNorm.repeat.set(2, 4);
  return frostNorm;
}

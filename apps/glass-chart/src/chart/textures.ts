import * as THREE from 'three';

/**
 * Procedural surface detail. Generated in code so the app still ships no
 * image assets.
 *
 * These earn their place: a perfectly smooth, perfectly uniform surface is
 * the clearest tell that something is computer generated. Real materials
 * vary — a powder coat speckles, brushed metal runs in strands, moulded
 * plastic has orange peel, bisque is faintly lumpy — and it is that variation
 * breaking up the highlights that sells them.
 */

function makeTexture(
  size: number,
  data: Uint8Array,
  repeat: [number, number],
) {
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.needsUpdate = true;
  return texture;
}

function grey(size: number, repeat: [number, number], fill: (x: number, y: number) => number) {
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
  return makeTexture(size, data, repeat);
}

/** Tangent-space normals from a height field, by central differences. */
function normalFromHeight(
  size: number,
  repeat: [number, number],
  strength: number,
  height: (x: number, y: number) => number,
) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = (height(x + 1, y) - height(x - 1, y)) * strength;
      const dy = (height(x, y + 1) - height(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      data[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  return makeTexture(size, data, repeat);
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

/** Lazily build each map once and hand out the same instance thereafter. */
function once<T>(build: () => T) {
  let value: T | null = null;
  return () => {
    if (value === null) value = build();
    return value;
  };
}

const SIZE = 256;

// --- powder-coated metal -------------------------------------------------

export const dustedRoughness = once(() => {
  const fine = valueNoise(SIZE, 96, 7);
  const broad = valueNoise(SIZE, 12, 31);
  return grey(SIZE, [2, 5], (x, y) => 0.62 + fine(x, y) * 0.3 + broad(x, y) * 0.12);
});

export const dustedNormal = once(() => {
  const fine = valueNoise(SIZE, 110, 13);
  return normalFromHeight(SIZE, [2, 5], 1.6, fine);
});

// --- unglazed ceramic ----------------------------------------------------

export const ceramicRoughness = once(() => {
  const broad = valueNoise(SIZE, 8, 101);
  const fine = valueNoise(SIZE, 40, 17);
  return grey(SIZE, [1, 3], (x, y) => 0.68 + broad(x, y) * 0.22 + fine(x, y) * 0.08);
});

export const ceramicNormal = once(() => {
  const broad = valueNoise(SIZE, 10, 103);
  const fine = valueNoise(SIZE, 44, 19);
  return normalFromHeight(SIZE, [1, 3], 2.2, (x, y) => broad(x, y) * 0.8 + fine(x, y) * 0.2);
});

// --- brushed metal -------------------------------------------------------

/** Sampling the same row repeatedly stretches the noise into strands. */
export const brushedRoughness = once(() => {
  const streak = valueNoise(SIZE, 160, 5);
  const drift = valueNoise(SIZE, 6, 61);
  return grey(SIZE, [3, 1], (x, y) => 0.1 + streak(x, y * 0.06) * 0.26 + drift(x, y) * 0.07);
});

export const brushedNormal = once(() => {
  const streak = valueNoise(SIZE, 190, 23);
  return normalFromHeight(SIZE, [3, 1], 1.1, (x, y) => streak(x, y * 0.05));
});

// --- injection-moulded plastic -------------------------------------------

/** Orange peel: the shallow, broad dimpling a moulded surface always has. */
export const orangePeelNormal = once(() => {
  const peel = valueNoise(SIZE, 26, 307);
  const fine = valueNoise(SIZE, 70, 311);
  return normalFromHeight(SIZE, [2, 4], 1.3, (x, y) => peel(x, y) * 0.85 + fine(x, y) * 0.15);
});

export const orangePeelRoughness = once(() => {
  const peel = valueNoise(SIZE, 26, 313);
  return grey(SIZE, [2, 4], (x, y) => 0.28 + peel(x, y) * 0.14);
});

// --- shared wear ---------------------------------------------------------

/**
 * Fine scratches for the clear coat. Nothing that has been handled is
 * flawless, and a clearcoat with a perfectly even roughness reads as a
 * render every time.
 */
export const scratchRoughness = once(() => {
  const streak = valueNoise(SIZE, 150, 811);
  const sparse = valueNoise(SIZE, 9, 823);
  return grey(SIZE, [2, 2], (x, y) => {
    const line = streak(x * 0.9, y * 0.04);
    // Only the deepest part of each strand becomes a scratch.
    const scratch = Math.max(0, line - 0.72) * 3.4;
    return 0.06 + scratch * 0.5 + sparse(x, y) * 0.06;
  });
});

// --- etched glass --------------------------------------------------------

export const frostRoughness = once(() => {
  const broad = valueNoise(SIZE, 14, 211);
  const fine = valueNoise(SIZE, 56, 89);
  return grey(SIZE, [2, 4], (x, y) => 0.24 + broad(x, y) * 0.5 + fine(x, y) * 0.16);
});

/**
 * three perturbs normals from screen-space derivatives when a mesh has no
 * tangents, so a plain box needs no extra attributes for this.
 */
export const frostNormal = once(() => {
  const height = valueNoise(SIZE, 28, 401);
  return normalFromHeight(SIZE, [2, 4], 2.4, height);
});

// --- the slab ------------------------------------------------------------

export const slabRoughness = once(() => {
  const broad = valueNoise(SIZE, 7, 907);
  const fine = valueNoise(SIZE, 34, 911);
  return grey(SIZE, [3, 1], (x, y) => 0.34 + broad(x, y) * 0.24 + fine(x, y) * 0.1);
});

export const slabNormal = once(() => {
  const broad = valueNoise(SIZE, 9, 919);
  return normalFromHeight(SIZE, [3, 1], 1.2, broad);
});

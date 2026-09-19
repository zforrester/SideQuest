/**
 * Everything the dev sheet can reach. Kept in one place so the sheet, the
 * defaults and the scene can't drift apart.
 */
export type DevConfig = {
  cameraDistance: number;
  cameraHeight: number;
  fov: number;
  yaw: number;
  pitch: number;
  /** Fraction of the canvas the auto-framing aims to fill. */
  fill: number;
  exposure: number;
  /** Corner radius of the bars, in world units. Zero is a true box. */
  bevel: number;
  rimStrength: number;
  rimPower: number;
  causticIntensity: number;
  /** Multiplies each glass finish's own dispersion amount. */
  dispersion: number;
  /** Multiplies each glass finish's own frost depth. */
  frost: number;
  /** How far the pointer or tilt swings the light. */
  lightFollow: number;
  growDuration: number;
  stagger: number;
  autoSway: boolean;
  caustics: boolean;
  edgeHighlight: boolean;
};

export const DEFAULT_DEV: DevConfig = {
  cameraDistance: 8.6,
  cameraHeight: 2.6,
  fov: 36,
  yaw: 0.58,
  pitch: 0.34,
  fill: 0.94,
  exposure: 1,
  bevel: 0,
  rimStrength: 0.9,
  rimPower: 3.2,
  causticIntensity: 1.1,
  dispersion: 1,
  frost: 1,
  lightFollow: 0.85,
  growDuration: 0.6,
  stagger: 0.08,
  autoSway: true,
  caustics: true,
  edgeHighlight: true,
};

export type DevSliderSpec = {
  key: keyof DevConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  /** Decimal places when the value is printed. */
  precision?: number;
};

export type DevToggleSpec = { key: keyof DevConfig; label: string };

export const DEV_GROUPS: {
  title: string;
  sliders: DevSliderSpec[];
  toggles?: DevToggleSpec[];
}[] = [
  {
    title: 'Camera',
    sliders: [
      { key: 'cameraDistance', label: 'Distance', min: 5, max: 16, step: 0.1 },
      { key: 'cameraHeight', label: 'Height', min: -1, max: 7, step: 0.1 },
      { key: 'fov', label: 'Field of view', min: 18, max: 60, step: 1, precision: 0 },
      { key: 'fill', label: 'Frame fill', min: 0.5, max: 1.2, step: 0.01, precision: 2 },
    ],
  },
  {
    title: 'Angle',
    sliders: [
      { key: 'yaw', label: 'Yaw', min: -1.6, max: 1.6, step: 0.01, precision: 2 },
      { key: 'pitch', label: 'Pitch', min: -0.12, max: 0.75, step: 0.01, precision: 2 },
    ],
    toggles: [{ key: 'autoSway', label: 'Idle sway' }],
  },
  {
    title: 'Light',
    sliders: [
      { key: 'exposure', label: 'Exposure', min: 0.5, max: 1.8, step: 0.01, precision: 2 },
      { key: 'lightFollow', label: 'Follow pointer / tilt', min: 0, max: 1.6, step: 0.01, precision: 2 },
      { key: 'rimStrength', label: 'Edge highlight', min: 0, max: 3, step: 0.02, precision: 2 },
      { key: 'rimPower', label: 'Edge falloff', min: 1, max: 8, step: 0.1 },
      { key: 'causticIntensity', label: 'Caustics', min: 0, max: 2.5, step: 0.02, precision: 2 },
      { key: 'dispersion', label: 'Glass dispersion', min: 0, max: 3, step: 0.02, precision: 2 },
      { key: 'frost', label: 'Glass frosting', min: 0, max: 3, step: 0.02, precision: 2 },
    ],
    toggles: [
      { key: 'edgeHighlight', label: 'Edge highlights' },
      { key: 'caustics', label: 'Caustics' },
    ],
  },
  {
    title: 'Form & motion',
    sliders: [
      { key: 'bevel', label: 'Edge radius', min: 0, max: 0.12, step: 0.002, precision: 3 },
      { key: 'growDuration', label: 'Grow duration', min: 0.15, max: 2, step: 0.05, precision: 2 },
      { key: 'stagger', label: 'Stagger', min: 0, max: 0.3, step: 0.01, precision: 2 },
    ],
  },
];

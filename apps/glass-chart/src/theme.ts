import type { ColorValue } from 'react-native';

/**
 * A single source of truth for the palette. The 3D scene and the 2D chrome
 * pull from the same values so the glass UI reads as part of the render.
 */

export type Finish = 'glass' | 'plastic' | 'hybrid';

export const FINISHES: { id: Finish; label: string; blurb: string }[] = [
  { id: 'hybrid', label: 'Hybrid', blurb: 'Plastic core suspended in a glass shell' },
  { id: 'glass', label: 'Glass', blurb: 'Hollow shell, double-sided and refractive' },
  { id: 'plastic', label: 'Plastic', blurb: 'Solid injection-moulded clearcoat' },
];

/** Cool -> hot ramp. Reads well against the near-black backdrop. */
export const SERIES_COLORS = [
  '#4cc9f0',
  '#4895ef',
  '#4361ee',
  '#7209b7',
  '#b5179e',
  '#f72585',
] as const;

export const BACKDROP_GRADIENT: ColorValue[] = ['#05060e', '#0b1030', '#120a2a', '#05060e'];

export const UI = {
  text: '#f2f4ff',
  textDim: 'rgba(242, 244, 255, 0.62)',
  textFaint: 'rgba(242, 244, 255, 0.38)',
  hairline: 'rgba(255, 255, 255, 0.14)',
  panel: 'rgba(255, 255, 255, 0.07)',
  panelStrong: 'rgba(255, 255, 255, 0.13)',
} as const;

/** Environment emitters used to bake the reflection probe (see Studio.tsx). */
export const STUDIO_EMITTERS = {
  key: '#ffffff',
  fillCool: '#2fd8ff',
  fillWarm: '#ff4fa3',
  rim: '#7b5cff',
} as const;

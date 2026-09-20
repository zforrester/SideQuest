import type { ColorValue } from 'react-native';

/**
 * A single source of truth for the palette. The 3D scene and the 2D chrome
 * pull from the same values so the frosted UI reads as part of the render.
 *
 * The scheme is a warm near-white studio with sage and olive accents — the
 * chart's own materials supply all the colour, so the surrounding chrome
 * stays almost monochrome and gets out of their way.
 */

export type Lighting = 'studio' | 'daylight' | 'dusk';

export const LIGHTING: { id: Lighting; label: string; blurb: string }[] = [
  { id: 'studio', label: 'Studio', blurb: 'Neutral softbox — true material colour' },
  { id: 'daylight', label: 'Daylight', blurb: 'Cool sky above, warm bounce below' },
  { id: 'dusk', label: 'Dusk', blurb: 'Low amber key, deep sage shadow' },
];

/**
 * The 3D scene needs an opaque background of its own for refraction to have
 * anything to sample, so the page gradient is kept within a few values of it
 * — otherwise the canvas edge shows as a visible band.
 */
export const SCENE_BACKGROUND = '#ebece5';

export const BACKDROP_GRADIENT: ColorValue[] = ['#eff0ea', '#ecede6', '#e9eae2', '#eeefe8'];

/** Near-black used for the primary pills, matching the reference chrome. */
export const INK = '#16181a';

export const UI = {
  text: '#1b1d1e',
  textDim: 'rgba(27, 29, 30, 0.58)',
  textFaint: 'rgba(27, 29, 30, 0.36)',
  hairline: 'rgba(27, 29, 30, 0.1)',
  panel: 'rgba(255, 255, 255, 0.5)',
  panelStrong: 'rgba(255, 255, 255, 0.68)',
  /** The sage card, lifted from the reference's storage panel. */
  sage: ['#c3cbb0', '#d5dac6'] as [string, string],
  sageInk: '#22261b',
  sageInkDim: 'rgba(34, 38, 27, 0.6)',
  rise: '#3f6f4e',
  fall: '#a04a52',
} as const;

/**
 * Emitters used to bake each lighting preset's reflection probe.
 *
 * `shell` is the key value here. A uniformly white room gives polished metal
 * nothing to reflect and it renders as flat grey card — real studios put
 * bright sources against a much darker surround, and that contrast is what
 * makes nickel read as nickel. The scene still sits on a near-white page
 * because the canvas is transparent; only what the bars *reflect* is dark.
 */
export const STUDIO_PRESETS: Record<
  Lighting,
  {
    shell: string;
    key: { color: string; power: number };
    left: { color: string; power: number };
    right: { color: string; power: number };
    back: { color: string; power: number };
    floor: { color: string; power: number };
    /** Direct lights layered on top of the probe. */
    keyLight: string;
    fillLight: string;
    ambient: string;
    ambientPower: number;
    exposure: number;
  }
> = {
  studio: {
    shell: '#4c4f4a',
    key: { color: '#ffffff', power: 2.6 },
    left: { color: '#eaf1f4', power: 1.3 },
    right: { color: '#fff6e8', power: 1 },
    back: { color: '#2e312d', power: 1 },
    floor: { color: '#d8d9d2', power: 0.55 },
    keyLight: '#fffdf8',
    fillLight: '#cfdae0',
    ambient: '#9aa09a',
    ambientPower: 0.5,
    exposure: 1.05,
  },
  daylight: {
    shell: '#5d6b78',
    key: { color: '#eaf4ff', power: 3.1 },
    left: { color: '#bcd8f2', power: 1.45 },
    right: { color: '#ffeccd', power: 1.15 },
    back: { color: '#3c4a56', power: 1.2 },
    floor: { color: '#e6dcc8', power: 0.8 },
    keyLight: '#ffffff',
    fillLight: '#a8c8e8',
    ambient: '#9fb2c4',
    ambientPower: 0.55,
    exposure: 1.02,
  },
  dusk: {
    shell: '#3a3a36',
    key: { color: '#ffc98a', power: 2.3 },
    left: { color: '#6d7a64', power: 0.9 },
    right: { color: '#ffb066', power: 1.35 },
    back: { color: '#26261f', power: 0.9 },
    floor: { color: '#b3a58c', power: 0.5 },
    keyLight: '#ffc793',
    fillLight: '#7f8f7d',
    ambient: '#8a8274',
    ambientPower: 0.45,
    exposure: 1.1,
  },
};

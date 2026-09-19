import * as THREE from 'three';

import {
  brushedRoughness,
  ceramicRoughness,
  dustedRoughness,
  frostNormal,
  frostRoughness,
} from './textures';

/**
 * The material library. Each bar in the row wears a different one, so the
 * chart doubles as a swatch board: plastic, frosted glass, tinted glass,
 * polished metal, matte ceramic, powder-coated metal.
 *
 * `solid` materials are one opaque mesh. `translucent` ones are drawn as a
 * back-face pass and a front-face pass over the same geometry, with an
 * optional inner core so the glass reads as cast rather than hollow.
 */

export type MaterialId =
  | 'ceramic'
  | 'seafoam'
  | 'quartz'
  | 'olive'
  | 'nickel'
  | 'titanium';

export type MaterialSpec = {
  id: MaterialId;
  /** Shown in the readout when the bar is selected. */
  name: string;
  /** Swatch colour for the 2D chrome. */
  swatch: string;
  /** Whether the swatch needs dark or light text on top of it. */
  swatchInk: 'dark' | 'light';
  kind: 'solid' | 'translucent';
  /**
   * How much this finish splits light into a spectrum along its edges.
   * Zero for anything opaque — chromatic fringing on a metal edge is not a
   * thing that happens.
   */
  dispersion?: number;
  /** Depth of the etched surface wobble, scaling the frost normal map. */
  frost?: number;
  /** Props for the single opaque mesh, or for the glass shell. */
  surface: THREE.MeshPhysicalMaterialParameters;
  /** Back-face pass, translucent materials only. */
  backface?: THREE.MeshPhysicalMaterialParameters;
  /** Inner volume that gives translucent bars some density. */
  core?: THREE.MeshPhysicalMaterialParameters;
};

/** Lazily built so the procedural textures are only generated if used. */
export function materialLibrary(): Record<MaterialId, MaterialSpec> {
  return {
    ceramic: {
      id: 'ceramic',
      name: 'Chalk ceramic',
      swatch: '#d8d3c6',
      swatchInk: 'dark',
      kind: 'solid',
      surface: {
        color: '#ddd8cb',
        roughness: 0.92,
        metalness: 0,
        roughnessMap: ceramicRoughness(),
        // Unglazed bisque has almost no specular lobe to speak of.
        specularIntensity: 0.22,
        sheen: 0.35,
        sheenColor: new THREE.Color('#fffaf0'),
        sheenRoughness: 0.9,
        envMapIntensity: 0.85,
      },
    },

    seafoam: {
      id: 'seafoam',
      name: 'Seafoam plastic',
      swatch: '#a9cc89',
      swatchInk: 'dark',
      kind: 'solid',
      surface: {
        color: '#a4c983',
        roughness: 0.34,
        metalness: 0,
        // Injection-moulded plastic: a hard clearcoat over a soft body.
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        sheen: 0.22,
        sheenColor: new THREE.Color('#f2fadf'),
        sheenRoughness: 0.5,
        envMapIntensity: 1,
      },
    },

    quartz: {
      id: 'quartz',
      name: 'Frosted quartz',
      swatch: '#e9eae4',
      swatchInk: 'dark',
      kind: 'translucent',
      dispersion: 0.6,
      frost: 0.6,
      surface: {
        color: '#f2f3ed',
        roughness: 0.42,
        metalness: 0,
        ior: 1.46,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        clearcoat: 0.45,
        clearcoatRoughness: 0.4,
        envMapIntensity: 1.1,
        roughnessMap: frostRoughness(),
        normalMap: frostNormal(),
        iridescence: 0.25,
        iridescenceIOR: 1.25,
      },
      backface: {
        color: '#e6e8e0',
        roughness: 0.55,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
        envMapIntensity: 0.9,
        roughnessMap: frostRoughness(),
        normalMap: frostNormal(),
      },
      core: {
        color: '#f6f7f2',
        roughness: 0.75,
        metalness: 0,
        transparent: true,
        opacity: 0.55,
        envMapIntensity: 0.7,
      },
    },

    olive: {
      id: 'olive',
      name: 'Olive glass',
      swatch: '#8c9164',
      swatchInk: 'light',
      kind: 'translucent',
      dispersion: 0.8,
      frost: 0.3,
      surface: {
        color: '#9aa06d',
        roughness: 0.03,
        metalness: 0,
        ior: 1.52,
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        specularIntensity: 1,
        envMapIntensity: 1.7,
        roughnessMap: frostRoughness(),
        normalMap: frostNormal(),
        iridescence: 0.4,
        iridescenceIOR: 1.3,
      },
      backface: {
        color: '#6f7548',
        roughness: 0.06,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        envMapIntensity: 1.4,
        normalMap: frostNormal(),
      },
      core: {
        color: '#7e8455',
        roughness: 0.12,
        metalness: 0,
        transparent: true,
        opacity: 0.5,
        envMapIntensity: 1.2,
      },
    },

    nickel: {
      id: 'nickel',
      name: 'Brushed nickel',
      swatch: '#a9aeb0',
      swatchInk: 'dark',
      kind: 'solid',
      surface: {
        color: '#a9aeb0',
        // Nickel is a touch cooler and darker than steel.
        metalness: 1,
        roughness: 0.24,
        roughnessMap: brushedRoughness(),
        anisotropy: 0.65,
        anisotropyRotation: Math.PI / 2,
        envMapIntensity: 1.35,
      },
    },

    titanium: {
      id: 'titanium',
      name: 'Dusted titanium',
      swatch: '#2b2d2e',
      swatchInk: 'light',
      kind: 'solid',
      surface: {
        color: '#26282a',
        // Powder coat over metal: still conductive, but scattered wide.
        metalness: 0.72,
        roughness: 0.82,
        roughnessMap: dustedRoughness(),
        clearcoat: 0.1,
        clearcoatRoughness: 0.85,
        envMapIntensity: 1.05,
      },
    },
  };
}

export const MATERIAL_ORDER: MaterialId[] = [
  'ceramic',
  'seafoam',
  'quartz',
  'olive',
  'nickel',
  'titanium',
];

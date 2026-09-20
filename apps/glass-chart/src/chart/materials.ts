import * as THREE from 'three';

import {
  brushedNormal,
  brushedRoughness,
  ceramicNormal,
  ceramicRoughness,
  dustedNormal,
  dustedRoughness,
  frostNormal,
  frostRoughness,
  orangePeelNormal,
  orangePeelRoughness,
  scratchRoughness,
} from './textures';

/**
 * The material library. Each bar in the row wears a different one, so the
 * chart doubles as a swatch board: plastic, frosted glass, tinted glass,
 * polished metal, matte ceramic, powder-coated metal.
 *
 * Every finish is a single box. The translucent ones use real transmission,
 * so what sits behind them is refracted and — driven by their roughness —
 * blurred, rather than simply showing through at reduced opacity.
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
  /** Props for the bar's one and only mesh. */
  surface: THREE.MeshPhysicalMaterialParameters;
  /**
   * Opacity to fall back to when refraction is switched off in the dev
   * sheet — transmission needs a render target, and that is the one part of
   * this scene most likely to struggle on an older mobile GPU.
   */
  fallbackOpacity?: number;
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
        normalMap: ceramicNormal(),
        normalScale: new THREE.Vector2(0.35, 0.35),
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
        clearcoatRoughnessMap: scratchRoughness(),
        roughnessMap: orangePeelRoughness(),
        normalMap: orangePeelNormal(),
        normalScale: new THREE.Vector2(0.3, 0.3),
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
      dispersion: 0.35,
      frost: 0.6,
      fallbackOpacity: 0.5,
      surface: {
        color: '#f4f5f0',
        metalness: 0,
        // Roughness is the blur: three picks the mip level of the
        // transmission buffer from it, so a rough surface diffuses whatever
        // is behind the bar instead of merely tinting it.
        roughness: 0.3,
        transmission: 1,
        thickness: 0.45,
        ior: 1.46,
        attenuationColor: new THREE.Color('#eef0e8'),
        attenuationDistance: 5,
        transparent: true,
        clearcoat: 0.45,
        clearcoatRoughness: 0.4,
        envMapIntensity: 1.1,
        roughnessMap: frostRoughness(),
        normalMap: frostNormal(),
        iridescence: 0.25,
        iridescenceIOR: 1.25,
      },
    },

    olive: {
      id: 'olive',
      name: 'Olive glass',
      swatch: '#8c9164',
      swatchInk: 'light',
      kind: 'translucent',
      dispersion: 1.1,
      frost: 0.3,
      fallbackOpacity: 0.44,
      surface: {
        // Near-white base with the tint carried by attenuation, so the glass
        // deepens with the distance light travels through it rather than
        // sitting on the surface like paint.
        color: '#dfe3c8',
        metalness: 0,
        roughness: 0.08,
        transmission: 1,
        thickness: 0.8,
        ior: 1.52,
        attenuationColor: new THREE.Color('#97a066'),
        attenuationDistance: 3.4,
        transparent: true,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        specularIntensity: 1,
        envMapIntensity: 1.7,
        roughnessMap: frostRoughness(),
        normalMap: frostNormal(),
        iridescence: 0.4,
        iridescenceIOR: 1.3,
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
        normalMap: brushedNormal(),
        normalScale: new THREE.Vector2(0.22, 0.5),
        clearcoat: 0.35,
        clearcoatRoughness: 0.25,
        clearcoatRoughnessMap: scratchRoughness(),
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
        normalMap: dustedNormal(),
        normalScale: new THREE.Vector2(0.45, 0.45),
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

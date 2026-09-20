import * as THREE from 'three';

/**
 * Adds a fresnel rim term to a standard three material.
 *
 * The built-in lighting gives a broad specular lobe; what it will not give is
 * a crisp line along a silhouette edge that tracks a direction of its own.
 * This injects one after `opaque_fragment`, which is where `outgoingLight`
 * has landed in `gl_FragColor` but before the colour space conversion — so
 * the term is added in linear space, like any other light.
 *
 * Colour separation is not done here: the glass finishes are transmissive, so
 * three's own `dispersion` handles it properly inside the refraction path.
 */
export type BarSurfaceUniforms = {
  uRimColor: { value: THREE.Color };
  uRimDir: { value: THREE.Vector3 };
  uRimStrength: { value: number };
  uRimPower: { value: number };
  /** World height of the bar, so the occlusion band stays a fixed size. */
  uBarHeight: { value: number };
  uOcclusion: { value: number };
};

const DECLARATIONS = /* glsl */ `
uniform vec3 uRimColor;
uniform vec3 uRimDir;
uniform float uRimStrength;
uniform float uRimPower;
uniform float uBarHeight;
uniform float uOcclusion;
varying float vUnitY;
`;

/**
 * Contact occlusion where the bar meets the slab. Light cannot reach into
 * that crease, and without it even a well lit box looks pasted onto the
 * surface rather than resting on it.
 *
 * The geometry is a unit box scaled on Y, so vUnitY is 0 at the foot and 1
 * at the top whatever the bar's height. Multiplying back up by the height
 * keeps the band a fixed size in world units instead of a fixed fraction of
 * a bar, which would smear across a tall one and pinch on a short one.
 */
const OCCLUSION = /* glsl */ `
{
  float heightAboveSlab = vUnitY * uBarHeight;
  float contact = smoothstep( 0.0, 0.26, heightAboveSlab );
  gl_FragColor.rgb *= mix( 1.0 - uOcclusion, 1.0, contact );
}
`;

const RIM = /* glsl */ `
{
  vec3 rimView = normalize( vViewPosition );
  // uRimDir is world space; viewMatrix is a three built-in in the fragment
  // stage, so the aim can stay in world space on the CPU side.
  vec3 rimLight = normalize( ( viewMatrix * vec4( uRimDir, 0.0 ) ).xyz );
  float fresnel = pow( 1.0 - saturate( dot( normal, rimView ) ), uRimPower );
  float facing = smoothstep( -0.35, 0.9, dot( normal, rimLight ) );
  gl_FragColor.rgb += uRimColor * fresnel * facing * uRimStrength;
}
`;

export function attachBarSurface(
  material: THREE.Material,
  color: THREE.ColorRepresentation,
  power: number,
): BarSurfaceUniforms {
  const uniforms: BarSurfaceUniforms = {
    uRimColor: { value: new THREE.Color(color) },
    uRimDir: { value: new THREE.Vector3(0.4, 0.6, 1) },
    uRimStrength: { value: 0 },
    uRimPower: { value: power },
    uBarHeight: { value: 1 },
    uOcclusion: { value: 0 },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying float vUnitY;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvUnitY = position.y;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${DECLARATIONS}`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>\n${OCCLUSION}\n${RIM}`);
  };

  // Every patched material injects identical source, so three's program cache
  // still hands them all one compiled program; only the uniform values differ.
  material.needsUpdate = true;
  return uniforms;
}

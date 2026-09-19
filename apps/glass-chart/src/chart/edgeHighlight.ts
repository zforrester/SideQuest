import * as THREE from 'three';

/**
 * Adds a fresnel rim term to a standard three material.
 *
 * The built-in lighting gives a broad specular lobe; what it will not give is
 * a crisp line along a silhouette edge that tracks a direction of its own.
 * This injects one after `opaque_fragment`, which is where `outgoingLight`
 * has landed in `gl_FragColor` but before the colour space conversion — so
 * the term is added in linear space, like any other light.
 */
export type EdgeUniforms = {
  uRimColor: { value: THREE.Color };
  uRimDir: { value: THREE.Vector3 };
  uRimStrength: { value: number };
  uRimPower: { value: number };
};

const DECLARATIONS = /* glsl */ `
uniform vec3 uRimColor;
uniform vec3 uRimDir;
uniform float uRimStrength;
uniform float uRimPower;
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

export function attachEdgeHighlight(
  material: THREE.Material,
  color: THREE.ColorRepresentation,
  power: number,
): EdgeUniforms {
  const uniforms: EdgeUniforms = {
    uRimColor: { value: new THREE.Color(color) },
    uRimDir: { value: new THREE.Vector3(0.4, 0.6, 1) },
    uRimStrength: { value: 0 },
    uRimPower: { value: power },
  };

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${DECLARATIONS}`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>\n${RIM}`);
  };

  // Every patched material injects identical source, so three's program cache
  // still hands them all one compiled program; only the uniform values differ.
  material.needsUpdate = true;
  return uniforms;
}

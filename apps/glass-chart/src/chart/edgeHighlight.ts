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
  /** 0 for opaque finishes; glass splits its rim into a spectrum. */
  uDispersion: { value: number };
};

const DECLARATIONS = /* glsl */ `
uniform vec3 uRimColor;
uniform vec3 uRimDir;
uniform float uRimStrength;
uniform float uRimPower;
uniform float uDispersion;
`;

const RIM = /* glsl */ `
{
  vec3 rimView = normalize( vViewPosition );
  // uRimDir is world space; viewMatrix is a three built-in in the fragment
  // stage, so the aim can stay in world space on the CPU side.
  vec3 rimLight = normalize( ( viewMatrix * vec4( uRimDir, 0.0 ) ).xyz );
  float ndv = saturate( dot( normal, rimView ) );
  float facing = smoothstep( -0.35, 0.9, dot( normal, rimLight ) );

  // Path length through the glass: nothing face-on, most of it edge-on.
  float path = 1.0 - ndv;

  // Square-edged bars have one normal per face, so there is no geometric
  // gradient at a corner for a classic edge fringe to sit on. Keying the
  // split to the view angle instead puts the separation across the face,
  // where a flat pane of glass shows it anyway — and the frost normal map
  // breaks it up into speckle on the etched finishes.
  vec3 spectrum = 0.5 + 0.5 * cos(
    6.28318 * ( path * uDispersion * 1.15 + vec3( 0.0, -0.33, -0.67 ) )
  );
  // Pulled back towards white: at full saturation the split stops reading as
  // a sheen on olive glass and starts reading as blue glass.
  spectrum = mix( vec3( 1.0 ), spectrum, 0.7 );

  // Glass spreads its colour over the whole face; an opaque finish keeps the
  // tight white rim it had.
  float power = mix( uRimPower, uRimPower * 0.45, saturate( uDispersion ) );
  float edge = pow( path, power );

  vec3 tint = mix( uRimColor, spectrum, saturate( uDispersion ) * 0.72 );
  gl_FragColor.rgb += tint * edge * facing * uRimStrength;
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
    uDispersion: { value: 0 },
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

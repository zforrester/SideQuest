import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { BAR_DEPTH, BAR_WIDTH } from './geometry';
import { aim } from './lightInput';

/**
 * The bright filaments a translucent bar throws onto the slab. Focused light
 * is additive by nature, so this is drawn as an additive decal rather than
 * painted into the slab material.
 */
const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec2 uOffset;

  // Thin filaments where two drifting wave fields cancel. Summing the
  // *zero crossings* rather than the wave values keeps the lines thin and
  // the brightness bounded — piling up raw wave energy saturates into a
  // solid blob the moment the fields agree.
  float filaments( vec2 p, float t ) {
    float v = 0.0;
    for ( int i = 0; i < 3; i++ ) {
      float fi = float( i );
      vec2 q = p * ( 1.8 + fi * 1.1 );
      q += vec2( sin( t * ( 0.7 + fi * 0.23 ) + fi ), cos( t * ( 0.6 + fi * 0.31 ) - fi ) );
      float w = sin( q.x + sin( q.y + t * 0.5 ) ) * cos( q.y - sin( q.x - t * 0.4 ) );
      v += 1.0 - smoothstep( 0.0, 0.16, abs( w ) );
    }
    return v / 3.0;
  }

  void main() {
    // The pool slides opposite the light, the way a real projection does.
    vec2 p = vUv - 0.5 + uOffset;
    float r = length( p );
    // A ring, not a disc: the bar stands on the middle of this plane, so a
    // centre-weighted pool puts all its light exactly where it cannot be
    // seen. Light through the bar lands beside its foot.
    float mask = smoothstep( 0.10, 0.21, r ) * ( 1.0 - smoothstep( 0.28, 0.46, r ) );
    // Measured on the un-offset uv, so however far the pool slides it always
    // fades out before the plane edge — and the plane is sized to the slab,
    // so no filament is left hanging over the side.
    mask *= 1.0 - smoothstep( 0.34, 0.5, length( vUv - 0.5 ) );
    if ( mask <= 0.001 ) discard;
    float c = filaments( p * 7.0, uTime );
    c = pow( c, 1.5 );
    gl_FragColor = vec4( uColor, 1.0 ) * c * mask * uIntensity;
  }
`;

type Props = {
  color: THREE.ColorRepresentation;
  intensity: number;
  /** Fades with the bar, so a dimmed bar stops casting. */
  presence: () => number;
};

export function Caustics({ color, intensity, presence }: Props) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uTime: { value: 0 },
          uIntensity: { value: intensity },
          uOffset: { value: new THREE.Vector2() },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [color, intensity],
  );

  useFrame((_, delta) => {
    const u = material.uniforms;
    u.uTime.value += delta * 0.42;
    const a = aim(6, delta);
    u.uOffset.value.set(a.x * 0.12, a.y * 0.1);
    u.uIntensity.value = intensity * presence();
  });

  return (
    <mesh
      position={[0, 0.016, 0.03]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
      renderOrder={-1}
    >
      <planeGeometry args={[BAR_WIDTH * 2.3, BAR_DEPTH * 2.3]} />
    </mesh>
  );
}

import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import type { MaterialSpec } from './materials';
import { slabNormal, slabRoughness } from './textures';
import {
  BAR_DEPTH,
  BAR_WIDTH,
  PLATE_THICKNESS,
  barOffsetX,
  plateDepth,
  plateWidth,
} from './geometry';

/** Soft radial falloff, used for the contact shadow under each bar. */
const BLOB_FRAGMENT = `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float d = length(vUv - vec2(0.5)) * 2.0;
    float a = 1.0 - smoothstep(0.0, 1.0, d);
    gl_FragColor = vec4(uColor, pow(a, 1.3) * uOpacity);
  }
`;

const BLOB_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function useBlobMaterial(color: string, opacity: number) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: BLOB_VERTEX,
        fragmentShader: BLOB_FRAGMENT,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
        },
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [color, opacity],
  );
}

export function Platform({ materials }: { materials: MaterialSpec[] }) {
  const count = materials.length;
  const width = plateWidth(count);
  const depth = plateDepth();

  const plateGeometry = useMemo(
    () => new RoundedBoxGeometry(width, PLATE_THICKNESS, depth, 4, 0.07),
    [width, depth],
  );

  // Warm grey rather than black: a near-black shadow on an off-white set
  // reads as a hole punched in the slab.
  // With no shadow pass, these blobs are the grounding. The key sits up and
  // to the right, so they are offset and stretched to the left to read as a
  // cast shadow rather than a symmetrical smudge.
  const shadow = useBlobMaterial('#464a41', 0.72);
  const slabNormalScale = useMemo(() => new THREE.Vector2(0.25, 0.25), []);


  return (
    <group>
      {/* Pale frosted slab the row stands on. Drawn before the bars so the
          glass in front of it blends over it rather than the reverse. */}
      <mesh
        geometry={plateGeometry}
        position={[0, -PLATE_THICKNESS / 2, 0]}
        renderOrder={-3}
      >
        <meshPhysicalMaterial
          // Opaque and a shade darker than the page, so the row reads as
          // standing on something rather than floating on white.
          color="#b7b9ad"
          roughness={0.46}
          metalness={0}
          clearcoat={0.45}
          clearcoatRoughness={0.34}
          envMapIntensity={0.7}
          roughnessMap={slabRoughness()}
          normalMap={slabNormal()}
          normalScale={slabNormalScale}
        />
      </mesh>

      {materials.map((_, index) => (
        <group key={index} position={[barOffsetX(index, count), 0, 0]}>
          {/* Contact shadow. */}
          <mesh
            position={[-0.07, 0.014, 0.05]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[1.5, 1, 1]}
            material={shadow}
            renderOrder={-2}
          >
            <planeGeometry args={[BAR_WIDTH * 2.2, BAR_DEPTH * 2.2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
    gl_FragColor = vec4(uColor, pow(a, 2.4) * uOpacity);
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
  return useMemo(() => {
    const material = new THREE.ShaderMaterial({
      vertexShader: BLOB_VERTEX,
      fragmentShader: BLOB_FRAGMENT,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
      },
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    return material;
  }, [color, opacity]);
}

export function Platform({ colors }: { colors: readonly string[] }) {
  const count = colors.length;
  const width = plateWidth(count);
  const depth = plateDepth();

  const plateGeometry = useMemo(
    () => new RoundedBoxGeometry(width, PLATE_THICKNESS, depth, 4, 0.07),
    [width, depth],
  );

  const footprintGeometry = useMemo(
    () => new RoundedBoxGeometry(BAR_WIDTH * 1.18, 0.012, BAR_DEPTH * 1.18, 3, 0.03),
    [],
  );

  const shadow = useBlobMaterial('#03040c', 0.85);
  const bloom = useBlobMaterial('#5f7cff', 0.1);

  return (
    <group>
      {/* Frosted slab the row stands on. Drawn before the bars so the glass
          in front of it blends over it rather than the other way round. */}
      <mesh geometry={plateGeometry} position={[0, -PLATE_THICKNESS / 2, 0]} renderOrder={-3}>
        <meshPhysicalMaterial
          color="#141a33"
          transparent
          opacity={0.72}
          depthWrite={false}
          roughness={0.22}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.18}
          envMapIntensity={1.6}
        />
      </mesh>

      {/* Wide pool of light under the whole rig. */}
      <mesh
        position={[0, -PLATE_THICKNESS - 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={-2}
      >
        <planeGeometry args={[width * 2.1, depth * 5]} />
        <primitive object={bloom} attach="material" />
      </mesh>

      {colors.map((color, index) => {
        const x = barOffsetX(index, count);
        return (
          <group key={index} position={[x, 0, 0]}>
            {/* Contact shadow. */}
            <mesh position={[0, 0.004, 0.02]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-2}>
              <planeGeometry args={[BAR_WIDTH * 3.2, BAR_DEPTH * 3.2]} />
              <primitive object={shadow} attach="material" />
            </mesh>
            {/* Colour footprint, ties each bar to its slot on the plate. */}
            <mesh geometry={footprintGeometry} position={[0, 0.008, 0]} renderOrder={-1}>
              <meshStandardMaterial
                color="#0b0e1c"
                emissive={color}
                emissiveIntensity={0.85}
                roughness={0.5}
                transparent
                opacity={0.55}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

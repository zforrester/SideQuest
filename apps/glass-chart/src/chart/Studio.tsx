import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { STUDIO_PRESETS, type Lighting } from '../theme';
import { aim } from './lightInput';

/**
 * Builds the scene that gets baked into the reflection probe. Everything the
 * bars reflect lives here: a big softbox overhead, strip lights either side, a
 * back rim and a floor bounce. It is pure geometry, so the app ships no HDRI
 * and works offline on a device.
 *
 * The probe matters more here than in a typical scene — polished nickel is
 * almost entirely reflection, so without one it renders as a flat grey slab.
 */
function createEmitterScene(preset: Lighting) {
  const config = STUDIO_PRESETS[preset];
  const scene = new THREE.Scene();

  const emit = (
    color: string,
    intensity: number,
    size: [number, number],
    position: [number, number, number],
    rotation: [number, number, number],
  ) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    scene.add(mesh);
  };

  // Enclosing shell: on a light set this is most of the ambient level.
  scene.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(24, 24, 24),
      new THREE.MeshBasicMaterial({
        color: config.shell,
        side: THREE.BackSide,
        toneMapped: false,
      }),
    ),
  );

  const HALF_PI = Math.PI / 2;
  emit(config.key.color, config.key.power, [10, 6], [0, 7, 1], [HALF_PI, 0, 0]);
  emit(config.left.color, config.left.power, [3.5, 9], [-7, 1.5, 1.5], [0, HALF_PI, 0]);
  emit(config.right.color, config.right.power, [3.5, 9], [7, 1.5, -0.5], [0, -HALF_PI, 0]);
  emit(config.back.color, config.back.power, [13, 5], [0, 2.5, -8], [0, 0, 0]);
  emit(config.floor.color, config.floor.power, [14, 10], [0, -4, 0], [-HALF_PI, 0, 0]);

  return scene;
}

type StudioProps = {
  preset: Lighting;
  /** Dev-sheet multiplier on the preset's own exposure. */
  exposure: number;
  /** How far the pointer or device tilt swings the key. */
  lightFollow: number;
  /** Scales the refraction buffer: lower is cheaper, and softer. */
  refractionQuality: number;
};

export function Studio({ preset, exposure, lightFollow, refractionQuality }: StudioProps) {
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const config = STUDIO_PRESETS[preset];

  const probe = useMemo(() => {
    const emitters = createEmitterScene(preset);
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const target = pmrem.fromScene(emitters, 0.03);
      pmrem.dispose();
      return target;
    } catch (error) {
      // Some older Android GPUs refuse the float render target PMREM needs.
      // The lights below still carry the scene, just without reflections.
      console.warn('[glass-chart] reflection probe unavailable, lights only', error);
      return null;
    } finally {
      emitters.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
    }
  }, [renderer, preset]);

  useEffect(() => {
    if (!probe) return;
    scene.environment = probe.texture;
    return () => {
      scene.environment = null;
      probe.dispose();
    };
  }, [probe, scene]);

  useEffect(() => {
    renderer.toneMappingExposure = config.exposure * exposure;
  }, [renderer, config.exposure, exposure]);

  useEffect(() => {
    // Half resolution is both a real saving on the extra scene render that
    // transmission costs, and a touch more diffusion for free.
    renderer.transmissionResolutionScale = refractionQuality;
  }, [renderer, refractionQuality]);

  const keyLight = useRef<THREE.DirectionalLight>(null);
  const travelling = useRef<THREE.PointLight>(null);

  // The key swings with the pointer or the device tilt, and a second light
  // crawls the row on its own so highlights keep moving even when nothing is
  // touching the screen.
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const a = aim(6, delta);
    keyLight.current?.position.set(
      4.5 + a.x * 7 * lightFollow,
      8.5 + a.y * 3.5 * lightFollow,
      5 - a.y * 2 * lightFollow,
    );
    travelling.current?.position.set(
      Math.cos(t * 0.3) * 6 + a.x * 2 * lightFollow,
      3.2,
      Math.sin(t * 0.3) * 6,
    );
  });

  return (
    <>
      {/* Deliberately low: heavy ambient is what flattens a PBR scene into
          chalk. Shape comes from the probe and the single key. */}
      <ambientLight intensity={config.ambientPower} color={config.ambient} />
      <hemisphereLight args={[config.keyLight, config.fillLight, 0.3]} />
      <directionalLight
        ref={keyLight}
        position={[4.5, 8.5, 5]}
        intensity={1.35}
        color={config.keyLight}
      />
      <directionalLight position={[-6, 3.5, -4]} intensity={0.35} color={config.fillLight} />
      <pointLight ref={travelling} intensity={28} distance={20} decay={2} color={config.keyLight} />
    </>
  );
}

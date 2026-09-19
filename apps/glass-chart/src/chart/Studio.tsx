import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { STUDIO_EMITTERS } from '../theme';

/**
 * Builds the scene that gets baked into the reflection probe. Everything the
 * glass reflects lives here: a big softbox overhead plus coloured strip lights
 * either side. It is pure geometry, so the app ships no HDRI asset and works
 * offline on a device.
 */
function createEmitterScene() {
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
    return mesh;
  };

  // Enclosing shell keeps the probe from going pure black at the horizon.
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(24, 24, 24),
    new THREE.MeshBasicMaterial({ color: '#05060e', side: THREE.BackSide, toneMapped: false }),
  );
  scene.add(shell);

  const HALF_PI = Math.PI / 2;
  emit(STUDIO_EMITTERS.key, 3.4, [9, 5], [0, 7, 1], [HALF_PI, 0, 0]); // overhead softbox
  emit(STUDIO_EMITTERS.fillCool, 5.5, [3, 8], [-7, 1.5, 1.5], [0, HALF_PI, 0]); // left strip
  emit(STUDIO_EMITTERS.fillWarm, 4.8, [3, 8], [7, 1.5, -0.5], [0, -HALF_PI, 0]); // right strip
  emit(STUDIO_EMITTERS.rim, 2.6, [12, 4], [0, 2.5, -8], [0, 0, 0]); // back rim
  emit(STUDIO_EMITTERS.key, 0.9, [12, 4], [0, 1, 9], [0, Math.PI, 0]); // gentle front bounce

  return scene;
}

/**
 * Image-based lighting + the animated practical lights. Renders no visible
 * geometry itself; it only populates `scene.environment` and adds lights.
 */
export function Studio({ accent }: { accent: THREE.ColorRepresentation }) {
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  const probe = useMemo(() => {
    const emitters = createEmitterScene();
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const target = pmrem.fromScene(emitters, 0.035);
      pmrem.dispose();
      return target;
    } catch (error) {
      // Some older Android GPUs refuse the float render target PMREM needs.
      // The lights below still carry the scene, just without reflections.
      console.warn('[glass-chart] reflection probe unavailable, falling back to lights only', error);
      return null;
    } finally {
      emitters.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
    }
  }, [renderer]);

  useEffect(() => {
    if (!probe) return;
    scene.environment = probe.texture;
    return () => {
      scene.environment = null;
      probe.dispose();
    };
  }, [probe, scene]);

  const coolLight = useRef<THREE.PointLight>(null);
  const warmLight = useRef<THREE.PointLight>(null);

  // Slow counter-rotating practicals so highlights crawl across the bars even
  // while the chart is sitting still.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    coolLight.current?.position.set(Math.cos(t * 0.35) * 5.5, 2.6, Math.sin(t * 0.35) * 5.5);
    warmLight.current?.position.set(Math.cos(t * -0.24 + 2) * 5, 1.4, Math.sin(t * -0.24 + 2) * 5);
  });

  return (
    <>
      <ambientLight intensity={0.35} color="#7f8bd6" />
      <hemisphereLight args={['#9fd7ff', '#12061f', 0.7]} />
      <directionalLight position={[4.5, 8, 5]} intensity={2.1} color="#ffffff" />
      <directionalLight position={[-6, 3, -4]} intensity={1.15} color={STUDIO_EMITTERS.rim} />
      <pointLight ref={coolLight} intensity={70} distance={18} decay={2} color={STUDIO_EMITTERS.fillCool} />
      <pointLight ref={warmLight} intensity={55} distance={16} decay={2} color={STUDIO_EMITTERS.fillWarm} />
      {/* Tracks the selected bar so the highlight follows the selection. */}
      <spotLight
        position={[0, 9, 4]}
        angle={0.55}
        penumbra={1}
        intensity={140}
        distance={26}
        decay={2}
        color={accent}
      />
    </>
  );
}

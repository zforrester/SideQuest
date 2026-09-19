import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { Datum } from '../data';
import { Spring, damp } from './anim';
import type { MaterialSpec } from './materials';
import {
  BAR_WIDTH,
  MAX_BAR_HEIGHT,
  capGeometry,
  coreGeometry,
  shellGeometry,
} from './geometry';

type BarProps = {
  index: number;
  datum: Datum;
  material: MaterialSpec;
  maxValue: number;
  selected: boolean;
  dimmed: boolean;
  /** Staggers the grow-in so the row builds left to right. */
  revealDelay: number;
};

const LIFT = 0.26;

export function Bar({
  index,
  datum,
  material,
  maxValue,
  selected,
  dimmed,
  revealDelay,
}: BarProps) {
  const root = useRef<THREE.Group>(null);
  const column = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Mesh>(null);
  const hit = useRef<THREE.Mesh>(null);
  const capMaterial = useRef<THREE.MeshPhysicalMaterial>(null);

  const translucent = material.kind === 'translucent';

  /**
   * Built imperatively rather than as JSX so each bar can take an arbitrary
   * bag of material parameters from the library without a prop per feature.
   */
  const materials = useMemo(() => {
    const surface = new THREE.MeshPhysicalMaterial(material.surface);
    const backface = material.backface
      ? new THREE.MeshPhysicalMaterial({ ...material.backface, side: THREE.BackSide })
      : null;
    const core = material.core ? new THREE.MeshPhysicalMaterial(material.core) : null;
    return { surface, backface, core };
  }, [material]);

  // Base opacities, so the dim/glow animation has something to scale against.
  const baseOpacity = useMemo(
    () => ({
      surface: materials.surface.transparent ? materials.surface.opacity : 1,
      backface: materials.backface?.opacity ?? 1,
      core: materials.core?.opacity ?? 1,
    }),
    [materials],
  );

  const capColor = useMemo(() => {
    const base = new THREE.Color(
      (material.surface.color as THREE.ColorRepresentation) ?? '#ffffff',
    );
    // A shade of the bar's own colour, so the cap reads as the same stock.
    return base.clone().lerp(new THREE.Color('#ffffff'), translucent ? 0.35 : 0.12);
  }, [material, translucent]);

  // These are created outside the reconciler, so they are ours to clean up.
  useEffect(
    () => () => {
      materials.surface.dispose();
      materials.backface?.dispose();
      materials.core?.dispose();
    },
    [materials],
  );

  const state = useRef({
    elapsed: 0,
    height: new Spring(0, 90, 16),
    lift: 0,
    glow: 0,
    presence: 1,
  }).current;

  useFrame((_, delta) => {
    state.elapsed += delta;

    // Grow in once this bar's slice of the stagger has elapsed.
    const revealed = THREE.MathUtils.clamp((state.elapsed - revealDelay) / 0.55, 0, 1);
    const targetHeight = (datum.value / maxValue) * MAX_BAR_HEIGHT * easeOutCubic(revealed);
    const height = Math.max(0.0001, state.height.step(targetHeight, delta));

    state.lift = damp(state.lift, selected ? 1 : 0, 9, delta);
    state.glow = damp(state.glow, selected ? 1 : 0, 7, delta);
    state.presence = damp(state.presence, dimmed ? 0.55 : 1, 8, delta);

    if (root.current) {
      root.current.position.y = state.lift * LIFT;
      // A touch of yaw on the selected bar so it catches the key light.
      root.current.rotation.y = state.lift * 0.22;
    }

    if (column.current) {
      const swell = 1 + state.lift * 0.045;
      column.current.scale.set(swell, height, swell);
    }

    if (cap.current) {
      cap.current.position.y = height + 0.03;
      cap.current.visible = revealed > 0.02;
    }

    if (capMaterial.current) {
      capMaterial.current.opacity = 0.35 + 0.65 * state.presence;
    }

    // On a light backdrop a bar recedes by going translucent and flat, not by
    // going dark, so the dim state fades opacity and reflection together.
    materials.surface.opacity = baseOpacity.surface * (0.45 + 0.55 * state.presence);
    materials.surface.transparent = materials.surface.opacity < 0.999;
    if (materials.backface) {
      materials.backface.opacity = baseOpacity.backface * state.presence;
    }
    if (materials.core) {
      materials.core.opacity = baseOpacity.core * state.presence;
    }

    const lift = 1 + state.glow * 0.45;
    materials.surface.envMapIntensity = (material.surface.envMapIntensity ?? 1) * lift;

    // Keep the tap target the size of the bar, plus a little headroom so a
    // short bar is still comfortable to hit with a thumb.
    if (hit.current) {
      const hitHeight = height + 0.4;
      hit.current.scale.y = hitHeight;
      hit.current.position.y = hitHeight / 2;
    }
  });

  return (
    <group ref={root} userData={{ barIndex: index }}>
      <group ref={column}>
        {/* Back faces first: three sorts transparent objects far-to-near and
            breaks the tie between the passes by creation order, which gives a
            correct read through the glass without juggling renderOrder. */}
        {materials.backface && (
          <mesh geometry={shellGeometry} material={materials.backface} />
        )}

        {materials.core && (
          <mesh
            geometry={coreGeometry}
            material={materials.core}
            position={[0, 0.02, 0]}
            scale={[1, 0.955, 1]}
          />
        )}

        <mesh geometry={shellGeometry} material={materials.surface} />
      </group>

      <mesh ref={cap} geometry={capGeometry}>
        <meshPhysicalMaterial
          ref={capMaterial}
          color={capColor}
          roughness={translucent ? 0.18 : 0.3}
          metalness={material.surface.metalness ?? 0}
          clearcoat={0.8}
          clearcoatRoughness={0.18}
          envMapIntensity={1.3}
          transparent
        />
      </mesh>

      {/* Invisible but still raycastable — this is the tap target. */}
      <mesh ref={hit} visible={false}>
        <boxGeometry args={[BAR_WIDTH * 1.4, 1, BAR_WIDTH * 1.4]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

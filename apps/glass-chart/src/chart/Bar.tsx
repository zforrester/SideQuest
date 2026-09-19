import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { Datum } from '../data';
import { Spring, damp } from './anim';
import { Caustics } from './Caustics';
import { attachEdgeHighlight, type EdgeUniforms } from './edgeHighlight';
import { BAR_WIDTH, MAX_BAR_HEIGHT, type BarGeometries } from './geometry';
import { aimDirection } from './lightInput';
import type { MaterialSpec } from './materials';

type BarProps = {
  index: number;
  datum: Datum;
  material: MaterialSpec;
  geometries: BarGeometries;
  maxValue: number;
  selected: boolean;
  dimmed: boolean;
  /** Staggers the grow-in so the row builds left to right. */
  revealDelay: number;
  growDuration: number;
  rimStrength: number;
  rimPower: number;
  lightFollow: number;
  causticIntensity: number;
};

const LIFT = 0.26;

export function Bar({
  index,
  datum,
  material,
  geometries,
  maxValue,
  selected,
  dimmed,
  revealDelay,
  growDuration,
  rimStrength,
  rimPower,
  lightFollow,
  causticIntensity,
}: BarProps) {
  const root = useRef<THREE.Group>(null);
  const column = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Mesh>(null);
  const hit = useRef<THREE.Mesh>(null);
  const capMaterial = useRef<THREE.MeshPhysicalMaterial>(null);
  const camera = useThree((s) => s.camera);

  const translucent = material.kind === 'translucent';

  /**
   * Built imperatively rather than as JSX so each bar can take an arbitrary
   * bag of material parameters from the library without a prop per feature,
   * and so the edge-highlight patch can be applied to each one.
   */
  const { materials, rims } = useMemo(() => {
    const rimTint = new THREE.Color(
      (material.surface.color as THREE.ColorRepresentation) ?? '#ffffff',
    ).lerp(new THREE.Color('#ffffff'), 0.65);

    const surface = new THREE.MeshPhysicalMaterial(material.surface);
    const backface = material.backface
      ? new THREE.MeshPhysicalMaterial({ ...material.backface, side: THREE.BackSide })
      : null;
    const core = material.core ? new THREE.MeshPhysicalMaterial(material.core) : null;

    const list: EdgeUniforms[] = [attachEdgeHighlight(surface, rimTint, rimPower)];
    if (core) list.push(attachEdgeHighlight(core, rimTint, rimPower));

    return { materials: { surface, backface, core }, rims: list };
    // rimPower only seeds the uniform; it is updated per frame below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material]);

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
    entered: false,
    enteredAt: 0,
    height: new Spring(0, 90, 16),
    lift: 0,
    glow: 0,
    presence: 1,
  }).current;

  const worldPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    state.elapsed += delta;

    // Bars grow when they come into frame rather than on mount, so a bar
    // spun into view — or revealed by a shuffle while it was off-screen —
    // still builds instead of appearing at full height.
    if (!state.entered && root.current) {
      root.current.getWorldPosition(worldPos);
      worldPos.project(camera);
      const onScreen =
        worldPos.z > -1 &&
        worldPos.z < 1 &&
        Math.abs(worldPos.x) < 1.25 &&
        Math.abs(worldPos.y) < 1.45;
      if (onScreen) {
        state.entered = true;
        state.enteredAt = state.elapsed;
      }
    }

    const since = state.entered ? state.elapsed - state.enteredAt - revealDelay : -1;
    const revealed = THREE.MathUtils.clamp(since / Math.max(growDuration, 0.05), 0, 1);
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
      cap.current.position.y = height + 0.028;
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

    const glowLift = 1 + state.glow * 0.45;
    materials.surface.envMapIntensity = (material.surface.envMapIntensity ?? 1) * glowLift;

    // Edge highlights track the pointer or the device tilt.
    const direction = aimDirection(6, delta, lightFollow);
    const strength = rimStrength * state.presence * revealed * (1 + state.glow * 0.8);
    for (const rim of rims) {
      rim.uRimDir.value.copy(direction);
      rim.uRimStrength.value = strength;
      rim.uRimPower.value = rimPower;
    }

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
          <mesh geometry={geometries.shell} material={materials.backface} />
        )}

        {materials.core && (
          <mesh
            geometry={geometries.core}
            material={materials.core}
            position={[0, 0.02, 0]}
            scale={[1, 0.955, 1]}
          />
        )}

        <mesh geometry={geometries.shell} material={materials.surface} />
      </group>

      <mesh ref={cap} geometry={geometries.cap}>
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

      {/* Only the translucent finishes focus light, so only they cast. */}
      {translucent && causticIntensity > 0 && (
        <Caustics
          color={(material.surface.color as THREE.ColorRepresentation) ?? '#ffffff'}
          intensity={causticIntensity}
          presence={() => state.presence}
        />
      )}

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

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { Datum } from '../data';
import { Spring, damp } from './anim';
import { Caustics } from './Caustics';
import { attachBarSurface } from './barSurface';
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
  dispersion: number;
  frost: number;
  occlusion: number;
  /** Real refraction, or the cheap opacity fallback. */
  refraction: boolean;
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
  dispersion,
  frost,
  occlusion,
  refraction,
}: BarProps) {
  const root = useRef<THREE.Group>(null);
  const column = useRef<THREE.Group>(null);
  const hit = useRef<THREE.Mesh>(null);
  const camera = useThree((s) => s.camera);

  const translucent = material.kind === 'translucent';

  /**
   * Built imperatively rather than as JSX so each bar can take an arbitrary
   * bag of material parameters from the library without a prop per feature,
   * and so the edge-highlight patch can be applied to it.
   */
  const surface = useMemo(
    () => new THREE.MeshPhysicalMaterial(material.surface),
    [material],
  );

  const rim = useMemo(() => {
    const tint = new THREE.Color(
      (material.surface.color as THREE.ColorRepresentation) ?? '#ffffff',
    ).lerp(new THREE.Color('#ffffff'), 0.65);
    return attachBarSurface(surface, tint, rimPower);
    // rimPower only seeds the uniform; it is updated per frame below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surface, material]);

  const baseTransmission = material.surface.transmission ?? 0;

  // Toggling transmission across zero recompiles the shader, so it is done
  // here on the toggle rather than every frame.
  useEffect(() => {
    surface.transmission = refraction ? baseTransmission : 0;
  }, [surface, refraction, baseTransmission]);

  // Created outside the reconciler, so ours to clean up.
  useEffect(() => () => surface.dispose(), [surface]);

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

    // Transmissive materials sit in their own render queue, ahead of the
    // transparent check, so fading opacity here costs no queue churn.
    const opaqueBase = material.surface.opacity ?? 1;
    surface.opacity = refraction || !translucent
      ? opaqueBase * (0.45 + 0.55 * state.presence)
      : (material.fallbackOpacity ?? opaqueBase) * state.presence;

    // Frosting depth is a live control, so the glass sets its normal scale
    // per frame. Everything else keeps the scale its own spec asked for —
    // driving them all from here would flatten the surface detail on the
    // opaque finishes to nothing.
    if (material.frost !== undefined && surface.normalMap) {
      const depth = material.frost * frost;
      surface.normalScale.set(depth, depth);
    }

    surface.dispersion = (material.dispersion ?? 0) * dispersion;

    const glowLift = 1 + state.glow * 0.45;
    surface.envMapIntensity = (material.surface.envMapIntensity ?? 1) * glowLift;

    // Edge highlights track the pointer or the device tilt.
    rim.uRimDir.value.copy(aimDirection(6, delta, lightFollow));
    rim.uRimStrength.value = rimStrength * state.presence * revealed * (1 + state.glow * 0.8);
    rim.uRimPower.value = rimPower;
    rim.uBarHeight.value = height;
    rim.uOcclusion.value = occlusion * revealed;

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
        <mesh geometry={geometries.shell} material={surface} />
      </group>

      {/* Only the translucent finishes focus light, so only they cast. */}
      {translucent && causticIntensity > 0 && (
        <Caustics
          color={(material.surface.attenuationColor as THREE.Color) ?? '#ffffff'}
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

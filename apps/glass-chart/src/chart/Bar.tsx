import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { Datum } from '../data';
import type { Finish } from '../theme';
import { Spring, damp } from './anim';
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
  maxValue: number;
  finish: Finish;
  selected: boolean;
  dimmed: boolean;
  /** Staggers the grow-in so the row builds left to right. */
  revealDelay: number;
};

const LIFT = 0.26;
const SHELL_BACK_OPACITY = 0.16;
const SHELL_FRONT_OPACITY = 0.34;

export function Bar({
  index,
  datum,
  maxValue,
  finish,
  selected,
  dimmed,
  revealDelay,
}: BarProps) {
  const root = useRef<THREE.Group>(null);
  const column = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Mesh>(null);
  const hit = useRef<THREE.Mesh>(null);
  const capMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const innerLight = useRef<THREE.PointLight>(null);
  const shellBack = useRef<THREE.MeshPhysicalMaterial>(null);
  const shellFront = useRef<THREE.MeshPhysicalMaterial>(null);
  const coreMaterial = useRef<THREE.MeshPhysicalMaterial>(null);

  const color = useMemo(() => new THREE.Color(datum.color), [datum.color]);

  const state = useRef({
    elapsed: 0,
    height: new Spring(0, 90, 16),
    lift: 0,
    glow: 0,
    presence: 1,
  }).current;

  const showShell = finish !== 'plastic';
  const showCore = finish !== 'glass';
  // With no shell around it, the plastic bar is the whole bar: full width and
  // full height, so the cap still lands flush on top of it.
  const solidCore = finish === 'plastic';

  useFrame((_, delta) => {
    state.elapsed += delta;

    // Grow in once this bar's slice of the stagger has elapsed.
    const revealed = THREE.MathUtils.clamp((state.elapsed - revealDelay) / 0.55, 0, 1);
    const targetHeight = (datum.value / maxValue) * MAX_BAR_HEIGHT * easeOutCubic(revealed);
    const height = Math.max(0.0001, state.height.step(targetHeight, delta));

    state.lift = damp(state.lift, selected ? 1 : 0, 9, delta);
    state.glow = damp(state.glow, selected ? 1 : 0, 7, delta);
    state.presence = damp(state.presence, dimmed ? 0.45 : 1, 8, delta);

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
      capMaterial.current.emissiveIntensity = (2.1 + state.glow * 3.6) * (0.4 + 0.6 * state.presence);
      capMaterial.current.opacity = state.presence;
    }

    if (innerLight.current) {
      innerLight.current.position.y = height * 0.55;
      innerLight.current.intensity = 0.5 + state.glow * 16;
    }

    if (shellBack.current) {
      shellBack.current.opacity = SHELL_BACK_OPACITY * state.presence * (1 + state.glow * 0.6);
      shellBack.current.envMapIntensity = 2.1 + state.glow * 1.4;
    }

    if (shellFront.current) {
      shellFront.current.opacity = SHELL_FRONT_OPACITY * state.presence * (1 + state.glow * 0.5);
      shellFront.current.envMapIntensity = 2.1 + state.glow * 1.4;
    }

    if (coreMaterial.current) {
      coreMaterial.current.emissiveIntensity = 0.18 + state.glow * 0.8;
      if (coreMaterial.current.transparent) coreMaterial.current.opacity = 0.9 * state.presence;
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
            breaks the tie between these two by creation order, which gives a
            correct read through the glass without juggling renderOrder. */}
        {showShell && (
          <mesh geometry={shellGeometry}>
            <meshPhysicalMaterial
              ref={shellBack}
              color={color}
              side={THREE.BackSide}
              transparent
              opacity={SHELL_BACK_OPACITY}
              depthWrite={false}
              roughness={0.06}
              metalness={0}
              ior={1.5}
              clearcoat={1}
              clearcoatRoughness={0.04}
              envMapIntensity={2.1}
            />
          </mesh>
        )}

        {showCore && (
          <mesh
            geometry={solidCore ? shellGeometry : coreGeometry}
            position={solidCore ? [0, 0, 0] : [0, 0.02, 0]}
            scale={solidCore ? [1, 1, 1] : [1, 0.955, 1]}
          >
            <meshPhysicalMaterial
              ref={coreMaterial}
              color={color}
              emissive={color}
              emissiveIntensity={0.18}
              roughness={solidCore ? 0.26 : 0.34}
              metalness={0}
              clearcoat={1}
              clearcoatRoughness={0.1}
              sheen={0.18}
              sheenColor={color}
              sheenRoughness={0.45}
              envMapIntensity={1.15}
              transparent={!solidCore}
              opacity={solidCore ? 1 : 0.9}
            />
          </mesh>
        )}

        {showShell && (
          <mesh geometry={shellGeometry}>
            <meshPhysicalMaterial
              ref={shellFront}
              color={color}
              side={THREE.FrontSide}
              transparent
              opacity={SHELL_FRONT_OPACITY}
              depthWrite={false}
              roughness={0.03}
              metalness={0}
              ior={1.52}
              clearcoat={1}
              clearcoatRoughness={0.02}
              iridescence={0.45}
              iridescenceIOR={1.32}
              specularIntensity={1}
              envMapIntensity={2.1}
            />
          </mesh>
        )}
      </group>

      <mesh ref={cap} geometry={capGeometry}>
        <meshStandardMaterial
          ref={capMaterial}
          color="#0a0c18"
          emissive={color}
          emissiveIntensity={2.1}
          roughness={0.3}
          metalness={0.1}
          transparent
        />
      </mesh>

      {/* Inside the bar, so the glass lights up from within on selection. */}
      <pointLight ref={innerLight} color={color} intensity={0.5} distance={2.6} decay={2} />

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

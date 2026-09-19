import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import type { Datum } from '../data';
import { MAX_VALUE } from '../data';
import type { Finish } from '../theme';
import { Bar } from './Bar';
import { Platform } from './Platform';
import { Rig } from './Rig';
import { Studio } from './Studio';
import { barOffsetX } from './geometry';

type Props = {
  series: Datum[];
  finish: Finish;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  /** Drives the stagger: bump it to replay the grow-in. */
  revealKey: number;
};

const IDLE_ACCENT = '#8ea2ff';

export function GlassBarChart({ series, finish, selectedIndex, onSelect, revealKey }: Props) {
  const colors = useMemo(() => series.map((d) => d.color), [series]);
  const accent = selectedIndex === null ? IDLE_ACCENT : series[selectedIndex].color;

  return (
    <Canvas
      style={{ flex: 1 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.25, 9], fov: 36, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
      }}
    >
      <fogExp2 attach="fog" args={['#05060e', 0.036]} />
      <Studio accent={accent} />

      <Rig
        count={series.length}
        autoRotate={selectedIndex === null}
        onSelectBar={onSelect}
        onBackgroundPress={() => onSelect(null)}
      >
        <Platform colors={colors} />
        {series.map((datum, index) => (
          <group key={datum.id} position={[barOffsetX(index, series.length), 0, 0]}>
            <Bar
              key={`${datum.id}-${revealKey}`}
              index={index}
              datum={datum}
              maxValue={MAX_VALUE}
              finish={finish}
              selected={selectedIndex === index}
              dimmed={selectedIndex !== null && selectedIndex !== index}
              revealDelay={0.12 + index * 0.075}
            />
          </group>
        ))}
      </Rig>
    </Canvas>
  );
}

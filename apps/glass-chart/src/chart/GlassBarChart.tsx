import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import type { Datum } from '../data';
import { MAX_VALUE } from '../data';
import type { Lighting } from '../theme';
import { Bar } from './Bar';
import { Platform } from './Platform';
import { Rig } from './Rig';
import { Studio } from './Studio';
import { barOffsetX } from './geometry';
import { materialLibrary } from './materials';

type Props = {
  series: Datum[];
  lighting: Lighting;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  /** Drives the stagger: bump it to replay the grow-in. */
  revealKey: number;
};

export function GlassBarChart({ series, lighting, selectedIndex, onSelect, revealKey }: Props) {
  const library = useMemo(() => materialLibrary(), []);
  const materials = useMemo(
    () => series.map((datum) => library[datum.material]),
    [series, library],
  );

  return (
    <Canvas
      style={{ flex: 1 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      // near/far kept tight: a 0.1-60 range spends so much depth precision on
      // empty space that the contact shadows laid on the slab z-fight away.
      camera={{ position: [0, 2.6, 8.6], fov: 36, near: 2, far: 40 }}
      onCreated={({ gl }) => {
        // Khronos PBR Neutral: holds material colour and doesn't wash the
        // highlights out on a near-white set the way ACES does.
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
    >
      <Studio preset={lighting} />

      <Rig
        count={series.length}
        autoRotate={selectedIndex === null}
        onSelectBar={onSelect}
        onBackgroundPress={() => onSelect(null)}
      >
        <Platform materials={materials} />
        {series.map((datum, index) => (
          <group key={datum.id} position={[barOffsetX(index, series.length), 0, 0]}>
            <Bar
              key={`${datum.id}-${revealKey}`}
              index={index}
              datum={datum}
              material={materials[index]}
              maxValue={MAX_VALUE}
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

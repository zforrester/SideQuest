import { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

import type { DevConfig } from '../devConfig';
import type { Datum } from '../data';
import { MAX_VALUE } from '../data';
import type { Lighting } from '../theme';
import { Bar } from './Bar';
import { CameraControl } from './CameraControl';
import { Platform } from './Platform';
import { Rig } from './Rig';
import { Studio } from './Studio';
import { barOffsetX, disposeBarGeometries, makeBarGeometries } from './geometry';
import { materialLibrary } from './materials';

type Props = {
  series: Datum[];
  lighting: Lighting;
  selectedIndex: number | null;
  onSelect: (index: number | null) => void;
  /** Drives the stagger: bump it to replay the grow-in. */
  revealKey: number;
  dev: DevConfig;
};

export function GlassBarChart({
  series,
  lighting,
  selectedIndex,
  onSelect,
  revealKey,
  dev,
}: Props) {
  const library = useMemo(() => materialLibrary(), []);
  const materials = useMemo(
    () => series.map((datum) => library[datum.material]),
    [series, library],
  );

  const geometries = useMemo(() => makeBarGeometries(dev.bevel), [dev.bevel]);
  useEffect(() => () => disposeBarGeometries(geometries), [geometries]);

  return (
    <Canvas
      style={{ flex: 1 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      // near/far kept tight: a 0.1-60 range spends so much depth precision on
      // empty space that the contact shadows laid on the slab z-fight away.
      camera={{ position: [0, dev.cameraHeight, dev.cameraDistance], fov: dev.fov, near: 2, far: 40 }}
      onCreated={({ gl }) => {
        // Khronos PBR Neutral: holds material colour and doesn't wash the
        // highlights out on a near-white set the way ACES does.
        gl.toneMapping = THREE.NeutralToneMapping;
      }}
    >
      <CameraControl
        distance={dev.cameraDistance}
        height={dev.cameraHeight}
        fov={dev.fov}
      />
      <Studio preset={lighting} exposure={dev.exposure} lightFollow={dev.lightFollow} />

      <Rig
        count={series.length}
        autoRotate={dev.autoSway && selectedIndex === null}
        onSelectBar={onSelect}
        onBackgroundPress={() => onSelect(null)}
        yaw={dev.yaw}
        pitch={dev.pitch}
        fill={dev.fill}
      >
        <Platform materials={materials} />
        {series.map((datum, index) => (
          <group key={datum.id} position={[barOffsetX(index, series.length), 0, 0]}>
            <Bar
              key={`${datum.id}-${revealKey}`}
              index={index}
              datum={datum}
              material={materials[index]}
              geometries={geometries}
              maxValue={MAX_VALUE}
              selected={selectedIndex === index}
              dimmed={selectedIndex !== null && selectedIndex !== index}
              revealDelay={index * dev.stagger}
              growDuration={dev.growDuration}
              rimStrength={dev.edgeHighlight ? dev.rimStrength : 0}
              rimPower={dev.rimPower}
              lightFollow={dev.lightFollow}
              causticIntensity={dev.caustics ? dev.causticIntensity : 0}
            />
          </group>
        ))}
      </Rig>
    </Canvas>
  );
}

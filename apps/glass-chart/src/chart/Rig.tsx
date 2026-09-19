import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

import { clamp, damp } from './anim';
import { lightInput } from './lightInput';
import { MAX_BAR_HEIGHT, PLATE_THICKNESS, plateDepth, plateWidth } from './geometry';

const PITCH_LIMIT: [number, number] = [-0.12, 0.72];
/** Radians of yaw for a full-width swipe. */
const YAW_PER_SWIPE = 2.4;
const PITCH_PER_SWIPE = 1.1;
/** Normalized-device-coords travel below which a drag still counts as a tap. */
const TAP_SLOP = 0.035;
/** Seconds of stillness before the chart starts swaying by itself again. */
const IDLE_BEFORE_DRIFT = 3.5;
/** Amplitude and rate of that sway, in radians and radians per second. */
const SWAY_AMPLITUDE = 0.16;
const SWAY_RATE = 0.3;
/** Height the rig is dropped by, so it turns about its middle. */
const PIVOT_HEIGHT = MAX_BAR_HEIGHT * 0.45;

/** Height of the canvas the chart is allowed to fill, relative to the width
 *  budget the dev sheet sets. */
const FILL_Y_RATIO = 0.96;
/** Framing error (in NDC) small enough to ignore, so the rig can settle. */
const FRAME_DEADBAND = 0.005;

type RigProps = {
  count: number;
  children: ReactNode;
  onSelectBar: (index: number) => void;
  onBackgroundPress: () => void;
  autoRotate: boolean;
  /** Base angles from the dev sheet; dragging moves on from these. */
  yaw: number;
  pitch: number;
  fill: number;
};

function findBarIndex(object: THREE.Object3D | null): number | null {
  let node: THREE.Object3D | null = object;
  while (node) {
    const index = node.userData?.barIndex;
    if (typeof index === 'number') return index;
    node = node.parent;
  }
  return null;
}

/**
 * Holds the chart at its display angle and turns it under the drag. The rig
 * rotates rather than the camera, so the lights stay put and their highlights
 * sweep across the glass as it turns.
 *
 * Framing is measured rather than guessed: every frame the corners of the
 * chart's bounding box are projected to screen space and the rig is nudged to
 * keep that box centred and filling the canvas. A row seen at an angle
 * projects both narrower and off-centre (perspective makes the near end swing
 * wider than the far end), and by how much depends on the yaw and the screen,
 * so no fixed scale or offset frames it correctly on every device.
 */
export function Rig({
  count,
  children,
  onSelectBar,
  onBackgroundPress,
  autoRotate,
  yaw,
  pitch,
  fill,
}: RigProps) {
  const frame = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  const camera = useThree((state) => state.camera);
  const viewport = useThree((state) => state.viewport);

  const orbit = useRef({
    yaw,
    pitch,
    targetYaw: yaw,
    targetPitch: pitch,
    velocity: 0,
    idle: 0,
    /** Angle the sway settles around: wherever the user last left it. */
    restYaw: null as number | null,
    // Start small and let the first frames scale it up — that doubles as the
    // chart's entrance.
    scale: 0.25,
    offsetX: 0,
    offsetY: 0,
  }).current;

  useEffect(() => {
    orbit.targetYaw = yaw;
    orbit.restYaw = null;
  }, [yaw, orbit]);

  useEffect(() => {
    orbit.targetPitch = pitch;
  }, [pitch, orbit]);

  const drag = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    travel: 0,
    downIndex: null as number | null,
  }).current;

  /** Corners of the chart's extent, in the rotating group's local space. */
  const corners = useMemo(() => {
    // Measured off the base slab, which is the widest thing in the rig.
    const halfWidth = plateWidth(count) / 2;
    const halfDepth = plateDepth() / 2;
    const bottom = -PIVOT_HEIGHT - PLATE_THICKNESS;
    const top = MAX_BAR_HEIGHT - PIVOT_HEIGHT + 0.3;
    const points: THREE.Vector3[] = [];
    for (const x of [-halfWidth, halfWidth]) {
      for (const y of [bottom, top]) {
        for (const z of [-halfDepth, halfDepth]) {
          points.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    return points;
  }, [count]);

  const scratch = useRef(new THREE.Vector3()).current;

  /** Records the pointer for the lighting whether or not a drag is running. */
  const trackLight = (event: ThreeEvent<PointerEvent>) => {
    lightInput.pointerX = event.pointer.x;
    lightInput.pointerY = event.pointer.y;
    lightInput.pointerSeen = true;
  };

  const beginDrag = (event: ThreeEvent<PointerEvent>) => {
    trackLight(event);
    event.stopPropagation();
    drag.active = true;
    drag.lastX = event.pointer.x;
    drag.lastY = event.pointer.y;
    drag.travel = 0;
    drag.downIndex = findBarIndex(event.object);
    orbit.velocity = 0;
    orbit.idle = 0;
    orbit.restYaw = null;
  };

  const moveDrag = (event: ThreeEvent<PointerEvent>) => {
    trackLight(event);
    if (!drag.active) return;
    event.stopPropagation();
    const dx = event.pointer.x - drag.lastX;
    const dy = event.pointer.y - drag.lastY;
    drag.lastX = event.pointer.x;
    drag.lastY = event.pointer.y;
    drag.travel += Math.hypot(dx, dy);

    orbit.targetYaw += dx * YAW_PER_SWIPE;
    orbit.targetPitch = clamp(orbit.targetPitch + dy * PITCH_PER_SWIPE, ...PITCH_LIMIT);
    orbit.velocity = dx * YAW_PER_SWIPE;
    orbit.idle = 0;
  };

  const endDrag = (event: ThreeEvent<PointerEvent>) => {
    if (!drag.active) return;
    event.stopPropagation();
    drag.active = false;

    // A press that barely moved is a tap, not a throw.
    if (drag.travel <= TAP_SLOP) {
      orbit.velocity = 0;
      if (drag.downIndex !== null) onSelectBar(drag.downIndex);
      else onBackgroundPress();
    }
    drag.downIndex = null;
  };

  useFrame((_, delta) => {
    orbit.idle += delta;

    if (!drag.active) {
      // Throw momentum, then a slow idle drift once the user lets go.
      orbit.targetYaw += orbit.velocity;
      orbit.velocity *= Math.pow(0.02, delta);
      if (Math.abs(orbit.velocity) < 1e-4) orbit.velocity = 0;

      if (autoRotate && orbit.idle > IDLE_BEFORE_DRIFT) {
        // Sway around wherever the chart was left rather than spinning off:
        // an unbounded drift walks the row past side-on and reverses the
        // apparent order of the months.
        if (orbit.restYaw === null) orbit.restYaw = orbit.targetYaw;
        const phase = (orbit.idle - IDLE_BEFORE_DRIFT) * SWAY_RATE;
        const rest = orbit.restYaw + Math.sin(phase) * SWAY_AMPLITUDE;
        orbit.targetYaw = damp(orbit.targetYaw, rest, 1.4, delta);
      }
    }

    orbit.yaw = damp(orbit.yaw, orbit.targetYaw, 9, delta);
    orbit.pitch = damp(orbit.pitch, orbit.targetPitch, 9, delta);

    if (!group.current || !frame.current) return;
    group.current.rotation.set(orbit.pitch, orbit.yaw, -0.045);
    group.current.scale.setScalar(orbit.scale);
    frame.current.position.set(orbit.offsetX, orbit.offsetY, 0);
    frame.current.updateMatrixWorld(true);

    // Measure where the chart actually landed on screen.
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const corner of corners) {
      scratch.copy(corner).applyMatrix4(group.current.matrixWorld).project(camera);
      minX = Math.min(minX, scratch.x);
      maxX = Math.max(maxX, scratch.x);
      minY = Math.min(minY, scratch.y);
      maxY = Math.max(maxY, scratch.y);
    }

    // NDC spans 2 across the canvas, so a full-width box measures 2.
    const overflow = Math.max(
      (maxX - minX) / (2 * fill),
      (maxY - minY) / (2 * fill * FILL_Y_RATIO),
    );
    if (overflow > 0) {
      orbit.scale = damp(orbit.scale, clamp(orbit.scale / overflow, 0.05, 4), 4, delta);
    }

    const errorX = (minX + maxX) / 2;
    const errorY = (minY + maxY) / 2;
    if (Math.abs(errorX) > FRAME_DEADBAND) {
      // NDC -> world at the rig's depth, where viewport is measured.
      orbit.offsetX = damp(orbit.offsetX, orbit.offsetX - (errorX * viewport.width) / 2, 4, delta);
    }
    if (Math.abs(errorY) > FRAME_DEADBAND) {
      orbit.offsetY = damp(orbit.offsetY, orbit.offsetY - (errorY * viewport.height) / 2, 4, delta);
    }
  });

  return (
    // Outer group is static: it owns the handlers (events bubble up to it)
    // and the backdrop, so neither is affected by the framing below.
    <group
      onPointerDown={beginDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <group ref={frame}>
        <group ref={group} rotation-order="YXZ">
          {/* Drop the chart so the turn pivots around its middle. */}
          <group position={[0, -PIVOT_HEIGHT, 0]}>{children}</group>
        </group>
      </group>
      {/* Catches drags that start on empty space behind the row. */}
      <mesh position={[0, 0, -7]} visible={false}>
        <planeGeometry args={[80, 60]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

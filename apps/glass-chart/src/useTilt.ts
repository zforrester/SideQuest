import { useEffect } from 'react';
import { Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

import { lightInput } from './chart/lightInput';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** Tilt range mapped to the full -1..1 aim: about 36 degrees each way. */
const RANGE = Math.PI / 5;

/**
 * Feeds device tilt into the light aim.
 *
 * The rest pose is whatever the device was doing on the first reading rather
 * than a fixed value — people hold a phone at very different angles, and
 * measuring from an assumed upright would leave the light pinned to one side.
 *
 * Desktop browsers fire no motion events, so `hasTilt` stays false there and
 * the pointer drives the light instead.
 */
export function useTilt(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;
    let rest: { beta: number; gamma: number } | null = null;

    DeviceMotion.isAvailableAsync()
      .then((available) => {
        if (!available || cancelled) return;
        // Not implemented on web, and calling it there only logs a warning.
        if (Platform.OS !== 'web') DeviceMotion.setUpdateInterval(50);
        subscription = DeviceMotion.addListener(({ rotation }) => {
          if (!rotation) return;
          if (!rest) {
            rest = { beta: rotation.beta, gamma: rotation.gamma };
            return;
          }
          lightInput.hasTilt = true;
          lightInput.tiltX = clamp((rotation.gamma - rest.gamma) / RANGE, -1, 1);
          lightInput.tiltY = clamp(-(rotation.beta - rest.beta) / RANGE, -1, 1);
        });
      })
      .catch(() => {
        // No sensor, or the browser refused it. The pointer still works.
      });

    return () => {
      cancelled = true;
      subscription?.remove();
      lightInput.hasTilt = false;
    };
  }, [enabled]);
}

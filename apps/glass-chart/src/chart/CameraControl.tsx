import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';

type Props = {
  distance: number;
  height: number;
  fov: number;
};

/**
 * The Canvas `camera` prop only seeds the camera, so live changes from the
 * dev sheet have to be applied to the instance.
 */
export function CameraControl({ distance, height, fov }: Props) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;

  useEffect(() => {
    camera.position.set(0, height, distance);
    camera.lookAt(0, 0, 0);
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, distance, height, fov]);

  return null;
}

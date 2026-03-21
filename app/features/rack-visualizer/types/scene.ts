import type { Camera, OrthographicCamera, PerspectiveCamera } from "three";

export interface CageCameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface OrbitControlsLike {
  object: Camera;
  target: {
    x: number;
    y: number;
    z: number;
    set: (x: number, y: number, z: number) => void;
  };
  update: () => void;
  addEventListener: (type: "change", callback: () => void) => void;
  removeEventListener: (type: "change", callback: () => void) => void;
}

export function getCameraZoom(camera: Camera) {
  return "zoom" in camera ? (camera as PerspectiveCamera | OrthographicCamera).zoom : 1;
}

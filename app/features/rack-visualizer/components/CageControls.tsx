import { useEffect } from "react";
import type { MutableRefObject } from "react";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import type { Camera, OrthographicCamera, PerspectiveCamera } from "three";
import { MathUtils, Vector3 } from "three";

import { SCENE_CAMERA, SCENE_TRANSITIONS } from "~/features/rack-visualizer/config/scene";
import type { CageCameraState, OrbitControlsLike } from "~/features/rack-visualizer/types/scene";

interface CageControlsProps {
  controlsRef: MutableRefObject<OrbitControlsLike | null>;
  desiredCameraState: CageCameraState;
  resetVersion: number;
  sceneViewMode: "overview" | "focused";
}

function applyCameraState(camera: Camera, controls: OrbitControlsLike | null, nextState: CageCameraState) {
  camera.position.set(...nextState.position);
  if ("zoom" in camera) {
    (camera as PerspectiveCamera | OrthographicCamera).zoom = nextState.zoom;
  }
  if ("updateProjectionMatrix" in camera && typeof camera.updateProjectionMatrix === "function") {
    camera.updateProjectionMatrix();
  }
  if (controls) {
    controls.target.set(...nextState.target);
    controls.update();
  }
}

export function CageControls({
  controlsRef,
  desiredCameraState,
  resetVersion,
  sceneViewMode,
}: CageControlsProps) {
  const { camera } = useThree();

  useEffect(() => {
    applyCameraState(camera, controlsRef.current, desiredCameraState);
  }, [camera, desiredCameraState, resetVersion, controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) {
      return;
    }

    const positionBlend =
      1 -
      Math.exp(
        -delta *
          (sceneViewMode === "focused"
            ? 3 / SCENE_TRANSITIONS.focusInTime
            : 3 / SCENE_TRANSITIONS.focusOutTime),
      );
    const zoomBlend =
      1 -
      Math.exp(
        -delta *
          (sceneViewMode === "focused"
            ? 3 / SCENE_TRANSITIONS.focusInZoomTime
            : 3 / SCENE_TRANSITIONS.focusOutZoomTime),
      );

    camera.position.lerp(
      new Vector3(...desiredCameraState.position),
      positionBlend,
    );
    controls.target.set(
      MathUtils.lerp(controls.target.x, desiredCameraState.target[0], positionBlend),
      MathUtils.lerp(controls.target.y, desiredCameraState.target[1], positionBlend),
      MathUtils.lerp(controls.target.z, desiredCameraState.target[2], positionBlend),
    );

    if ("zoom" in camera) {
      (camera as PerspectiveCamera | OrthographicCamera).zoom = MathUtils.lerp(
        (camera as PerspectiveCamera | OrthographicCamera).zoom,
        desiredCameraState.zoom,
        zoomBlend,
      );
    }

    camera.updateProjectionMatrix();
    controls.update();
  });

  return (
    <OrbitControls
      ref={(value) => {
        controlsRef.current = value as OrbitControlsLike | null;
      }}
      makeDefault
      enableRotate={sceneViewMode === "overview"}
      enableZoom={sceneViewMode === "overview"}
      enablePan={false}
      minDistance={3}
      maxDistance={28}
      minPolarAngle={Math.PI / 5}
      maxPolarAngle={Math.PI / 2.05}
      dampingFactor={0.08}
      rotateSpeed={0.68}
      zoomSpeed={0.75}
      enableDamping
      target={SCENE_CAMERA.target}
    />
  );
}

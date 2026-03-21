import { useMemo } from "react";

import { SCENE_CAMERA, SCENE_DIMENSIONS } from "~/features/rack-visualizer/config/scene";
import type { CageLayout, RackPlacement } from "~/features/rack-visualizer/types/domain";
import type { CageCameraState } from "~/features/rack-visualizer/types/scene";

export function useCameraFocusAnimation(
  cageLayout: CageLayout,
  selectedRack: RackPlacement | null,
  sceneViewMode: "overview" | "focused",
  overviewCameraPreset: "home" | "top" = "home",
): CageCameraState {
  return useMemo(() => {
    if (sceneViewMode === "focused" && selectedRack) {
      return {
        position: [
          selectedRack.x + 1.65,
          SCENE_DIMENSIONS.rackHeight * 0.9,
          selectedRack.z + 2.85,
        ],
        target: [selectedRack.x + 0.08, SCENE_DIMENSIONS.rackHeight * 0.72, selectedRack.z + 0.02],
        zoom: 1,
      };
    }

    if (overviewCameraPreset === "top") {
      const overviewHeight = Math.max(Math.max(cageLayout.cageLength, cageLayout.cageWidth) * 1.2, 8.5);

      return {
        position: [0, overviewHeight, 0.01],
        target: [0, 0, 0],
        zoom: 0.92,
      };
    }

    return {
      position: [
        Math.max(cageLayout.cageLength * 0.6, 6.75),
        Math.max(Math.max(cageLayout.cageLength, cageLayout.cageWidth) * 0.56, 5.9),
        Math.max(cageLayout.cageWidth * 0.9, 6.15),
      ],
      target: [0, SCENE_CAMERA.target[1], 0],
      zoom: 0.9,
    };
  }, [cageLayout, overviewCameraPreset, sceneViewMode, selectedRack]);
}

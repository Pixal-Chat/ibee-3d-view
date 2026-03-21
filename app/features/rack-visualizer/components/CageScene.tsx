import { memo, useMemo, useRef, useState } from "react";

import { Canvas } from "@react-three/fiber";

import { SCENE_CAMERA, SCENE_COLORS, SCENE_LIGHTING } from "~/features/rack-visualizer/config/scene";
import { CageBoundary } from "~/features/rack-visualizer/components/CageBoundary";
import { CageControls } from "~/features/rack-visualizer/components/CageControls";
import { RackOutlineMesh } from "~/features/rack-visualizer/components/RackOutlineMesh";
import { useCameraFocusAnimation } from "~/features/rack-visualizer/hooks/useCameraFocusAnimation";
import type { CageLayout } from "~/features/rack-visualizer/types/domain";
import type { OrbitControlsLike } from "~/features/rack-visualizer/types/scene";
import { getCagePlacementMetrics } from "~/features/rack-visualizer/utils/cage-layout";

interface CageSceneProps {
  cageLayout: CageLayout;
  selectedRackId: string | null;
  sceneViewMode: "overview" | "focused";
  overviewCameraPreset?: "home" | "top";
  resetVersion: number;
  canAddToSelectedRack: boolean;
  onOpenRackAddForm: () => void;
  onSelectRack: (rackId: string) => void;
}

export const CageScene = memo(function CageScene({
  cageLayout,
  selectedRackId,
  sceneViewMode,
  overviewCameraPreset = "home",
  resetVersion,
  canAddToSelectedRack,
  onOpenRackAddForm,
  onSelectRack,
}: CageSceneProps) {
  const controlsRef = useRef<OrbitControlsLike | null>(null);
  const [hoveredRackId, setHoveredRackId] = useState<string | null>(null);

  const metrics = useMemo(() => getCagePlacementMetrics(cageLayout), [cageLayout]);
  const selectedRackPlacement = useMemo(
    () => cageLayout.racks.find((rack) => rack.rackId === selectedRackId) ?? null,
    [cageLayout.racks, selectedRackId],
  );
  const desiredCameraState = useCameraFocusAnimation(
    cageLayout,
    selectedRackPlacement,
    sceneViewMode,
    overviewCameraPreset,
  );
  const visibleRacks = useMemo(
    () =>
      sceneViewMode === "focused" && selectedRackPlacement
        ? [selectedRackPlacement]
        : cageLayout.racks,
    [cageLayout.racks, sceneViewMode, selectedRackPlacement],
  );

  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.5]}
      camera={{ fov: SCENE_CAMERA.fov, position: [...SCENE_CAMERA.position] }}
      gl={{ antialias: true }}
      onPointerMissed={() => setHoveredRackId(null)}
    >
      <color attach="background" args={[SCENE_COLORS.background]} />
      <ambientLight intensity={SCENE_LIGHTING.ambient} />
      <hemisphereLight args={["#ffffff", "#f1f5f9", SCENE_LIGHTING.hemisphere]} />
      <directionalLight position={[8, 10, 6]} intensity={SCENE_LIGHTING.directional} color="#ffffff" />
      <pointLight position={[-5, 6, -4]} intensity={SCENE_LIGHTING.fill} color="#ffffff" />

      {sceneViewMode === "overview" ? (
        <CageBoundary
          cageLength={cageLayout.cageLength}
          cageWidth={cageLayout.cageWidth}
          floorSize={metrics.floorSize}
          isFocused={false}
        />
      ) : null}

      {visibleRacks.map((rack) => (
        <RackOutlineMesh
          key={rack.rackId}
          placement={rack}
          isHovered={hoveredRackId === rack.rackId}
          isSelected={selectedRackId === rack.rackId}
          isDimmed={false}
          isInteractive={sceneViewMode === "overview"}
          showAddTrigger={sceneViewMode === "focused" && rack.rackId === selectedRackId && canAddToSelectedRack}
          onAddTrigger={onOpenRackAddForm}
          label={rack.rackName}
          onHover={setHoveredRackId}
          onSelect={onSelectRack}
        />
      ))}

      <CageControls
        controlsRef={controlsRef}
        desiredCameraState={desiredCameraState}
        resetVersion={resetVersion}
        sceneViewMode={sceneViewMode}
      />
    </Canvas>
  );
});

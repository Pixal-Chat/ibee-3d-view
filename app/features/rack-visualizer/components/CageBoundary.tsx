import { Edges, Grid } from "@react-three/drei";

import { SCENE_COLORS, SCENE_DIMENSIONS } from "~/features/rack-visualizer/config/scene";

interface CageBoundaryProps {
  cageLength: number;
  cageWidth: number;
  floorSize: [number, number];
  isFocused?: boolean;
}

export function CageBoundary({ cageLength, cageWidth, floorSize, isFocused = false }: CageBoundaryProps) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={floorSize} />
        <meshStandardMaterial color={SCENE_COLORS.floor} metalness={0.02} roughness={0.98} />
      </mesh>

      <Grid
        args={floorSize}
        position={[0, 0.001, 0]}
        cellSize={0.7}
        cellThickness={0.45}
        cellColor={SCENE_COLORS.floorAccent}
        sectionSize={3.5}
        sectionThickness={0.65}
        sectionColor={isFocused ? SCENE_COLORS.boundaryMuted : SCENE_COLORS.boundary}
        fadeDistance={isFocused ? 16 : 24}
        fadeStrength={1}
        infiniteGrid={false}
      />

      <mesh position={[0, SCENE_DIMENSIONS.cageWallHeight / 2, 0]}>
        <boxGeometry args={[cageLength, SCENE_DIMENSIONS.cageWallHeight, cageWidth]} />
        <meshBasicMaterial transparent opacity={0.01} />
        <Edges color={isFocused ? SCENE_COLORS.boundaryMuted : SCENE_COLORS.boundary} />
      </mesh>
    </group>
  );
}

import { memo, useMemo, useRef } from "react";

import { Edges, Html, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { MathUtils } from "three";

import { SCENE_COLORS, SCENE_DIMENSIONS, SCENE_TRANSITIONS } from "~/features/rack-visualizer/config/scene";
import { RackHoverLabel } from "~/features/rack-visualizer/components/RackHoverLabel";
import type { RackPlacement } from "~/features/rack-visualizer/types/domain";

interface RackOutlineMeshProps {
  placement: RackPlacement;
  isHovered: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  isInteractive: boolean;
  showAddTrigger?: boolean;
  onAddTrigger?: () => void;
  label: string;
  onHover: (rackId: string | null) => void;
  onSelect: (rackId: string) => void;
}

export const RackOutlineMesh = memo(function RackOutlineMesh({
  placement,
  isHovered,
  isSelected,
  isDimmed,
  isInteractive,
  showAddTrigger = false,
  onAddTrigger,
  label,
  onHover,
  onSelect,
}: RackOutlineMeshProps) {
  const position = useMemo<[number, number, number]>(
    () => [placement.x, SCENE_DIMENSIONS.rackHeight / 2, placement.z],
    [placement.x, placement.z],
  );
  const groupRef = useRef<Group | null>(null);
  const meshRef = useRef<Mesh | null>(null);

  useCursor(isHovered && isInteractive);

  useFrame((_, delta) => {
    if (!groupRef.current || !meshRef.current) {
      return;
    }

    const lift = isHovered ? SCENE_DIMENSIONS.hoverLift : isSelected ? SCENE_DIMENSIONS.selectedLift : 0;
    const scale = isHovered || isSelected ? 1.02 : 1;
    const material = meshRef.current.material;
    const targetOpacity = isSelected ? 0.16 : isDimmed ? 0.01 : isHovered ? 0.11 : 0.05;
    const targetScale = isDimmed ? 0.985 : scale;
    const motionMultiplier = isDimmed ? 3 / SCENE_TRANSITIONS.rackFadeOutTime : 3 / SCENE_TRANSITIONS.rackFadeInTime;

    groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, lift, delta * 8);
    groupRef.current.scale.setScalar(MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * motionMultiplier));

    if ("opacity" in material) {
      material.opacity = MathUtils.lerp(material.opacity, targetOpacity, delta * motionMultiplier);
    }
  });

  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
      <mesh
        ref={meshRef}
        position={[0, position[1], 0]}
        onPointerEnter={(event) => {
          if (!isInteractive) {
            return;
          }
          event.stopPropagation();
          onHover(placement.rackId);
        }}
        onPointerLeave={(event) => {
          if (!isInteractive) {
            return;
          }
          event.stopPropagation();
          onHover(null);
        }}
        onClick={(event) => {
          if (!isInteractive) {
            return;
          }
          event.stopPropagation();
          onSelect(placement.rackId);
        }}
      >
        <boxGeometry args={[placement.width, SCENE_DIMENSIONS.rackHeight, placement.depth]} />
        <meshStandardMaterial
          transparent
          opacity={isSelected ? 0.16 : isDimmed ? 0.01 : isHovered ? 0.11 : 0.05}
          color={isSelected ? SCENE_COLORS.rackFillSelected : SCENE_COLORS.rackFill}
          metalness={0.04}
          roughness={0.8}
        />
        <Edges
          color={
            isSelected
              ? SCENE_COLORS.rackSelected
              : isDimmed
                ? SCENE_COLORS.boundaryMuted
                : isHovered
                  ? SCENE_COLORS.rackHovered
                  : SCENE_COLORS.rack
          }
        />
      </mesh>
      {isHovered && !isDimmed ? (
        <RackHoverLabel
          label={label}
          position={[0, SCENE_DIMENSIONS.rackHeight + 0.22, 0]}
        />
      ) : null}
      {showAddTrigger ? (
        <Html
          position={[placement.width / 2 - 0.02, SCENE_DIMENSIONS.rackHeight * 0.54, placement.depth / 2 - 0.03]}
          center
          transform
          distanceFactor={11}
          zIndexRange={[10, 0]}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddTrigger?.();
            }}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-orange-200/90 bg-white/95 text-primary shadow-sm transition hover:border-primary hover:scale-105"
            style={{ transform: "rotateY(-22deg) rotateZ(-8deg)" }}
            aria-label={`Add utility to ${label}`}
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-2.5 w-2.5" aria-hidden="true">
              <path
                d="M10 4.167v11.666M4.167 10h11.666"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </Html>
      ) : null}
    </group>
  );
});

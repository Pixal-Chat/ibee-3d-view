import { SCENE_DIMENSIONS } from "~/features/rack-visualizer/config/scene";
import type { CageDimensions, CageLayout, RackPlacement } from "~/features/rack-visualizer/types/domain";

export interface CageLayoutValidation {
  isValid: boolean;
  messages: string[];
}

export interface CagePlacementMetrics {
  rowSpacing: number;
  floorSize: [number, number];
  firstRackCenterX: number;
  firstRackCenterZ: number;
}

function buildRackName(index: number) {
  return `Rack ${index}`;
}

function buildRackId(index: number) {
  return `rack-${index}`;
}

export function getCagePlacementMetrics(dimensions: CageDimensions): CagePlacementMetrics {
  const firstRackCenterX =
    -dimensions.cageLength / 2 + dimensions.cagePadding + SCENE_DIMENSIONS.rackWidth / 2;
  const firstRackCenterZ =
    -dimensions.cageWidth / 2 + dimensions.cagePadding + SCENE_DIMENSIONS.rackDepth / 2;

  return {
    rowSpacing: SCENE_DIMENSIONS.rowSpacing,
    floorSize: [
      dimensions.cageLength + SCENE_DIMENSIONS.floorMargin * 2,
      dimensions.cageWidth + SCENE_DIMENSIONS.floorMargin * 2,
    ],
    firstRackCenterX,
    firstRackCenterZ,
  };
}

export function validateCageLayout(dimensions: CageDimensions): CageLayoutValidation {
  const usableLength = dimensions.cageLength - dimensions.cagePadding * 2;
  const usableWidth = dimensions.cageWidth - dimensions.cagePadding * 2;
  const requiredLength = dimensions.racksPerRow * SCENE_DIMENSIONS.rackWidth;
  const requiredWidth =
    dimensions.numberOfRows * SCENE_DIMENSIONS.rackDepth +
    Math.max(dimensions.numberOfRows - 1, 0) * SCENE_DIMENSIONS.rowSpacing;

  const messages: string[] = [];

  if (requiredLength > usableLength) {
    messages.push(
      `Row width requires ${requiredLength.toFixed(1)}m but only ${Math.max(usableLength, 0).toFixed(1)}m is available after padding.`,
    );
  }

  if (requiredWidth > usableWidth) {
    messages.push(
      `Row depth requires ${requiredWidth.toFixed(1)}m but only ${Math.max(usableWidth, 0).toFixed(1)}m is available after padding.`,
    );
  }

  return {
    isValid: messages.length === 0,
    messages,
  };
}

export function generateRackPlacements(dimensions: CageDimensions): RackPlacement[] {
  const metrics = getCagePlacementMetrics(dimensions);
  const placements: RackPlacement[] = [];
  let index = 1;
  const totalRacks = dimensions.numberOfRows * dimensions.racksPerRow;

  // Number from the opposite side of each row so old Rack 10 becomes the new Rack 1.
  for (let row = 0; row < dimensions.numberOfRows; row += 1) {
    for (let visualColumn = 0; visualColumn < dimensions.racksPerRow; visualColumn += 1) {
      const sourceColumn = dimensions.racksPerRow - 1 - visualColumn;
      const displayIndex = totalRacks - index + 1;

      placements.push({
        rackId: buildRackId(displayIndex),
        rackName: buildRackName(displayIndex),
        row,
        column: visualColumn,
        x: metrics.firstRackCenterX + sourceColumn * SCENE_DIMENSIONS.rackWidth,
        y: 0,
        z: metrics.firstRackCenterZ + row * (SCENE_DIMENSIONS.rackDepth + metrics.rowSpacing),
        width: SCENE_DIMENSIONS.rackWidth,
        depth: SCENE_DIMENSIONS.rackDepth,
        facing: row % 2 === 1 ? "south" : "north",
      });
      index += 1;
    }
  }

  return placements;
}

export function buildDerivedCageLayout(
  baseLayout: Pick<CageLayout, "id" | "name">,
  dimensions: CageDimensions,
): CageLayout {
  return {
    ...baseLayout,
    ...dimensions,
    racks: generateRackPlacements(dimensions),
  };
}

import type {
  CageDimensions,
  CageLayout,
  InventoryItemDefinition,
  Rack,
  RackPlacement,
  RackUnitItem,
} from "~/features/rack-visualizer/types/domain";
import { generateRackPlacements } from "~/features/rack-visualizer/utils/cage-layout";

const DEFAULT_CAGE: Omit<CageLayout, "racks"> & CageDimensions = {
  id: "cage-primary",
  name: "Primary DC Cage",
  cageLength: 8.6,
  cageWidth: 5.3,
  cagePadding: 0.91,
  numberOfRows: 2,
  racksPerRow: 10,
};

const INVENTORY_DEFINITIONS: InventoryItemDefinition[] = [
  { id: "servers-1u", key: "servers-1u", category: "servers", label: "1U Server", unitSize: 1, powerW: 120 },
  { id: "servers-2u", key: "servers-2u", category: "servers", label: "2U Server", unitSize: 2, powerW: 220 },
  { id: "switches-24p", key: "switches-24p", category: "switches", label: "1U Switch 24P", unitSize: 1, powerW: 60 },
  { id: "switches-48p", key: "switches-48p", category: "switches", label: "1U Switch 48P", unitSize: 1, powerW: 110 },
  { id: "storage-1u", key: "storage-1u", category: "storage", label: "1U Storage", unitSize: 1, powerW: 90 },
  { id: "storage-4u", key: "storage-4u", category: "storage", label: "4U Storage", unitSize: 4, powerW: 260 },
  { id: "placeholder-1u", key: "placeholder-1u", category: "placeholder", label: "1-RU Placeholder", unitSize: 1, powerW: 0 },
  { id: "placeholder-2u", key: "placeholder-2u", category: "placeholder", label: "2-RU Placeholder", unitSize: 2, powerW: 0 },
];

function buildRackName(index: number) {
  return `Rack ${index}`;
}

function buildRackId(index: number) {
  return `rack-${index}`;
}

function createSeedRackItems(rackId: string, rackIndex: number): RackUnitItem[] {
  switch (rackIndex) {
    case 2:
      return [
        {
          id: `${rackId}-item-switch`,
          rackId,
          definitionId: "switches-48p",
          type: "1U Switch 48P",
          label: "Aggregation switch",
          category: "switches",
          sizeU: 1,
          startUnit: 1,
          powerW: 110,
        },
        {
          id: `${rackId}-item-storage`,
          rackId,
          definitionId: "storage-4u",
          type: "4U Storage",
          label: "Storage shelf",
          category: "storage",
          sizeU: 4,
          startUnit: 4,
          powerW: 260,
        },
      ];
    case 3:
    case 6:
      return [
        {
          id: `${rackId}-item-top-switch`,
          rackId,
          definitionId: "switches-24p",
          type: "1U Switch 24P",
          label: "Top-of-rack switch",
          category: "switches",
          sizeU: 1,
          startUnit: 1,
          powerW: 60,
        },
        {
          id: `${rackId}-item-server`,
          rackId,
          definitionId: "servers-2u",
          type: "2U Server",
          label: "Compute node",
          category: "servers",
          sizeU: 2,
          startUnit: 4,
          powerW: 220,
        },
      ];
    case 8:
      return [
        {
          id: `${rackId}-item-server`,
          rackId,
          definitionId: "servers-1u",
          type: "1U Server",
          label: "Edge node",
          category: "servers",
          sizeU: 1,
          startUnit: 1,
          powerW: 120,
        },
        {
          id: `${rackId}-item-storage`,
          rackId,
          definitionId: "storage-1u",
          type: "1U Storage",
          label: "Boot media shelf",
          category: "storage",
          sizeU: 1,
          startUnit: 3,
          powerW: 90,
        },
        {
          id: `${rackId}-item-switch`,
          rackId,
          definitionId: "switches-24p",
          type: "1U Switch 24P",
          label: "Access switch",
          category: "switches",
          sizeU: 1,
          startUnit: 6,
          powerW: 60,
        },
      ];
    default:
      return [];
  }
}

function buildRackPlacements(): RackPlacement[] {
  return generateRackPlacements(DEFAULT_CAGE);
}

function buildRacks(): Rack[] {
  const placements = buildRackPlacements();

  return placements.map((placement, offset) => ({
    id: placement.rackId,
    name: placement.rackName,
    totalUnits: 42,
    row: placement.row,
    column: placement.column,
    // Start positions are explicit so later editors can insert items and compute the next available "+" slot.
    items: createSeedRackItems(placement.rackId, offset + 1),
  }));
}

const RACKS = buildRacks();
const PLACEMENTS = buildRackPlacements();

export async function getCageLayout(): Promise<CageLayout> {
  return {
    ...DEFAULT_CAGE,
    racks: PLACEMENTS,
  };
}

export async function getInventoryDefinitions(): Promise<InventoryItemDefinition[]> {
  return INVENTORY_DEFINITIONS;
}

export async function getRackById(rackId: string): Promise<Rack | null> {
  return RACKS.find((rack) => rack.id === rackId) ?? null;
}

export async function getAllRacks(): Promise<Rack[]> {
  return RACKS;
}

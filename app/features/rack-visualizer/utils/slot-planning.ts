import type { InventoryItemDefinition, RackUnitItem } from "~/features/rack-visualizer/types/domain";

export interface RackSlotState {
  unit: number;
  occupiedByItemId: string | null;
}

export interface RackGridUnit {
  unit: number;
  occupiedByItemId: string | null;
  item: RackUnitItem | null;
  isItemStart: boolean;
}

export function getItemHeightUnits(item: Pick<RackUnitItem, "sizeU"> | Pick<InventoryItemDefinition, "unitSize">) {
  return "sizeU" in item ? item.sizeU : item.unitSize;
}

export function buildRackSlotMap(items: RackUnitItem[], totalUnits = 42): RackSlotState[] {
  const slots: RackSlotState[] = Array.from({ length: totalUnits }, (_, index) => ({
    unit: index + 1,
    occupiedByItemId: null,
  }));

  for (const item of [...items].sort((left, right) => left.startUnit - right.startUnit)) {
    for (let offset = 0; offset < item.sizeU; offset += 1) {
      const slot = slots[item.startUnit - 1 + offset];

      if (slot) {
        slot.occupiedByItemId = item.id;
      }
    }
  }

  return slots;
}

export function getNextAvailableUnit(items: RackUnitItem[], totalUnits = 42): number | null {
  const slots = buildRackSlotMap(items, totalUnits);
  return slots.find((slot) => slot.occupiedByItemId === null)?.unit ?? null;
}

export function canPlaceItem(
  items: RackUnitItem[],
  startUnit: number,
  sizeU: number,
  totalUnits = 42,
) {
  if (startUnit < 1 || startUnit + sizeU - 1 > totalUnits) {
    return false;
  }

  const slotMap = buildRackSlotMap(items, totalUnits);

  for (let offset = 0; offset < sizeU; offset += 1) {
    const slot = slotMap[startUnit - 1 + offset];
    if (!slot || slot.occupiedByItemId !== null) {
      return false;
    }
  }

  return true;
}

export function generateRackUnitGrid(items: RackUnitItem[], totalUnits = 42): RackGridUnit[] {
  const sortedItems = [...items].sort((left, right) => left.startUnit - right.startUnit);
  const itemLookup = new Map(sortedItems.map((item) => [item.id, item]));
  const slots = buildRackSlotMap(sortedItems, totalUnits);

  return slots.map((slot) => ({
    unit: slot.unit,
    occupiedByItemId: slot.occupiedByItemId,
    item: slot.occupiedByItemId ? itemLookup.get(slot.occupiedByItemId) ?? null : null,
    isItemStart: slot.occupiedByItemId
      ? itemLookup.get(slot.occupiedByItemId)?.startUnit === slot.unit
      : false,
  }));
}

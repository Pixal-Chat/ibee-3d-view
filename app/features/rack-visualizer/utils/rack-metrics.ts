import type {
  InventoryCategory,
  InventoryItemDefinition,
  RackUnitItem,
} from "~/features/rack-visualizer/types/domain";
import { getNextAvailableUnit } from "~/features/rack-visualizer/utils/slot-planning";

export const DEFAULT_RACK_POWER_CAPACITY_W = 999;

export function getRackUsedPower(items: RackUnitItem[], definitions: InventoryItemDefinition[]) {
  const powerByDefinitionId = new Map(definitions.map((definition) => [definition.id, definition.powerW]));

  return items.reduce((sum, item) => sum + (powerByDefinitionId.get(item.definitionId) ?? 0), 0);
}

export function getRackAvailablePower(capacityW: number, usedPowerW: number) {
  return Math.max(capacityW - usedPowerW, 0);
}

export function getRackCategoryCounts(items: RackUnitItem[]) {
  return items.reduce<Record<InventoryCategory, number>>(
    (counts, item) => {
      counts[item.category] += 1;
      return counts;
    },
    {
      servers: 0,
      switches: 0,
      storage: 0,
      placeholder: 0,
    },
  );
}

export function getRackMetrics(
  items: RackUnitItem[],
  definitions: InventoryItemDefinition[],
  totalUnits = 42,
) {
  const usedPowerW = getRackUsedPower(items, definitions);
  const availablePowerW = getRackAvailablePower(DEFAULT_RACK_POWER_CAPACITY_W, usedPowerW);
  const nextAvailableUnit = getNextAvailableUnit(items, totalUnits);
  const categoryCounts = getRackCategoryCounts(items);

  return {
    usedPowerW,
    availablePowerW,
    nextAvailableUnit,
    categoryCounts,
    itemCount: items.length,
  };
}

import { useMemo, useState } from "react";

import { BackToCageButton } from "~/features/rack-visualizer/components/BackToCageButton";
import { Rack2DDiagram } from "~/features/rack-visualizer/components/Rack2DDiagram";
import { RackDetailsPanel } from "~/features/rack-visualizer/components/RackDetailsPanel";
import { RackUtilityControlsCard } from "~/features/rack-visualizer/components/RackUtilityControlsCard";
import type {
  InventoryItemDefinition,
  Rack,
  RackConnection,
  RackUnitItem,
} from "~/features/rack-visualizer/types/domain";
import { canPlaceItem } from "~/features/rack-visualizer/utils/slot-planning";
import { getRackMetrics } from "~/features/rack-visualizer/utils/rack-metrics";

interface FocusedRackLayoutProps {
  rack: Rack;
  items: RackUnitItem[];
  inventoryDefinitions: InventoryItemDefinition[];
  addFormUnit: number | null;
  isAddFormOpen: boolean;
  connections: RackConnection[];
  onBack: () => void;
  onOpenAddForm: (unit: number) => void;
  onAddItem: (definition: InventoryItemDefinition, startUnit: number) => boolean;
  onUpdateItem: (itemId: string, updates: Partial<RackUnitItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddConnection: (fromItemId: string, toItemId: string) => void;
  onRemoveConnection: (connectionId: string) => void;
}

export function FocusedRackLayout({
  rack,
  items,
  inventoryDefinitions,
  addFormUnit,
  isAddFormOpen,
  connections,
  onBack,
  onOpenAddForm,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onAddConnection,
  onRemoveConnection,
}: FocusedRackLayoutProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const metrics = useMemo(
    () => getRackMetrics(items, inventoryDefinitions, rack.totalUnits),
    [items, inventoryDefinitions, rack.totalUnits],
  );

  const validateDefinition = (definition: InventoryItemDefinition, startUnit: number) =>
    canPlaceItem(items, startUnit, definition.unitSize, rack.totalUnits);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col xl:flex-row flex-1 gap-8 items-start">
        <div className="w-full xl:w-auto shrink-0 transition-all">
          <Rack2DDiagram
            rackName={rack.name}
            items={items}
            totalUnits={rack.totalUnits}
            selectedItemId={selectedItemId}
            addTargetUnit={isAddFormOpen ? (addFormUnit ?? metrics.nextAvailableUnit) : null}
            connections={connections}
            onOpenAddPanel={(unit) => {
              setSelectedItemId(null);
              onOpenAddForm(unit);
            }}
            onSelectItem={(itemId) => {
              setSelectedItemId(itemId);
            }}
            onUpdateItem={(itemId, updates) => {
              onUpdateItem(itemId, updates);
            }}
            onDeleteItem={(itemId) => {
              setSelectedItemId(null);
              onDeleteItem(itemId);
            }}
            onAddConnection={onAddConnection}
            onRemoveConnection={onRemoveConnection}
          />
        </div>

        <div className="flex flex-1 min-w-0 flex-col gap-8 transition-all">
          <RackDetailsPanel
            rack={rack}
            onBack={onBack}
            totalItems={metrics.itemCount}
            usedPowerW={metrics.usedPowerW}
          />

          <RackUtilityControlsCard
            definitions={inventoryDefinitions}
            targetUnit={addFormUnit ?? metrics.nextAvailableUnit}
            isAddFormOpen={isAddFormOpen}
            isRackFull={metrics.nextAvailableUnit === null}
            validateDefinition={validateDefinition}
            onTargetUnitChange={onOpenAddForm}
            onAdd={onAddItem}
            items={items}
            totalUnits={rack.totalUnits}
          />
        </div>
      </div>
    </div>
  );
}

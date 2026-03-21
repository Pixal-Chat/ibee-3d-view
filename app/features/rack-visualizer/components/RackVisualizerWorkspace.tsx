import { useEffect, useMemo, useState } from "react";

import { CageControlsForm } from "~/features/rack-visualizer/components/CageControlsForm";
import { CageScene } from "~/features/rack-visualizer/components/CageScene";
import { FocusedRackLayout } from "~/features/rack-visualizer/components/FocusedRackLayout";
import { ResetCameraButton } from "~/features/rack-visualizer/components/ResetCameraButton";
import { useRackLayout } from "~/features/rack-visualizer/hooks/useRackLayout";
import { useRackVisualizerStore } from "~/features/rack-visualizer/state/rack-visualizer-store";
import type { CageLayout, InventoryItemDefinition, Rack } from "~/features/rack-visualizer/types/domain";
import { canPlaceItem } from "~/features/rack-visualizer/utils/slot-planning";

interface RackVisualizerWorkspaceProps {
  cageLayout: CageLayout;
  racks: Rack[];
  inventoryDefinitions: InventoryItemDefinition[];
}

export function RackVisualizerWorkspace({
  cageLayout,
  racks,
  inventoryDefinitions,
}: RackVisualizerWorkspaceProps) {
  const [overviewCameraPreset, setOverviewCameraPreset] = useState<"home" | "top">("home");
  const {
    selectedRackId,
    sceneViewMode,
    cameraResetVersion,
    currentlyOpenAddFormRackId,
    currentlyOpenAddFormUnit,
    cageDimensions,
    rackNames,
    rackUnitPlacements,
    rackConnections,
    setCageDimensions,
    selectRack,
    triggerCameraReset,
    openAddForm,
    addRackItem,
    updateRackItem,
    removeRackItem,
    addConnection,
    removeConnection,
    hydrateInitialData,
  } = useRackVisualizerStore();

  useEffect(() => {
    hydrateInitialData(cageLayout, racks);
  }, [cageLayout, hydrateInitialData, racks]);

  const derivedLayout = useRackLayout({
    baseLayout: { id: cageLayout.id, name: cageLayout.name },
    dimensions: cageDimensions,
  });

  useEffect(() => {
    if (
      selectedRackId &&
      !derivedLayout.cageLayout.racks.some((rack) => rack.rackId === selectedRackId)
    ) {
      selectRack(null);
    }
  }, [derivedLayout.cageLayout.racks, selectRack, selectedRackId]);

  const selectedRack = useMemo(() => {
    return derivedLayout.cageLayout.racks
      .map((placement) => ({
        id: placement.rackId,
        name: rackNames[placement.rackId] ?? placement.rackName,
        totalUnits: 42 as const,
        row: placement.row,
        column: placement.column,
        items: rackUnitPlacements[placement.rackId] ?? [],
      }))
      .find((rack) => rack.id === selectedRackId) ?? null;
  }, [derivedLayout.cageLayout.racks, rackNames, rackUnitPlacements, selectedRackId]);
  const selectedRackItems = selectedRack ? rackUnitPlacements[selectedRack.id] ?? selectedRack.items : [];

  const isFocused = sceneViewMode === "focused" && selectedRack !== null;
  const validationMessage = derivedLayout.validation.messages[0] ?? null;

  return (
    <div className="box-border w-full px-4 py-4 sm:px-5 lg:px-6 pb-12">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-5">
        {isFocused ? (
          <FocusedRackLayout
            rack={selectedRack}
            items={selectedRackItems}
            inventoryDefinitions={inventoryDefinitions}
            addFormUnit={currentlyOpenAddFormUnit}
            isAddFormOpen={currentlyOpenAddFormRackId === selectedRackId}
            onBack={triggerCameraReset}
            onOpenAddForm={(unit) => {
              if (selectedRackId) {
                openAddForm(selectedRackId, unit);
              }
            }}
            onAddItem={(definition, startUnit) => {
              if (!selectedRackId || !selectedRack) {
                return false;
              }

              const currentItems = rackUnitPlacements[selectedRackId] ?? [];
              const isValidPlacement = canPlaceItem(
                currentItems,
                startUnit,
                definition.unitSize,
                selectedRack.totalUnits,
              );

              if (!isValidPlacement) {
                return false;
              }

              addRackItem(selectedRackId, startUnit, definition);
              return true;
            }}
            onUpdateItem={(itemId, updates) => {
              if (selectedRackId) {
                updateRackItem(selectedRackId, itemId, updates);
              }
            }}
            onDeleteItem={(itemId) => {
              if (selectedRackId) {
                removeRackItem(selectedRackId, itemId);
              }
            }}
            connections={selectedRackId ? (rackConnections[selectedRackId] ?? []) : []}
            onAddConnection={(fromItemId, toItemId) => {
              if (selectedRackId) addConnection(selectedRackId, fromItemId, toItemId);
            }}
            onRemoveConnection={(connectionId) => {
              if (selectedRackId) removeConnection(selectedRackId, connectionId);
            }}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_420px]">
            <div className="rounded-3xl border border-outline bg-white p-4 shadow-panel">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Cage Scene</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">3D layout overview</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Click any rack to move into the focused rack workspace.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ResetCameraButton
                    icon="top"
                    label="Top"
                    onClick={() => {
                      setOverviewCameraPreset("top");
                    }}
                  />
                  <ResetCameraButton
                    onClick={() => {
                      setOverviewCameraPreset("home");
                      triggerCameraReset();
                    }}
                  />
                </div>
              </div>

              <div className="h-[560px] overflow-hidden rounded-2xl border border-outline bg-white">
                <CageScene
                  cageLayout={derivedLayout.cageLayout}
                  selectedRackId={selectedRackId}
                  sceneViewMode={sceneViewMode}
                  overviewCameraPreset={overviewCameraPreset}
                  resetVersion={cameraResetVersion}
                  canAddToSelectedRack={false}
                  onOpenRackAddForm={() => undefined}
                  onSelectRack={selectRack}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid gap-3 rounded-[24px] border border-outline bg-white p-4 shadow-panel">
                <Metric label="Cage footprint" value={`${cageDimensions.cageLength}m × ${cageDimensions.cageWidth}m`} />
                <Metric label="Rows / racks" value={`${cageDimensions.numberOfRows} / ${cageDimensions.racksPerRow}`} />
                <Metric label="Inventory catalog" value={`${inventoryDefinitions.length} unit types`} />
              </div>

              <div className="rounded-[24px] border border-outline bg-white p-4 shadow-panel">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Cage Controls</p>
                <CageControlsForm
                  values={cageDimensions}
                  warning={validationMessage}
                  onChange={(field, value) => {
                    const numericValue =
                      field === "numberOfRows" || field === "racksPerRow"
                        ? Math.max(1, Math.round(Number.isFinite(value) ? value : 1))
                        : Math.max(0, Number.isFinite(value) ? value : 0);

                    setCageDimensions({ [field]: numericValue });
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

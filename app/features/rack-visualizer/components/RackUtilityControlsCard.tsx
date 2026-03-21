import { useEffect, useMemo, useState } from "react";

import type {
  InventoryCategory,
  InventoryItemDefinition,
  RackUnitItem,
} from "~/features/rack-visualizer/types/domain";
import { formatEquipmentType } from "~/features/rack-visualizer/utils/formatting";

interface RackUtilityControlsCardProps {
  definitions: InventoryItemDefinition[];
  targetUnit: number | null;
  isAddFormOpen: boolean;
  isRackFull: boolean;
  validateDefinition: (definition: InventoryItemDefinition, startUnit: number) => boolean;
  onTargetUnitChange: (unit: number) => void;
  onAdd: (definition: InventoryItemDefinition, startUnit: number) => void;
  items: RackUnitItem[];
  totalUnits: number;
}

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  servers: "Servers",
  switches: "Switches",
  storage: "Storage",
  placeholder: "Placeholder",
};

const CATEGORY_ORDER: InventoryCategory[] = ["servers", "switches", "storage", "placeholder"];

export function RackUtilityControlsCard({
  definitions,
  targetUnit,
  isAddFormOpen,
  isRackFull,
  validateDefinition,
  onTargetUnitChange,
  onAdd,
  items,
  totalUnits,
}: RackUtilityControlsCardProps) {
  const groupedDefinitions = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        label: CATEGORY_LABELS[category],
        items: definitions.filter((definition) => definition.category === category),
      })),
    [definitions],
  );

  const usedUnits = useMemo(() => {
    const used = new Set<number>();
    for (const item of items) {
      for (let i = 0; i < item.sizeU; i++) {
        used.add(item.startUnit + i);
      }
    }
    return used;
  }, [items]);

  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory>(groupedDefinitions[0]?.category ?? "servers");
  const [selectedDefinitionId, setSelectedDefinitionId] = useState<string>(groupedDefinitions[0]?.items[0]?.id ?? "");

  useEffect(() => {
    const nextGroup =
      groupedDefinitions.find((group) => group.category === selectedCategory && group.items.length > 0) ??
      groupedDefinitions.find((group) => group.items.length > 0);

    if (!nextGroup) {
      setSelectedDefinitionId("");
      return;
    }

    if (!nextGroup.items.some((item) => item.id === selectedDefinitionId)) {
      setSelectedDefinitionId(nextGroup.items[0]?.id ?? "");
    }
  }, [groupedDefinitions, selectedCategory, selectedDefinitionId]);

  const availableDefinitions = groupedDefinitions.find((group) => group.category === selectedCategory)?.items ?? [];
  const selectedDefinition = availableDefinitions.find((definition) => definition.id === selectedDefinitionId) ?? null;
  const canSubmit =
    isAddFormOpen &&
    !isRackFull &&
    targetUnit !== null &&
    selectedDefinition !== null &&
    validateDefinition(selectedDefinition, targetUnit);

  const clampedTargetUnit = targetUnit ?? 1;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-outline bg-white px-4 py-4 pr-5 shadow-panel">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Utility Controls</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-950">Add Utility</h2>

      {isRackFull ? <p className="mt-3 text-base font-medium text-slate-600">Rack full</p> : null}

      {!isAddFormOpen && !isRackFull ? (
        <div className="mt-3 rounded-[18px] bg-slate-50 px-4 py-4">
          <p className="text-base font-semibold text-slate-900">Use the + in the rack diagram to start adding a utility.</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            The add form will open here once a rack slot is selected.
          </p>
        </div>
      ) : null}

      {isAddFormOpen && !isRackFull ? (
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
          <div className="rounded-[16px] bg-slate-50 px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Utility placer</p>
            <div className="mt-3 relative flex items-center justify-center rounded-[14px] bg-white border border-slate-200 py-3 shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary cursor-pointer h-[68px]">
              
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Target unit</p>
                  <p className="text-[20px] font-bold text-slate-900 leading-tight mt-0.5">
                    {clampedTargetUnit}
                  </p>
                </div>
              </div>

              <div className="absolute right-4 text-slate-400 pointer-events-none">
                <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                  <path d="M5.833 7.5L10 11.667L14.167 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <select
                value={clampedTargetUnit}
                onChange={(e) => onTargetUnitChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {Array.from({ length: totalUnits }, (_, i) => {
                  const unit = totalUnits - i;
                  const isUsed = usedUnits.has(unit);
                  return (
                    <option key={unit} value={unit} disabled={isUsed}>
                      {unit} {isUsed ? "(Used)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Category
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as InventoryCategory)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-orange-200"
            >
              {groupedDefinitions.map((group) => (
                <option key={group.category} value={group.category}>
                  {group.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Unit Type
            <select
              value={selectedDefinitionId}
              onChange={(event) => setSelectedDefinitionId(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-base font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-orange-200"
            >
              {availableDefinitions.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {formatEquipmentType(definition.label)}
                </option>
              ))}
            </select>
          </label>

          {selectedDefinition ? (
            <div className="rounded-[16px] bg-slate-50 px-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <UtilityMeta label="Size" value={`${selectedDefinition.unitSize}U`} />
                <UtilityMeta label="Power" value={`${selectedDefinition.powerW}W`} />
              </div>
            </div>
          ) : null}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (selectedDefinition && targetUnit !== null) {
                onAdd(selectedDefinition, targetUnit);
              }
            }}
            className="mt-auto inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Add Utility
          </button>
        </div>
      ) : null}
    </section>
  );
}

function UtilityMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}


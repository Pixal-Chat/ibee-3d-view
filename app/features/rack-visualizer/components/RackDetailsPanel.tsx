import type { Rack } from "~/features/rack-visualizer/types/domain";
import { BackToCageButton } from "~/features/rack-visualizer/components/BackToCageButton";

interface RackDetailsPanelProps {
  rack: Rack;
  totalItems: number;
  usedPowerW: number;
  onBack: () => void;
}

export function RackDetailsPanel({ rack, totalItems, usedPowerW, onBack }: RackDetailsPanelProps) {
  const rackNumber = rack.id.replace("rack-", "");

  return (
    <section className="shrink-0 rounded-[24px] border border-outline bg-white p-6 shadow-panel flex flex-col gap-5 transition-all">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-primary">Rack Details</p>
        <BackToCageButton onClick={onBack} />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-slate-900 truncate" title={rack.name}>{rack.name}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-1">
        <MetaBadge label="Rack No." value={rackNumber} />
        <MetaBadge label="Size" value={`${rack.totalUnits}U`} />
        <MetaBadge label="Total Items" value={totalItems.toString()} />
        <MetaBadge label="Power Use" value={`${usedPowerW}W`} />
      </div>
    </section>
  );
}

function MetaBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3.5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

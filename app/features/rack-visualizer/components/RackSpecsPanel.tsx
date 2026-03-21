interface RackSpecsPanelProps {
  totalCapacityW: number;
  usedPowerW: number;
  availablePowerW: number;
  totalItems: number;
  nextAvailableUnit: number | null;
  serversCount: number;
  switchesCount: number;
  storageCount: number;
}

export function RackSpecsPanel({
  totalCapacityW,
  usedPowerW,
  availablePowerW,
  totalItems,
  nextAvailableUnit,
  serversCount,
  switchesCount,
  storageCount,
}: RackSpecsPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-outline bg-white p-4 shadow-panel">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Rack Specs</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">Power and capacity</h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">Dummy values for now, ready to swap with live inventory power data.</p>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-2">
        <SpecStat label="Total rack power capacity" value={`${totalCapacityW}W`} />
        <SpecStat label="Used power consumption" value={`${usedPowerW}W`} />
        <SpecStat label="Available power consumption" value={`${availablePowerW}W`} />
        <SpecStat label="Total items installed" value={`${totalItems}`} />
        <SpecStat label="Next available unit" value={nextAvailableUnit ? `U${nextAvailableUnit}` : "Rack full"} />
      </div>

      <div className="mt-3 rounded-[18px] bg-slate-50 p-3.5">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Installed by category</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          <MiniStat label="Servers" value={serversCount} />
          <MiniStat label="Switches" value={switchesCount} />
          <MiniStat label="Storage" value={storageCount} />
        </div>
      </div>
    </section>
  );
}

function SpecStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-slate-50 px-3.5 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[14px] bg-white px-3 py-2.5 text-center shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

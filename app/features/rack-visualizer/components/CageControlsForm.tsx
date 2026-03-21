import type { CageDimensions } from "~/features/rack-visualizer/types/domain";

interface CageControlsFormProps {
  values: CageDimensions;
  warning: string | null;
  onChange: (field: keyof CageDimensions, value: number) => void;
}

const FIELD_CONFIG: Array<{
  key: keyof CageDimensions;
  label: string;
  min: number;
  max: number;
  step?: number;
}> = [
  { key: "cageLength", label: "Cage length", min: 3, max: 80, step: 0.1 },
  { key: "cageWidth", label: "Cage width", min: 3, max: 60, step: 0.1 },
  { key: "cagePadding", label: "Edge padding", min: 0, max: 10, step: 0.1 },
  { key: "numberOfRows", label: "Rows", min: 1, max: 20, step: 1 },
  { key: "racksPerRow", label: "Racks per row", min: 1, max: 40, step: 1 },
];

export function CageControlsForm({ values, warning, onChange }: CageControlsFormProps) {
  return (
    <div className="rounded-2xl border border-outline bg-white p-4 shadow-panel">
      <div className="grid grid-cols-2 gap-3">
        {FIELD_CONFIG.map((field) => (
          <label
            key={field.key}
            className={`space-y-2 ${field.key === "racksPerRow" ? "col-span-2" : ""}`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {field.label}
            </span>
            <input
              type="number"
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              value={values[field.key]}
              onChange={(event) => onChange(field.key, Number(event.target.value))}
              className="h-12 w-full rounded-xl border border-outline bg-white px-4 text-base font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-orange-200"
            />
          </label>
        ))}
      </div>

      {warning ? (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-slate-700">
          {warning}
        </div>
      ) : null}
    </div>
  );
}

import clsx from "clsx";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedModeToggleProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
}

export function SegmentedModeToggle<T extends string>({
  value,
  options,
  onChange,
}: SegmentedModeToggleProps<T>) {
  return (
    <div className="inline-flex rounded-xl border border-outline bg-white p-1 shadow-sm">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={clsx(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              isActive ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

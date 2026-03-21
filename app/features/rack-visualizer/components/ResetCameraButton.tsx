interface CameraPresetButtonProps {
  onClick: () => void;
  label?: string;
  icon?: "home" | "top";
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3.333 8.542L10 3.333l6.667 5.209V15a1.667 1.667 0 01-1.667 1.667h-2.5v-5h-5v5H5A1.667 1.667 0 013.333 15V8.542z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TopIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M10 3.333l5 5H11.667V16.667H8.333V8.333H5l5-5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ResetCameraButton({
  onClick,
  label = "Home",
  icon = "home",
}: CameraPresetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-outline bg-white/95 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 shadow-sm backdrop-blur transition hover:border-primary hover:text-primary"
    >
      {icon === "top" ? <TopIcon /> : <HomeIcon />}
      {label}
    </button>
  );
}

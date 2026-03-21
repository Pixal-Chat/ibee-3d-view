interface BackToCageButtonProps {
  onClick: () => void;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M12.5 4.167L6.667 10l5.833 5.833M7.5 10h8.333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackToCageButton({ onClick }: BackToCageButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2.5 rounded-full border-2 border-primary bg-white px-5 py-2.5 text-sm font-bold tracking-[0.2em] text-primary transition hover:bg-orange-50 active:bg-orange-100"
    >
      <BackIcon />
      BACK
    </button>
  );
}

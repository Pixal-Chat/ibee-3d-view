import type { ButtonHTMLAttributes, ReactNode } from "react";

import clsx from "clsx";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
}

export function IconButton({ icon, label, className, type = "button", ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-outline bg-white text-slate-600 transition hover:border-outline-dark hover:text-slate-900",
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}

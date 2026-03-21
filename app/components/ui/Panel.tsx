import type { HTMLAttributes, ReactNode } from "react";

import clsx from "clsx";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, description, actions, children, className, ...props }: PanelProps) {
  return (
    <section
      className={clsx("rounded-2xl border border-outline bg-panel p-5 shadow-panel", className)}
      {...props}
    >
      {title || description || actions ? (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            {title ? <h2 className="text-base font-semibold text-slate-950">{title}</h2> : null}
            {description ? <p className="text-sm text-slate-600">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

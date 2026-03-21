import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-outline pb-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1.5">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-primary">{eyebrow}</p>
        ) : null}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
          {description ? <p className="max-w-3xl text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}

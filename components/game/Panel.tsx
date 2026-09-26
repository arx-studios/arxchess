import type { ReactNode } from "react";

/** Header of the side panel: mode title and an optional one-line status. */
export function PanelHeader({ title, status, actions }: { title: string; status?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <h1 className="text-title font-bold">{title}</h1>
        {status && <div className="mt-0.5 text-caption text-fg-secondary">{status}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}

/** A padded block within the panel (settings, controls). */
export function PanelSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex flex-col gap-4 px-4 py-4 ${className}`}>{children}</div>;
}

/** The panel's footer: icon controls on the left, primary action filling the rest. */
export function PanelFooter({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-col gap-3 border-t border-line px-4 py-4">{children}</div>;
}

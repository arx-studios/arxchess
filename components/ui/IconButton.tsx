import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

export function IconButton({
  icon: Icon,
  label,
  active = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-raised text-fg" : "text-fg-secondary hover:bg-hover hover:text-fg"
      } ${className}`}
      {...props}
    >
      <Icon size={20} strokeWidth={1.75} />
    </button>
  );
}

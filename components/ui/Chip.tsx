"use client";

type Option<T extends string | number> = { value: T; label: string; hint?: string };

/** A row of single-choice chips (time controls, difficulty, speed...). */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled = false,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      {label && <p className="mb-2 text-label font-semibold text-fg-secondary">{label}</p>}
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              title={o.hint}
              onClick={() => onChange(o.value)}
              className={`h-8 rounded-md px-3 text-label font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                selected
                  ? "bg-raised text-fg outline-2 -outline-offset-2 outline-accent-fg"
                  : "bg-raised/50 text-fg-secondary hover:bg-hover hover:text-fg"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

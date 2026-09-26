import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "lg" | "md";

const VARIANTS: Record<Variant, string> = {
  // chess.com-style raised button: a solid 4px edge that it presses into.
  primary:
    "bg-accent text-on-accent shadow-raised hover:bg-accent-hover active:translate-y-1 active:shadow-none disabled:translate-y-0 disabled:shadow-raised",
  secondary: "bg-raised text-fg hover:bg-hover",
  ghost: "text-fg-secondary hover:bg-hover hover:text-fg",
};

const SIZES: Record<Size, string> = {
  lg: "h-12 px-5 text-body font-bold",
  md: "h-10 px-4 text-label",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-[background-color,transform,box-shadow] duration-100 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}

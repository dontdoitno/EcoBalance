import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pill px-4 text-sm font-medium transition-colors duration-150 ease-out-exp active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0",
        variant === "primary" && "bg-accent text-accent-on hover:brightness-110",
        variant === "secondary" &&
          "border border-border-strong bg-bg-raised text-text hover:bg-bg-sunken",
        variant === "ghost" && "text-text-secondary hover:bg-bg-sunken hover:text-text",
        className,
      )}
      {...props}
    />
  );
}

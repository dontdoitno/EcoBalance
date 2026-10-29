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
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out-exp disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-accent text-accent-on hover:bg-accent-strong shadow-sm",
        variant === "secondary" &&
          "border border-border-strong bg-bg-raised text-text hover:bg-bg-sunken",
        variant === "ghost" && "text-text-secondary hover:bg-bg-sunken hover:text-text",
        className,
      )}
      {...props}
    />
  );
}

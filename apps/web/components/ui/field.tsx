import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const fieldBaseClass =
  "w-full rounded-md border border-border-strong bg-bg-raised px-3 py-2 text-sm text-text outline-none transition-colors duration-150 placeholder:text-text-faint focus:border-accent disabled:cursor-not-allowed disabled:opacity-60";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-text">
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldBaseClass, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(fieldBaseClass, className)} {...props}>
      {children}
    </select>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-status-critical-fg">{children}</p>;
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-sm text-text-faint">{children}</p>;
}

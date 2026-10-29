import { clsx } from "clsx";

/** A skeleton in the shape of what's coming — not a spinner (interaction-and-states.md). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded bg-bg-sunken motion-reduce:animate-none",
        className,
      )}
      aria-hidden="true"
    />
  );
}

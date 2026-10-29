import { clsx } from "clsx";
import { dict } from "@/lib/dictionaries/ru";

type Rating = "critical" | "significant" | "low";

const LABELS: Record<Rating, string> = {
  critical: dict.results.ratingCritical,
  significant: dict.results.ratingSignificant,
  low: dict.results.ratingLow,
};

/** Rating is conveyed by icon + label, not color alone (WCAG non-color-cue). */
export function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1 text-xs font-medium",
        rating === "critical" && "bg-status-critical-bg text-status-critical-fg",
        rating === "significant" && "bg-status-significant-bg text-status-significant-fg",
        rating === "low" && "bg-status-low-bg text-status-low-fg",
      )}
    >
      <RatingIcon rating={rating} />
      {LABELS[rating]}
    </span>
  );
}

function RatingIcon({ rating }: { rating: Rating }) {
  if (rating === "critical") {
    return (
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M6 1 11 10H1z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M6 4.5v2.3M6 8.3h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (rating === "significant") {
    return (
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 3.8v2.6M6 8.1h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6.2 4.8 8.5 9.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

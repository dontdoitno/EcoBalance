"use client";

import { useEffect, useRef, useState } from "react";

const numberFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

/**
 * Counts from the previous value (or 0 on first mount) to a real figure over
 * 400-600ms. Announces only the final value; respects prefers-reduced-motion
 * by jumping straight to it. Never fabricates a number — it only animates
 * between two real values the caller already has.
 */
export function NumberTicker({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const from = previous.current;
    const to = value;
    previous.current = value;

    if (reduceMotion.current || from === to) {
      setDisplay(to);
      return;
    }

    const duration = 500;
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={className} aria-live="polite">
      {numberFormatter.format(display)}
    </span>
  );
}

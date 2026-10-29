"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";

/**
 * "How much you lose without primary data" — PROMPT_CLAUDE_CODE.md §11
 * Stage 5. Both inputs are explicit, user-editable parameters with a
 * disclaimer; nothing here is a fixed market recommendation.
 */
export function MiniCalculator() {
  const [embeddedTonnes, setEmbeddedTonnes] = useState(2.5);
  const [etsPrice, setEtsPrice] = useState(80);
  const [defaultMarkupPct, setDefaultMarkupPct] = useState(50);

  const actualCost = embeddedTonnes * etsPrice;
  const defaultCost = embeddedTonnes * (1 + defaultMarkupPct / 100) * etsPrice;
  const overpayment = defaultCost - actualCost;

  return (
    <div className="grid gap-8 rounded-card border border-border bg-bg-raised p-8 lg:grid-cols-[1fr_1fr] lg:divide-x lg:divide-border">
      <div className="space-y-5">
        <Slider
          label="Встроенные выбросы (факт), т CO₂-экв./т продукции"
          value={embeddedTonnes}
          min={0.1}
          max={6}
          step={0.1}
          onChange={setEmbeddedTonnes}
        />
        <Slider
          label="Цена квоты EU ETS, €/т CO₂"
          value={etsPrice}
          min={20}
          max={150}
          step={1}
          onChange={setEtsPrice}
        />
        <Slider
          label="Наценка default-значения над фактом, %"
          value={defaultMarkupPct}
          min={0}
          max={150}
          step={5}
          onChange={setDefaultMarkupPct}
        />
        <p className="text-xs text-text-faint">
          Параметры настраиваются; точная наценка default-значений и рыночная цена ETS изменяются во
          времени, это иллюстрация механизма, не прогноз.
        </p>
      </div>
      <div className="flex flex-col justify-center gap-4 lg:pl-8">
        <Row label="По факту (первичные данные)" value={`${formatNumber(actualCost)} €/т`} />
        <Row label="По default-значению" value={`${formatNumber(defaultCost)} €/т`} />
        <div className="h-px bg-border" />
        <Row
          label="Переплата без первичных данных"
          value={`${formatNumber(overpayment)} €/т`}
          emphasis
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium tabular-nums text-text">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={
          emphasis
            ? "font-mono text-2xl tabular-nums text-accent"
            : "font-mono text-lg tabular-nums text-text"
        }
      >
        {value}
      </span>
    </div>
  );
}

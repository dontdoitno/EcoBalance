import { clsx } from "clsx";

type Box = "upstream" | "scope1" | "scope2" | "downstream";

/**
 * Authored diagram of where Scope 1/2/3 happen relative to the production
 * site — oriented reading for someone filling the wizard for the first
 * time, not decoration. Real methodology content (docs/methodology/scopes.md),
 * drawn once, no animation. `highlight` ties the current wizard step back to
 * the part of the model its data feeds (a step can touch more than one box
 * — raw material is Scope 3 upstream, electricity is Scope 2, both land in
 * the same "Сырьё и энергия" step).
 */
export function ScopeDiagram({ highlight = [] }: { highlight?: Box[] }) {
  const isOn = (box: Box) => highlight.length === 0 || highlight.includes(box);
  const dim = (box: Box) => (isOn(box) ? "opacity-100" : "opacity-40");
  const fill = (box: Box, token: string) => (highlight.includes(box) ? `var(${token})` : "none");
  const weight = (box: Box) => (highlight.includes(box) ? 1.5 : 1);

  return (
    <svg
      viewBox="0 0 600 172"
      className="w-full"
      role="img"
      aria-label="Схема: сырьё и транспорт — Scope 3 за пределами площадки, энергия — Scope 2, технологические выбросы на площадке — Scope 1"
    >
      {/* Upstream (Scope 3) */}
      <g className={clsx("transition-opacity duration-150", dim("upstream"))}>
        <rect
          x="8"
          y="36"
          width="140"
          height="96"
          rx="8"
          fill={fill("upstream", "--color-cool-soft")}
          stroke="var(--color-cool)"
          strokeWidth={weight("upstream")}
        />
        <text x="78" y="60" textAnchor="middle" className="fill-cool text-[11px] font-medium">
          Scope 3
        </text>
        <text x="78" y="80" textAnchor="middle" className="fill-text-secondary text-[12px]">
          Сырьё,
        </text>
        <text x="78" y="96" textAnchor="middle" className="fill-text-secondary text-[12px]">
          добыча и
        </text>
        <text x="78" y="112" textAnchor="middle" className="fill-text-secondary text-[12px]">
          производство
        </text>
      </g>

      <path d="M148 84 H172" stroke="var(--color-rule-2)" strokeWidth="1" markerEnd="url(#arrow)" />

      {/* Site boundary (Scope 1 + 2) */}
      <g>
        <rect
          x="176"
          y="12"
          width="248"
          height="144"
          rx="8"
          fill="none"
          stroke="var(--color-border-strong)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <text x="300" y="30" textAnchor="middle" className="fill-text-faint text-[11px]">
          Производственная площадка
        </text>

        <g className={clsx("transition-opacity duration-150", dim("scope1"))}>
          <rect
            x="192"
            y="44"
            width="104"
            height="100"
            rx="8"
            fill={fill("scope1", "--color-accent-soft")}
            stroke="var(--color-accent)"
            strokeWidth={weight("scope1")}
          />
          <text x="244" y="68" textAnchor="middle" className="fill-accent text-[11px] font-medium">
            Scope 1
          </text>
          <text x="244" y="88" textAnchor="middle" className="fill-text-secondary text-[12px]">
            Топливо,
          </text>
          <text x="244" y="104" textAnchor="middle" className="fill-text-secondary text-[12px]">
            процесс
          </text>
        </g>

        <g className={clsx("transition-opacity duration-150", dim("scope2"))}>
          <rect
            x="304"
            y="44"
            width="104"
            height="100"
            rx="8"
            fill={fill("scope2", "--color-cool-soft")}
            stroke="var(--color-cool)"
            strokeWidth={weight("scope2")}
          />
          <text x="356" y="68" textAnchor="middle" className="fill-cool text-[11px] font-medium">
            Scope 2
          </text>
          <text x="356" y="88" textAnchor="middle" className="fill-text-secondary text-[12px]">
            Электро-
          </text>
          <text x="356" y="104" textAnchor="middle" className="fill-text-secondary text-[12px]">
            энергия
          </text>
        </g>
      </g>

      <path d="M424 84 H448" stroke="var(--color-rule-2)" strokeWidth="1" markerEnd="url(#arrow)" />

      {/* Downstream transport (Scope 3) */}
      <g className={clsx("transition-opacity duration-150", dim("downstream"))}>
        <rect
          x="452"
          y="36"
          width="140"
          height="96"
          rx="8"
          fill={fill("downstream", "--color-cool-soft")}
          stroke="var(--color-cool)"
          strokeWidth={weight("downstream")}
        />
        <text x="522" y="60" textAnchor="middle" className="fill-cool text-[11px] font-medium">
          Scope 3
        </text>
        <text x="522" y="80" textAnchor="middle" className="fill-text-secondary text-[12px]">
          Транспорт,
        </text>
        <text x="522" y="96" textAnchor="middle" className="fill-text-secondary text-[12px]">
          отходы
        </text>
      </g>

      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill="var(--color-rule-2)" />
        </marker>
      </defs>
    </svg>
  );
}

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS. This is the `apps/web` workspace of a monorepo rebuild; the project's prior iteration (repo root) was Vite + React 18 + React Router + Recharts + jsPDF/html2canvas.

## Users

Any employee or founder at a chemical-industry SME — not necessarily a dedicated sustainability/ESG specialist. The product is built for a generalist (operations lead, founder, etc.) with no formal carbon-accounting background to run a calculation themselves.

## Product Purpose

EcoBalance (Платформа для расчёта и снижения углеродного следа химических продуктов) lets chemical-industry companies calculate and reduce the carbon footprint of their products. Success means a user can go from raw operational inputs (product, raw materials, electricity, transport) to a clear emissions figure, a comparison against a benchmark, concrete reduction recommendations, and an exportable report — without specialist knowledge.

## Positioning

A calculator purpose-built for the chemical industry, following Scope 1–3 accounting conventions, that goes beyond a number: it benchmarks the result, maps out where emissions are concentrated (weakness map), and turns that into actionable, selectable recommendations with a recalculated "what-if" footprint — then packages it into a shareable PDF report.

## Operating Context

Core workflow (established in the legacy app, being rebuilt in `apps/web`):
- **Auth & company profile**: register/login; company profile carries a region used to default electricity-emission inputs.
- **Data input** (multi-step form): product type, raw material + amount, electricity usage + region, transport type + distance/weight. State persists to `localStorage` between steps.
- **Results**: computed carbon footprint, a breakdown chart, a benchmark comparison, a weakness map, and generated recommendations; users can select recommendations to see a recalculated footprint.
- **Report**: a status summary (color/emoji-coded vs. benchmark) with a narrative explanation, exportable as a PDF (via html2canvas + jsPDF).
- **Profile**: company/account management.

`apps/web` Stage 0 is a fresh scaffold (landing page placeholder only); the Next.js rebuild is intended as a full replacement of the legacy app's functionality (landing, auth, calculator, results/benchmark, report, profile), not a partial port.

## Capabilities and Constraints

- Calculation is standards-aligned in concept (Scope 1–3) but the underlying emission factors and reference data (products, raw materials, regions, transport types in the legacy `utils/data.js`) are illustrative/placeholder, not verified against a real standard or database. Future work must not present these figures as authoritative or invent sourcing for them until real data is supplied.
- Legacy app used `localStorage` for calculation state (no backend persistence observed); the new `apps/web` backend/persistence approach is undecided.
- Primary language/locale observed in existing UI copy: Russian.

## Evidence on Hand

- Working legacy implementation at the repo root (Vite/React) covering the full user flow: `src/pages/{Landing,Login,Register,DataInput,Results,Report,Profile}.jsx`, `src/contexts/AuthContext.jsx`, `src/utils/data.js`.
- A product screenshot referenced in the repo root README (`/img/1.png`).
- No real/verified emission-factor data on hand (see Capabilities and Constraints) — do not fabricate sourcing or precision for these figures.

## Product Principles

- Accessible to non-specialists: a founder or ops person with no carbon-accounting background should be able to complete a calculation unaided.
- Chemical-industry specific: inputs, benchmarks, and recommendations should speak to this industry's actual processes (raw materials, electricity, transport), not a generic footprint calculator.
- Actionable over informational: results should lead to a concrete next step (selectable recommendations, a recalculated footprint, a shareable report), not just a number.
- Honest about data maturity: never present placeholder emission factors as verified fact.


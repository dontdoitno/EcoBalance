/**
 * Mirrors ecobalance_core.models.CalculationResult and friends.
 *
 * The backend's calculate/get-calculation endpoints return a plain
 * `dict[str, Any]` (not a Pydantic response_model) so the generated
 * OpenAPI types for them are untyped objects; these hand-written
 * interfaces give the frontend a real shape to work with. Decimal
 * fields serialize to JSON as strings (Pydantic's `mode="json"` dump),
 * so every numeric-looking field below is typed `string` and parsed
 * with `Number(...)` at render time.
 */

export type Scope = "Scope 1" | "Scope 2" | "Scope 3";
export type Rating = "critical" | "significant" | "low";
export type BreakdownCategory = "upstream" | "energy" | "transport" | "waste" | "process";

export interface BreakdownItem {
  category: BreakdownCategory;
  label: string;
  scope: Scope;
  value_kg_co2_per_unit: string;
  percentage: string;
}

export interface HotspotFlag {
  code: string;
  message: string;
  severity: "info" | "warning";
}

export interface Hotspot {
  category: string;
  label: string;
  scope: string;
  contribution_pct: string;
  rating: Rating;
  flags: HotspotFlag[];
}

export interface CalculationResult {
  pcf_full_kg_co2_per_unit: string;
  cbam_embedded_kg_co2_per_unit: string | null;
  cbam_applicable: boolean;
  cbam_not_applicable_reason: string | null;
  scope1_kg_co2_per_unit: string;
  scope2_kg_co2_per_unit: string;
  scope3_kg_co2_per_unit: string;
  breakdown: BreakdownItem[];
  hotspots: Hotspot[];
  allocation_factor: string;
  allocation_credit_kg_co2_per_unit: string;
  data_quality_score: string | null;
  data_quality_flags: HotspotFlag[];
  gwp_set: "AR5" | "AR6";
  boundary: "cradle_to_gate" | "cradle_to_border" | "cradle_to_grave";
  functional_unit: "t" | "kg" | "m3";
}

export interface CalculationDetail {
  id: string;
  name: string;
  status: "draft" | "final";
  version: number;
  created_at: string;
  finalized_at: string | null;
  input: Record<string, unknown>;
  result: CalculationResult | null;
}

export interface PatchResult {
  data: Record<string, unknown>;
  is_valid: boolean;
  errors: Array<{ loc: unknown[]; msg: string; type: string }>;
}

export interface Product {
  id: string;
  name: string;
  cas: string | null;
  cbam_applicable: boolean;
  cn_code: string | null;
  default_routes: string[];
}

export interface Route {
  id: string;
  product_id: string;
  name: string;
}

export interface RawMaterialFactor {
  id: string;
  name: string;
  ef_kg_co2_per_t: string;
  source: string;
  year: number;
  is_demo: boolean;
}

export interface RegionFactor {
  id: string;
  name: string;
  ef_el_kg_co2_per_mwh: string;
  source: string;
  year: number;
  is_demo: boolean;
}

export interface TransportFactor {
  id: string;
  name: string;
  ef_kg_co2_per_tkm: string;
  source: string;
  year: number;
  is_demo: boolean;
}

export interface Measure {
  title: string;
  scope: string;
  complexity: "low" | "medium" | "high";
  complexity_label: string;
  payback: string;
  standards: string[];
  side_effects: { esg?: string[]; economic?: string[]; other?: string[] };
  default_assumptions: Record<string, number | string>;
}

export type MeasureCatalog = Record<string, Measure>;

export interface ScenarioResult {
  id: string;
  calculation_id: string;
  name: string;
  measure_ids: string[];
  baseline: CalculationResult;
  scenario: CalculationResult;
  delta_pcf_full_kg_co2_per_unit: number;
  delta_pcf_full_pct: number;
  delta_cbam_embedded_kg_co2_per_unit: number | null;
}

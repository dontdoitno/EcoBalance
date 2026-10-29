"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RatingBadge } from "@/components/ui/rating-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberTicker } from "@/components/ui/number-ticker";
import { dict } from "@/lib/dictionaries/ru";
import { api } from "@/lib/api-client";
import { formatKgCo2, formatPercent } from "@/lib/format";
import type { CalculationDetail, CalculationResult, MeasureCatalog, ScenarioResult } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ReportType = "pcf" | "cbam" | "scenario";
type ReportFormat = "pdf" | "xlsx" | "json";

const RATING_COLOR: Record<string, string> = {
  critical: "var(--color-status-critical-fg)",
  significant: "var(--color-status-significant-fg)",
  low: "var(--color-status-low-fg)",
};

const BOUNDARY_LABEL: Record<string, string> = {
  cradle_to_gate: "От сырья до ворот завода",
  cradle_to_border: "От сырья до границы CBAM",
  cradle_to_grave: "От сырья до конца жизненного цикла",
};

function ReportHeader({
  title,
  type,
  downloading,
  onDownload,
}: {
  title: string;
  type: ReportType;
  downloading: string | null;
  onDownload: (type: ReportType, format: ReportFormat) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <h2 className="text-lg font-medium text-text">{title}</h2>
      <div className="flex gap-2">
        {(["pdf", "xlsx", "json"] as ReportFormat[]).map((format) => (
          <Button
            key={format}
            variant="secondary"
            disabled={downloading === `${type}-${format}`}
            onClick={() => onDownload(type, format)}
          >
            {format.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ScopeChart({ result }: { result: CalculationResult }) {
  const chartData = result.breakdown.map((item) => ({
    name: item.label,
    value: Number(item.value_kg_co2_per_unit),
    rating: result.hotspots.find((h) => h.category === item.category)?.rating ?? "low",
  }));
  return (
    <div className="mt-6 h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
          <XAxis type="number" stroke="var(--color-text-faint)" tick={{ fill: "var(--color-text-faint)", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--color-text-faint)"
            tick={{ fill: "var(--color-text)", fontSize: 12 }}
            width={120}
          />
          <Tooltip
            formatter={(value: number) => formatKgCo2(value)}
            contentStyle={{
              background: "var(--color-bg-raised)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 13,
              color: "var(--color-text)",
            }}
            labelStyle={{ color: "var(--color-text)" }}
            itemStyle={{ color: "var(--color-text)" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={RATING_COLOR[entry.rating]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HotspotsTable({ result }: { result: CalculationResult }) {
  return (
    <table className="mt-5 w-full text-sm">
      <thead className="text-xs text-text-faint">
        <tr>
          <th className="pb-2 text-left font-medium">Источник</th>
          <th className="pb-2 text-left font-medium">Scope</th>
          <th className="pb-2 text-left font-medium">Вклад</th>
          <th className="pb-2 text-left font-medium">Оценка</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {result.hotspots.map((hotspot) => (
          <tr key={hotspot.category}>
            <td className="py-3 font-medium text-text">{hotspot.label}</td>
            <td className="py-3 text-text-faint">{hotspot.scope}</td>
            <td className="py-3 text-text">{formatPercent(hotspot.contribution_pct)}</td>
            <td className="py-3">
              <RatingBadge rating={hotspot.rating} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MetaRow({ result }: { result: CalculationResult }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-text-faint">{dict.reports.boundary}</dt>
        <dd className="mt-0.5 text-text">{BOUNDARY_LABEL[result.boundary] ?? result.boundary}</dd>
      </div>
      <div>
        <dt className="text-text-faint">{dict.reports.functionalUnit}</dt>
        <dd className="mt-0.5 text-text">{result.functional_unit}</dd>
      </div>
      <div>
        <dt className="text-text-faint">{dict.reports.gwpSet}</dt>
        <dd className="mt-0.5 text-text">{result.gwp_set}</dd>
      </div>
      <div>
        <dt className="text-text-faint">{dict.reports.allocationFactor}</dt>
        <dd className="mt-0.5 text-text">{formatPercent(Number(result.allocation_factor) * 100)}</dd>
      </div>
    </dl>
  );
}

function ReportsContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenario_id");
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: detail, isLoading } = useQuery<CalculationDetail>({
    queryKey: ["calculation", params.id],
    queryFn: async () =>
      (
        await api.GET("/calculations/{calculation_id}", { params: { path: { calculation_id: params.id } } })
      ).data as unknown as CalculationDetail,
  });

  const { data: scenarios } = useQuery<ScenarioResult[]>({
    queryKey: ["scenarios", params.id],
    enabled: Boolean(scenarioId),
    queryFn: async () =>
      (
        await api.GET("/calculations/{calculation_id}/scenarios", {
          params: { path: { calculation_id: params.id } },
        })
      ).data as unknown as ScenarioResult[],
  });

  const { data: catalog } = useQuery<MeasureCatalog>({
    queryKey: ["reference", "measures"],
    enabled: Boolean(scenarioId),
    queryFn: async () => (await api.GET("/reference/measures")).data as unknown as MeasureCatalog,
  });

  const scenario = scenarios?.find((s) => s.id === scenarioId);

  async function download(type: ReportType, format: ReportFormat) {
    const key = `${type}-${format}`;
    setDownloading(key);
    const url = new URL(`${API_BASE_URL}/reports/${params.id}`);
    url.searchParams.set("report_type", type);
    url.searchParams.set("report_format", format);
    if (type === "scenario" && scenarioId) url.searchParams.set("scenario_id", scenarioId);

    try {
      const response = await fetch(url.toString(), { credentials: "include" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        alert(body?.detail ?? "Не удалось сформировать отчёт");
        return;
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `ecobalance-${type}-${params.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(null);
    }
  }

  const result = detail?.result;

  return (
    <AppShell>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-text">{dict.reports.title}</h1>
          {detail && <p className="mt-1 text-text-secondary">{detail.name}</p>}
        </div>
        <Link href={`/calculations/${params.id}`}>
          <Button variant="secondary">{dict.reports.editParameters}</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid max-w-3xl gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : !result ? (
        <Card className="max-w-lg py-10 text-center">
          <p className="text-text-secondary">Расчёт ещё не выполнен.</p>
        </Card>
      ) : (
        <div className="grid max-w-3xl gap-6">
          <Card>
            <ReportHeader title={dict.reports.pcfReport} type="pcf" downloading={downloading} onDownload={download} />
            {result.data_quality_flags.some((f) => f.code === "demo_factors") && (
              <div className="mt-4 rounded-pill border border-status-significant-fg/30 bg-status-significant-bg px-4 py-3 text-sm text-status-significant-fg">
                {dict.common.demoDataBanner}
              </div>
            )}
            <p className="mt-5 font-mono text-4xl tabular-nums text-text">
              <NumberTicker value={Number(result.pcf_full_kg_co2_per_unit)} /> кг CO₂-экв.
            </p>
            <p className="mt-1 text-sm text-text-faint">на {result.functional_unit} продукта</p>
            <MetaRow result={result} />
            <ScopeChart result={result} />
            <HotspotsTable result={result} />
          </Card>

          <Card>
            <ReportHeader title={dict.reports.cbamReport} type="cbam" downloading={downloading} onDownload={download} />
            {result.cbam_applicable && result.cbam_embedded_kg_co2_per_unit ? (
              <>
                <p className="mt-5 font-mono text-4xl tabular-nums text-cool">
                  <NumberTicker value={Number(result.cbam_embedded_kg_co2_per_unit)} /> кг CO₂-экв.
                </p>
                <p className="mt-1 text-sm text-text-faint">{dict.reports.cbamFigureNote}</p>
                <MetaRow result={result} />
              </>
            ) : (
              <div className="mt-5">
                <p className="font-medium text-text">{dict.reports.cbamNotApplicableTitle}</p>
                <p className="mt-1 text-sm text-text-faint">{result.cbam_not_applicable_reason}</p>
              </div>
            )}
          </Card>

          {scenarioId && (
            <Card>
              <ReportHeader title={dict.reports.scenarioReport} type="scenario" downloading={downloading} onDownload={download} />
              {!scenario ? (
                <Skeleton className="mt-5 h-40" />
              ) : (
                <>
                  <div className="mt-5 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">{dict.scenarios.reduction}</span>
                      <span className="text-status-low-fg">
                        −
                        <span className="font-mono tabular-nums">
                          <NumberTicker value={Number(scenario.delta_pcf_full_kg_co2_per_unit)} />
                        </span>{" "}
                        кг CO₂-экв. ({formatPercent(scenario.delta_pcf_full_pct)})
                      </span>
                    </div>
                    {scenario.delta_cbam_embedded_kg_co2_per_unit != null && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">{dict.results.cbamEmbedded}</span>
                        <span className="text-status-low-fg">
                          −
                          <span className="font-mono tabular-nums">
                            <NumberTicker value={Number(scenario.delta_cbam_embedded_kg_co2_per_unit)} />
                          </span>{" "}
                          кг CO₂-экв.
                        </span>
                      </div>
                    )}
                  </div>
                  {catalog && (
                    <div className="mt-5 border-t border-border pt-4">
                      <p className="text-xs text-text-faint">{dict.reports.measuresApplied}</p>
                      <ul className="mt-2 space-y-1 text-sm text-text">
                        {scenario.measure_ids.map((id) => (
                          <li key={id}>{catalog[id]?.title ?? id}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}

export default function ReportsPage() {
  return (
    <Suspense>
      <ReportsContent />
    </Suspense>
  );
}

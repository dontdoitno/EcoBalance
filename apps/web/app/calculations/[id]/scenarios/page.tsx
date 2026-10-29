"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dict } from "@/lib/dictionaries/ru";
import { api, extractErrorMessage } from "@/lib/api-client";
import { formatKgCo2, formatPercent } from "@/lib/format";
import type { MeasureCatalog, ScenarioResult } from "@/lib/types";

export default function ScenariosPage() {
  const params = useParams<{ id: string }>();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: catalog } = useQuery<MeasureCatalog>({
    queryKey: ["reference", "measures"],
    queryFn: async () => (await api.GET("/reference/measures")).data as unknown as MeasureCatalog,
  });

  const scenarioMutation = useMutation({
    mutationFn: async () => {
      const { data, error: apiError } = await api.POST("/calculations/{calculation_id}/scenarios", {
        params: { path: { calculation_id: params.id } },
        body: { name: "Сценарий", measure_ids: selected, assumption_overrides: {} },
      });
      if (apiError) throw apiError;
      return data as unknown as ScenarioResult;
    },
    onError: (err) => setError(extractErrorMessage(err, dict.auth.genericError)),
    onSuccess: () => setError(null),
  });

  function toggle(measureId: string) {
    setSelected((prev) =>
      prev.includes(measureId) ? prev.filter((id) => id !== measureId) : [...prev, measureId],
    );
  }

  const result = scenarioMutation.data;
  const chartData = result
    ? [
        { name: dict.scenarios.before, value: Number(result.baseline.pcf_full_kg_co2_per_unit) },
        { name: dict.scenarios.after, value: Number(result.scenario.pcf_full_kg_co2_per_unit) },
      ]
    : [];

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">{dict.scenarios.title}</h1>
        <p className="mt-1 text-text-secondary">{dict.scenarios.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {catalog &&
            Object.entries(catalog).map(([id, measure]) => (
              <Card
                key={id}
                className={`cursor-pointer transition-colors ${
                  selected.includes(id) ? "border-accent bg-accent-soft" : ""
                }`}
                onClick={() => toggle(id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(id)}
                    onChange={() => toggle(id)}
                    className="mt-1 h-4 w-4 accent-accent"
                  />
                  <div>
                    <p className="font-medium text-text">{measure.title}</p>
                    <p className="mt-1 text-sm text-text-secondary">{measure.scope}</p>
                    <div className="mt-2 flex gap-4 text-xs text-text-faint">
                      <span>
                        {dict.scenarios.complexity}: {measure.complexity_label}
                      </span>
                      <span>
                        {dict.scenarios.payback}: {measure.payback}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          <Button
            onClick={() => scenarioMutation.mutate()}
            disabled={selected.length === 0 || scenarioMutation.isPending}
          >
            {dict.scenarios.runScenario}
          </Button>
          {error && <p className="text-sm text-status-critical-fg">{error}</p>}
        </div>

        <div>
          {result ? (
            <Card>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="name"
                      stroke="var(--color-text-faint)"
                      tick={{ fill: "var(--color-text)", fontSize: 12 }}
                    />
                    <YAxis
                      stroke="var(--color-text-faint)"
                      tick={{ fill: "var(--color-text-faint)", fontSize: 12 }}
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
                    <Bar dataKey="value" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">{dict.scenarios.reduction}</span>
                  <span className="font-semibold text-status-low-fg">
                    −{formatKgCo2(result.delta_pcf_full_kg_co2_per_unit)} (
                    {formatPercent(result.delta_pcf_full_pct)})
                  </span>
                </div>
                {result.delta_cbam_embedded_kg_co2_per_unit != null && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">{dict.results.cbamEmbedded}</span>
                    <span className="font-semibold text-status-low-fg">
                      −{formatKgCo2(result.delta_cbam_embedded_kg_co2_per_unit)}
                    </span>
                  </div>
                )}
              </div>
              <Link href={`/calculations/${params.id}/reports?scenario_id=${result.id}`} className="mt-4 block">
                <Button variant="secondary" className="w-full">
                  {dict.reports.scenarioReport}
                </Button>
              </Link>
            </Card>
          ) : (
            <Card className="flex h-full items-center justify-center border-dashed py-16 text-center">
              <p className="text-text-faint">Выберите меры слева, чтобы увидеть эффект</p>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

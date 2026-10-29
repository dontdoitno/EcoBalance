"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { RatingBadge } from "@/components/ui/rating-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { dict } from "@/lib/dictionaries/ru";
import { api } from "@/lib/api-client";
import { formatKgCo2, formatPercent } from "@/lib/format";
import type { CalculationDetail } from "@/lib/types";

const RATING_COLOR: Record<string, string> = {
  critical: "var(--color-status-critical-fg)",
  significant: "var(--color-status-significant-fg)",
  low: "var(--color-status-low-fg)",
};

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data: detail,
    isLoading,
    isError,
    refetch,
  } = useQuery<CalculationDetail>({
    queryKey: ["calculation", params.id],
    queryFn: async () =>
      (
        await api.GET("/calculations/{calculation_id}", {
          params: { path: { calculation_id: params.id } },
        })
      ).data as unknown as CalculationDetail,
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="mb-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <Card className="max-w-lg py-10 text-center">
          <p className="font-medium text-text">Не удалось загрузить результаты</p>
          <p className="mt-1 text-sm text-text-secondary">Проверьте соединение и попробуйте ещё раз.</p>
          <Button variant="secondary" className="mt-6" onClick={() => refetch()}>
            Повторить
          </Button>
        </Card>
      </AppShell>
    );
  }

  const result = detail?.result;
  if (!result) {
    return (
      <AppShell>
        <Card className="max-w-lg py-10 text-center">
          <p className="text-text-secondary">Расчёт ещё не выполнен.</p>
          <Button className="mt-4" onClick={() => router.push(`/calculations/${params.id}`)}>
            {dict.wizard.calculate}
          </Button>
        </Card>
      </AppShell>
    );
  }

  const chartData = result.breakdown.map((item) => ({
    name: item.label,
    value: Number(item.value_kg_co2_per_unit),
    rating: result.hotspots.find((h) => h.category === item.category)?.rating ?? "low",
  }));

  return (
    <AppShell>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text">{dict.results.title}</h1>
          <p className="mt-1 text-text-secondary">{dict.results.subtitle}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/calculations/${params.id}/scenarios`}>
            <Button variant="secondary">{dict.results.buildScenario}</Button>
          </Link>
          <Link href={`/calculations/${params.id}/reports`}>
            <Button>{dict.results.downloadReport}</Button>
          </Link>
        </div>
      </div>

      {result.data_quality_flags.some((f) => f.code === "demo_factors") && (
        <div className="mb-6 rounded-pill border border-status-significant-fg/30 bg-status-significant-bg px-4 py-3 text-sm text-status-significant-fg">
          {dict.common.demoDataBanner}
        </div>
      )}

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <p className="text-sm text-text-secondary">{dict.results.pcfFull}</p>
          <p className="mt-2 font-mono text-4xl tabular-nums text-text">
            <NumberTicker value={Number(result.pcf_full_kg_co2_per_unit)} /> кг CO₂-экв.
          </p>
          <p className="mt-1 text-sm text-text-faint">на {result.functional_unit} продукта</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">{dict.results.cbamEmbedded}</p>
          {result.cbam_applicable && result.cbam_embedded_kg_co2_per_unit ? (
            <>
              <p className="mt-2 font-mono text-4xl tabular-nums text-cool">
                <NumberTicker value={Number(result.cbam_embedded_kg_co2_per_unit)} /> кг CO₂-экв.
              </p>
              <p className="mt-1 text-sm text-text-faint">прямые + энергия + сырьё-прекурсоры</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-text-faint">{result.cbam_not_applicable_reason}</p>
          )}
        </Card>
      </div>

      <Card className="mb-8">
        <h2 className="text-lg font-medium text-text">{dict.results.scopeBreakdown}</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
              <XAxis
                type="number"
                stroke="var(--color-text-faint)"
                tick={{ fill: "var(--color-text-faint)", fontSize: 12 }}
              />
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
      </Card>

      <Card>
        <h2 className="text-lg font-medium text-text">{dict.results.hotspotsTitle}</h2>
        <p className="mt-1 text-sm text-text-secondary">{dict.results.hotspotsSubtitle}</p>
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
      </Card>
    </AppShell>
  );
}

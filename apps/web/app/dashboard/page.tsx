"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Skeleton } from "@/components/ui/skeleton";
import { dict } from "@/lib/dictionaries/ru";
import { api } from "@/lib/api-client";
import { formatDate, formatKgCo2 } from "@/lib/format";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: calculations,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["calculations"],
    queryFn: async () => {
      const { data } = await api.GET("/calculations");
      return data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.POST("/calculations", { body: { name: "Новый расчёт" } });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calculations"] });
      if (data) router.push(`/calculations/${data.id}`);
    },
  });

  const finalized = calculations?.filter((calc) => calc.status === "final") ?? [];
  const withPcf = finalized.filter((calc) => calc.pcf_full_kg_co2_per_unit != null);
  const averagePcf =
    withPcf.length > 0
      ? withPcf.reduce((sum, calc) => sum + (calc.pcf_full_kg_co2_per_unit ?? 0), 0) / withPcf.length
      : null;

  return (
    <AppShell>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text">{dict.dashboard.title}</h1>
          <p className="mt-1 text-text-secondary">{dict.dashboard.subtitle}</p>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {dict.dashboard.newCalculation}
        </Button>
      </div>

      {!isLoading && !isError && calculations && calculations.length > 0 && (
        <div className="mb-8 grid grid-cols-3 divide-x divide-border rounded-card border border-border">
          <StatTile label="Всего расчётов" value={calculations.length} />
          <StatTile label="Финализировано" value={finalized.length} />
          <StatTile
            label="Средний PCF, кг CO₂-экв./ед."
            value={averagePcf != null ? Math.round(averagePcf * 100) / 100 : null}
          />
        </div>
      )}

      {isError ? (
        <Card className="py-12 text-center">
          <p className="font-medium text-text">Не удалось загрузить расчёты</p>
          <p className="mt-1 text-sm text-text-secondary">Проверьте соединение и попробуйте ещё раз.</p>
          <Button variant="secondary" className="mt-6" onClick={() => refetch()}>
            Повторить
          </Button>
        </Card>
      ) : isLoading ? (
        <div className="overflow-hidden rounded-card border border-border">
          <div className="divide-y divide-border bg-bg-raised">
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-center gap-6 px-4 py-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ) : !calculations?.length ? (
        <Card className="py-16 text-center">
          <p className="font-medium text-text">{dict.dashboard.empty}</p>
          <p className="mt-1 text-sm text-text-secondary">{dict.dashboard.emptyHint}</p>
          <Button className="mt-6" onClick={() => createMutation.mutate()}>
            {dict.dashboard.newCalculation}
          </Button>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-card border border-border">
          <table className="w-full text-sm">
            <thead className="bg-bg-sunken text-xs text-text-faint">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{dict.dashboard.columnName}</th>
                <th className="px-4 py-3 text-left font-medium">{dict.dashboard.columnStatus}</th>
                <th className="px-4 py-3 text-left font-medium">{dict.dashboard.columnPcf}</th>
                <th className="px-4 py-3 text-left font-medium">{dict.dashboard.columnCreated}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-bg-raised">
              {calculations.map((calc) => (
                <tr key={calc.id} className="transition-colors duration-150 hover:bg-bg-sunken">
                  <td className="px-4 py-3">
                    <Link href={`/calculations/${calc.id}`} className="font-medium text-text hover:text-accent">
                      {calc.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-0.5 text-xs font-medium ${
                        calc.status === "final"
                          ? "bg-status-low-bg text-status-low-fg"
                          : "bg-bg-sunken text-text-secondary"
                      }`}
                    >
                      {calc.status === "final" ? dict.dashboard.statusFinal : dict.dashboard.statusDraft}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-text">
                    {calc.pcf_full_kg_co2_per_unit != null ? formatKgCo2(calc.pcf_full_kg_co2_per_unit) : "Не рассчитан"}
                  </td>
                  <td className="px-4 py-3 text-text-faint">{formatDate(calc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

function StatTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="p-6">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 font-mono text-3xl tabular-nums text-text">
        {value != null ? <NumberTicker value={value} /> : "—"}
      </p>
    </div>
  );
}


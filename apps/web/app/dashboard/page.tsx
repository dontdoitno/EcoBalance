"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dict } from "@/lib/dictionaries/ru";
import { api } from "@/lib/api-client";
import { formatDate, formatKgCo2 } from "@/lib/format";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: calculations, isLoading } = useQuery({
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

  return (
    <AppShell>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text">{dict.dashboard.title}</h1>
          <p className="mt-1 text-text-secondary">{dict.dashboard.subtitle}</p>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {dict.dashboard.newCalculation}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-text-secondary">{dict.common.loading}</p>
      ) : !calculations?.length ? (
        <Card className="py-16 text-center">
          <p className="font-medium text-text">{dict.dashboard.empty}</p>
          <p className="mt-1 text-sm text-text-secondary">{dict.dashboard.emptyHint}</p>
          <Button className="mt-6" onClick={() => createMutation.mutate()}>
            {dict.dashboard.newCalculation}
          </Button>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-bg-sunken text-xs uppercase tracking-wide text-text-faint">
              <tr>
                <th className="px-4 py-3 text-left font-medium">{dict.dashboard.columnName}</th>
                <th className="px-4 py-3 text-left font-medium">{dict.dashboard.columnStatus}</th>
                <th className="px-4 py-3 text-left font-medium">{dict.dashboard.columnPcf}</th>
                <th className="px-4 py-3 text-left font-medium">{dict.dashboard.columnCreated}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-bg-raised">
              {calculations.map((calc) => (
                <tr key={calc.id} className="transition-colors hover:bg-bg-sunken">
                  <td className="px-4 py-3">
                    <Link href={`/calculations/${calc.id}`} className="font-medium text-text hover:text-accent">
                      {calc.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        calc.status === "final"
                          ? "bg-status-low-bg text-status-low-fg"
                          : "bg-bg-sunken text-text-secondary"
                      }`}
                    >
                      {calc.status === "final" ? dict.dashboard.statusFinal : dict.dashboard.statusDraft}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text">
                    {calc.pcf_full_kg_co2_per_unit != null ? formatKgCo2(calc.pcf_full_kg_co2_per_unit) : "—"}
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

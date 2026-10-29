"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dict } from "@/lib/dictionaries/ru";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ReportType = "pcf" | "cbam" | "scenario";
type ReportFormat = "pdf" | "xlsx" | "json";

function ReportsContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenario_id");
  const [downloading, setDownloading] = useState<string | null>(null);

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

  const reportKinds: { type: ReportType; label: string; show: boolean }[] = [
    { type: "pcf", label: dict.reports.pcfReport, show: true },
    { type: "cbam", label: dict.reports.cbamReport, show: true },
    { type: "scenario", label: dict.reports.scenarioReport, show: Boolean(scenarioId) },
  ];

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">{dict.reports.title}</h1>
      </div>

      <div className="grid max-w-2xl gap-4">
        {reportKinds
          .filter((kind) => kind.show)
          .map((kind) => (
            <Card key={kind.type} className="flex items-center justify-between">
              <p className="font-medium text-text">{kind.label}</p>
              <div className="flex gap-2">
                {(["pdf", "xlsx", "json"] as ReportFormat[]).map((format) => (
                  <Button
                    key={format}
                    variant="secondary"
                    disabled={downloading === `${kind.type}-${format}`}
                    onClick={() => download(kind.type, format)}
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
      </div>
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

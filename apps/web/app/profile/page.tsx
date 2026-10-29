"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { dict } from "@/lib/dictionaries/ru";
import { COMPANY_SIZES, INDUSTRIES } from "@/lib/dictionaries/static-reference";
import { api } from "@/lib/api-client";
import type { RegionFactor } from "@/lib/types";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: company } = useQuery({
    queryKey: ["company"],
    queryFn: async () => (await api.GET("/companies/me")).data,
  });

  const { data: regions } = useQuery<RegionFactor[]>({
    queryKey: ["regions"],
    queryFn: async () => (await api.GET("/reference/regions")).data as unknown as RegionFactor[],
  });

  const { data: installations } = useQuery({
    queryKey: ["installations"],
    queryFn: async () => (await api.GET("/installations")).data ?? [],
  });

  const [form, setForm] = useState({ name: "", inn: "", industry: "", size: "", region_id: "" });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name ?? "",
        inn: company.inn ?? "",
        industry: company.industry ?? "",
        size: company.size ?? "",
        region_id: company.region_id ?? "",
      });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async () => api.PATCH("/companies/me", { body: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const addInstallationMutation = useMutation({
    mutationFn: async () =>
      api.POST("/installations", { body: { name: "Новая площадка", region_id: form.region_id || null } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["installations"] }),
  });

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">{dict.profile.title}</h1>
        <p className="mt-1 text-text-secondary">{dict.profile.subtitle}</p>
      </div>

      <Card className="max-w-2xl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div>
            <Label htmlFor="name">{dict.profile.companyName}</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="inn">{dict.profile.inn}</Label>
            <Input id="inn" value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="industry">{dict.profile.industry}</Label>
            <Select
              id="industry"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            >
              <option value="">—</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="size">{dict.profile.size}</Label>
            <Select id="size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
              <option value="">—</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="region">{dict.profile.region}</Label>
            <Select
              id="region"
              value={form.region_id}
              onChange={(e) => setForm({ ...form, region_id: e.target.value })}
            >
              <option value="">—</option>
              {regions?.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </Select>
          </div>

          {saved && (
            <div className="rounded-md border border-status-low-fg/30 bg-status-low-bg px-4 py-3 text-sm text-status-low-fg">
              {dict.profile.saved}
            </div>
          )}

          <Button type="submit" disabled={saveMutation.isPending}>
            {dict.profile.save}
          </Button>
        </form>
      </Card>

      <div className="mt-10 max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">{dict.profile.installations}</h2>
          <Button variant="secondary" onClick={() => addInstallationMutation.mutate()}>
            {dict.profile.addInstallation}
          </Button>
        </div>
        <div className="space-y-2">
          {installations?.map((installation) => (
            <Card key={installation.id} className="flex items-center justify-between py-3">
              <span className="font-medium text-text">{installation.name}</span>
              <span className="text-sm text-text-faint">
                {regions?.find((r) => r.id === installation.region_id)?.name ?? "—"}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

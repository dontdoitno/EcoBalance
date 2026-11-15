"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { ScopeDiagram } from "@/components/scope-diagram";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldHint, Input, Label, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { dict } from "@/lib/dictionaries/ru";
import { api, extractErrorMessage } from "@/lib/api-client";
import {
  useProducts,
  useRawMaterials,
  useRegions,
  useRoutes,
  useTransportModes,
} from "@/lib/hooks/use-reference";
import type { CalculationDetail } from "@/lib/types";

interface RawMaterialRow {
  material_id: string;
  quantity_t_per_unit: string;
}

interface TransportRow {
  mode_id: string;
  distance_km: string;
  mass_t_per_unit: string;
}

interface ProcessRow {
  route_id: string;
  output_share_pct: string;
  ef_override: string;
}

interface WizardForm {
  product_id: string;
  route_id: string;
  processes: ProcessRow[];
  raw_materials: RawMaterialRow[];
  electricity_mwh: string;
  region_id: string;
  transport: TransportRow[];
}

const EMPTY_FORM: WizardForm = {
  product_id: "",
  route_id: "",
  processes: [],
  raw_materials: [{ material_id: "", quantity_t_per_unit: "" }],
  electricity_mwh: "",
  region_id: "",
  transport: [],
};

const STEPS = [
  dict.wizard.stepProduct,
  dict.wizard.stepMaterialsEnergy,
  dict.wizard.stepTransport,
  dict.wizard.stepReview,
];

export default function CalculationWizardPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data: products } = useProducts();
  const { data: routes } = useRoutes();
  const { data: rawMaterials } = useRawMaterials();
  const { data: regions } = useRegions();
  const { data: transportModes } = useTransportModes();

  const { data: detail, isLoading: isDetailLoading } = useQuery<CalculationDetail>({
    queryKey: ["calculation", params.id],
    queryFn: async () => (await api.GET("/calculations/{calculation_id}", {
      params: { path: { calculation_id: params.id } },
    })).data as unknown as CalculationDetail,
  });

  useEffect(() => {
    const input = detail?.input;
    if (input && Object.keys(input).length > 0) {
      setForm({
        product_id: (input.product_id as string) ?? "",
        route_id: (input.route_id as string) ?? "",
        processes: (
          input.processes as
            | { route_id: string; output_share_pct: string; ef_override_kg_co2_per_unit?: string }[]
            | undefined
        )?.map((p) => ({
          route_id: p.route_id,
          output_share_pct: p.output_share_pct ?? "",
          ef_override: p.ef_override_kg_co2_per_unit ?? "",
        })) ?? [],
        raw_materials:
          (input.raw_materials as RawMaterialRow[] | undefined)?.length
            ? (input.raw_materials as RawMaterialRow[])
            : EMPTY_FORM.raw_materials,
        electricity_mwh:
          ((input.electricity as { consumption_mwh_per_unit?: string } | undefined)
            ?.consumption_mwh_per_unit as string) ?? "",
        region_id:
          ((input.electricity as { region_id?: string } | undefined)?.region_id as string) ?? "",
        transport: (input.transport as TransportRow[] | undefined) ?? [],
      });
    }
  }, [detail]);

  const availableRoutes = routes?.filter((route) => route.product_id === form.product_id) ?? [];

  function toPayload() {
    return {
      product_id: form.product_id,
      route_id: form.route_id || undefined,
      processes: form.processes
        .filter((row) => row.route_id)
        .map((row) => ({
          route_id: row.route_id,
          output_share_pct: row.output_share_pct || "100",
          ef_override_kg_co2_per_unit: row.ef_override || undefined,
        })),
      raw_materials: form.raw_materials
        .filter((row) => row.material_id && row.quantity_t_per_unit)
        .map((row) => ({ material_id: row.material_id, quantity_t_per_unit: row.quantity_t_per_unit })),
      electricity:
        form.electricity_mwh && form.region_id
          ? { consumption_mwh_per_unit: form.electricity_mwh, region_id: form.region_id }
          : undefined,
      transport: form.transport
        .filter((row) => row.mode_id && row.distance_km && row.mass_t_per_unit)
        .map((row) => ({
          direction: "outbound_product" as const,
          mode_id: row.mode_id,
          distance_km: row.distance_km,
          mass_t_per_unit: row.mass_t_per_unit,
        })),
    };
  }

  const patchMutation = useMutation({
    mutationFn: async () =>
      api.PATCH("/calculations/{calculation_id}", {
        params: { path: { calculation_id: params.id } },
        body: toPayload(),
      }),
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      await patchMutation.mutateAsync();
      return api.POST("/calculations/{calculation_id}/calculate", {
        params: { path: { calculation_id: params.id } },
      });
    },
    onSuccess: ({ error: calcError }) => {
      if (calcError) {
        setError(extractErrorMessage(calcError, dict.auth.genericError));
        return;
      }
      router.push(`/calculations/${params.id}/results`);
    },
  });

  function next() {
    patchMutation.mutate();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const isStepValid =
    step === 0
      ? Boolean(form.product_id)
      : step === 1
        ? form.raw_materials.some((r) => r.material_id && r.quantity_t_per_unit) &&
          Boolean(form.electricity_mwh) &&
          Boolean(form.region_id)
        : true;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-text">{dict.wizard.title}</h1>
        <p className="mt-1 text-text-secondary">{dict.wizard.subtitle}</p>
      </div>

      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                index <= step ? "bg-accent text-accent-on" : "bg-bg-sunken text-text-faint"
              }`}
            >
              {index + 1}
            </span>
            <span className={`text-sm ${index === step ? "font-medium text-text" : "text-text-faint"}`}>
              {label}
            </span>
            {index < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <Card className="min-h-[360px]">
        {isDetailLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
        ) : (
        <div key={step} className="animate-step-in">
        {step === 0 && (
          <div className="space-y-5">
            <div className="border-b border-border pb-5">
              <ScopeDiagram />
              <p className="mt-3 text-xs text-text-faint">
                Сырьё и транспорт считаются за пределами площадки (Scope 3), энергия относится к Scope 2,
                а сжигание топлива и технологические выбросы на площадке к Scope 1.
              </p>
            </div>
            <div>
              <Label htmlFor="product">{dict.wizard.selectProduct}</Label>
              <Select
                id="product"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value, route_id: "" })}
              >
                <option value="">Не выбрано</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
              {form.product_id && (
                <FieldHint>
                  {products?.find((p) => p.id === form.product_id)?.cbam_applicable
                    ? "Продукт входит в категории CBAM: после расчёта доступен отчёт CBAM."
                    : "CBAM не применим к этому продукту, доступен PCF-отчёт."}
                </FieldHint>
              )}
            </div>
            {availableRoutes.length > 0 && (
              <div>
                <Label htmlFor="route">{dict.wizard.selectRoute}</Label>
                <Select
                  id="route"
                  value={form.route_id}
                  onChange={(e) => setForm({ ...form, route_id: e.target.value })}
                >
                  <option value="">Не выбрано</option>
                  {availableRoutes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            {form.processes.map((process, index) => (
              <div key={index} className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex items-end gap-3">
                  <Select
                    value={process.route_id}
                    onChange={(e) => {
                      const processes = [...form.processes];
                      processes[index] = { ...process, route_id: e.target.value };
                      setForm({ ...form, processes });
                    }}
                  >
                    <option value="">{dict.wizard.selectRoute}</option>
                    {availableRoutes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder={dict.wizard.routeShare}
                    className="w-40"
                    value={process.output_share_pct}
                    onChange={(e) => {
                      const processes = [...form.processes];
                      processes[index] = { ...process, output_share_pct: e.target.value };
                      setForm({ ...form, processes });
                    }}
                  />
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() =>
                      setForm({ ...form, processes: form.processes.filter((_, i) => i !== index) })
                    }
                  >
                    {dict.wizard.remove}
                  </Button>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={dict.wizard.customCoefficient}
                  value={process.ef_override}
                  onChange={(e) => {
                    const processes = [...form.processes];
                    processes[index] = { ...process, ef_override: e.target.value };
                    setForm({ ...form, processes });
                  }}
                />
              </div>
            ))}
            {form.route_id && (
              <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    processes: [
                      ...form.processes,
                      { route_id: "", output_share_pct: "", ef_override: "" },
                    ],
                  })
                }
              >
                {dict.wizard.addRoute}
              </Button>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="border-b border-border pb-5">
              <ScopeDiagram highlight={["upstream", "scope2"]} />
              <p className="mt-3 text-xs text-text-faint">
                Сырьё относится к Scope 3 (за пределами площадки), электроэнергия к Scope 2.
              </p>
            </div>
            <div>
              <Label>{dict.wizard.rawMaterial}</Label>
              <div className="space-y-3">
                {form.raw_materials.map((row, index) => (
                  <div key={index} className="flex items-end gap-3">
                    <Select
                      value={row.material_id}
                      onChange={(e) => {
                        const raw_materials = [...form.raw_materials];
                        raw_materials[index] = { ...row, material_id: e.target.value };
                        setForm({ ...form, raw_materials });
                      }}
                    >
                      <option value="">Не выбрано</option>
                      {rawMaterials?.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={dict.wizard.rawMaterialAmount}
                      className="w-48"
                      value={row.quantity_t_per_unit}
                      onChange={(e) => {
                        const raw_materials = [...form.raw_materials];
                        raw_materials[index] = { ...row, quantity_t_per_unit: e.target.value };
                        setForm({ ...form, raw_materials });
                      }}
                    />
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          raw_materials: form.raw_materials.filter((_, i) => i !== index),
                        })
                      }
                    >
                      {dict.wizard.remove}
                    </Button>
                  </div>
                ))}
              </div>
              <FieldHint>{dict.wizard.rawMaterialAmount}</FieldHint>
              <Button
                variant="secondary"
                type="button"
                className="mt-3"
                onClick={() =>
                  setForm({
                    ...form,
                    raw_materials: [
                      ...form.raw_materials,
                      { material_id: "", quantity_t_per_unit: "" },
                    ],
                  })
                }
              >
                {dict.wizard.addRawMaterial}
              </Button>
            </div>
            <div>
              <Label htmlFor="electricity">{dict.wizard.electricity}</Label>
              <Input
                id="electricity"
                type="number"
                step="0.01"
                value={form.electricity_mwh}
                onChange={(e) => setForm({ ...form, electricity_mwh: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="region">{dict.wizard.electricityRegion}</Label>
              <Select
                id="region"
                value={form.region_id}
                onChange={(e) => setForm({ ...form, region_id: e.target.value })}
              >
                <option value="">Не выбрано</option>
                {regions?.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="border-b border-border pb-5">
              <ScopeDiagram highlight={["downstream"]} />
              <p className="mt-3 text-xs text-text-faint">
                Транспорт готовой продукции и обращение с отходами тоже Scope 3, но не входят во
                встроенные выбросы CBAM.
              </p>
            </div>
            <p className="text-sm text-text-secondary">{dict.common.optional}</p>
            {form.transport.map((leg, index) => (
              <div key={index} className="flex items-end gap-3">
                <Select
                  value={leg.mode_id}
                  onChange={(e) => {
                    const transport = [...form.transport];
                    transport[index] = { ...leg, mode_id: e.target.value };
                    setForm({ ...form, transport });
                  }}
                >
                  <option value="">{dict.wizard.transportMode}</option>
                  {transportModes?.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  placeholder={dict.wizard.transportDistance}
                  className="w-32"
                  value={leg.distance_km}
                  onChange={(e) => {
                    const transport = [...form.transport];
                    transport[index] = { ...leg, distance_km: e.target.value };
                    setForm({ ...form, transport });
                  }}
                />
                <Input
                  type="number"
                  placeholder={dict.wizard.transportMass}
                  className="w-32"
                  value={leg.mass_t_per_unit}
                  onChange={(e) => {
                    const transport = [...form.transport];
                    transport[index] = { ...leg, mass_t_per_unit: e.target.value };
                    setForm({ ...form, transport });
                  }}
                />
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() =>
                    setForm({ ...form, transport: form.transport.filter((_, i) => i !== index) })
                  }
                >
                  {dict.wizard.remove}
                </Button>
              </div>
            ))}
            <Button
              variant="secondary"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  transport: [...form.transport, { mode_id: "", distance_km: "", mass_t_per_unit: "" }],
                })
              }
            >
              {dict.wizard.addTransportLeg}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-sm">
            <ReviewRow
              label={dict.wizard.stepProduct}
              value={products?.find((p) => p.id === form.product_id)?.name ?? "Не указано"}
            />
            <ReviewRow
              label={dict.wizard.selectRoute}
              value={
                form.processes.length > 0
                  ? `${1 + form.processes.length} маршрута`
                  : availableRoutes.find((r) => r.id === form.route_id)?.name ?? "Не указано"
              }
            />
            <ReviewRow
              label={dict.wizard.rawMaterial}
              value={
                form.raw_materials.filter((r) => r.material_id).length > 0
                  ? `${form.raw_materials.filter((r) => r.material_id).length} вид(ов)`
                  : "Не указано"
              }
            />
            <ReviewRow label={dict.wizard.electricity} value={form.electricity_mwh || "Не указано"} />
            <ReviewRow
              label={dict.wizard.electricityRegion}
              value={regions?.find((r) => r.id === form.region_id)?.name ?? "Не указано"}
            />
            <ReviewRow label={dict.wizard.stepTransport} value={`${form.transport.length} шт.`} />
            {error && <p className="text-status-critical-fg">{error}</p>}
          </div>
        )}
        </div>
        )}
      </Card>

      <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={back} disabled={step === 0}>
          {dict.wizard.back}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!isStepValid}>
            {dict.wizard.next}
          </Button>
        ) : (
          <Button onClick={() => calculateMutation.mutate()} disabled={calculateMutation.isPending}>
            {dict.wizard.calculate}
          </Button>
        )}
      </div>
      </div>
    </AppShell>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <span className="text-text-secondary">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}

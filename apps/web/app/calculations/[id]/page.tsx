"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldHint, Input, Label, Select } from "@/components/ui/field";
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

interface WizardForm {
  product_id: string;
  route_id: string;
  raw_materials: RawMaterialRow[];
  electricity_mwh: string;
  region_id: string;
  transport: TransportRow[];
}

const EMPTY_FORM: WizardForm = {
  product_id: "",
  route_id: "",
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

  const { data: detail } = useQuery<CalculationDetail>({
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text">{dict.wizard.title}</h1>
        <p className="mt-1 text-text-secondary">{dict.wizard.subtitle}</p>
      </div>

      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
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

      <Card className="min-h-[360px] max-w-2xl">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="product">{dict.wizard.selectProduct}</Label>
              <Select
                id="product"
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value, route_id: "" })}
              >
                <option value="">—</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
              {form.product_id && (
                <FieldHint>
                  {products?.find((p) => p.id === form.product_id)?.cbam_applicable
                    ? "Продукт входит в категории CBAM — после расчёта доступен отчёт CBAM."
                    : "CBAM не применим к этому продукту — доступен PCF-отчёт."}
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
                  <option value="">—</option>
                  {availableRoutes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="material">{dict.wizard.rawMaterial}</Label>
              <div className="flex gap-3">
                <Select
                  id="material"
                  value={form.raw_materials[0]?.material_id ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      raw_materials: [
                        {
                          material_id: e.target.value,
                          quantity_t_per_unit: form.raw_materials[0]?.quantity_t_per_unit ?? "",
                        },
                      ],
                    })
                  }
                >
                  <option value="">—</option>
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
                  value={form.raw_materials[0]?.quantity_t_per_unit ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      raw_materials: [
                        {
                          material_id: form.raw_materials[0]?.material_id ?? "",
                          quantity_t_per_unit: e.target.value,
                        },
                      ],
                    })
                  }
                />
              </div>
              <FieldHint>{dict.wizard.rawMaterialAmount}</FieldHint>
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
                <option value="">—</option>
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
              value={products?.find((p) => p.id === form.product_id)?.name ?? "—"}
            />
            <ReviewRow
              label={dict.wizard.rawMaterial}
              value={
                rawMaterials?.find((m) => m.id === form.raw_materials[0]?.material_id)?.name ?? "—"
              }
            />
            <ReviewRow label={dict.wizard.electricity} value={form.electricity_mwh || "—"} />
            <ReviewRow
              label={dict.wizard.electricityRegion}
              value={regions?.find((r) => r.id === form.region_id)?.name ?? "—"}
            />
            <ReviewRow label={dict.wizard.stepTransport} value={`${form.transport.length} шт.`} />
            {error && <p className="text-status-critical-fg">{error}</p>}
          </div>
        )}
      </Card>

      <div className="mt-6 flex max-w-2xl justify-between">
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

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Product, RawMaterialFactor, RegionFactor, Route, TransportFactor } from "@/lib/types";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["reference", "products"],
    queryFn: async () => (await api.GET("/reference/products")).data as unknown as Product[],
  });
}

export function useRoutes() {
  return useQuery<Route[]>({
    queryKey: ["reference", "routes"],
    queryFn: async () => (await api.GET("/reference/routes")).data as unknown as Route[],
  });
}

export function useRawMaterials() {
  return useQuery<RawMaterialFactor[]>({
    queryKey: ["reference", "raw-materials"],
    queryFn: async () => (await api.GET("/reference/raw-materials")).data as unknown as RawMaterialFactor[],
  });
}

export function useRegions() {
  return useQuery<RegionFactor[]>({
    queryKey: ["reference", "regions"],
    queryFn: async () => (await api.GET("/reference/regions")).data as unknown as RegionFactor[],
  });
}

export function useTransportModes() {
  return useQuery<TransportFactor[]>({
    queryKey: ["reference", "transport-modes"],
    queryFn: async () => (await api.GET("/reference/transport-modes")).data as unknown as TransportFactor[],
  });
}

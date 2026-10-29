const numberFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });

export function formatNumber(value: string | number): string {
  return numberFormatter.format(Number(value));
}

export function formatKgCo2(value: string | number): string {
  return `${formatNumber(value)} кг CO₂-экв.`;
}

export function formatPercent(value: string | number): string {
  return `${formatNumber(value)}%`;
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

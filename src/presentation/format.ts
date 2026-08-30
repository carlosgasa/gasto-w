export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number): string {
  return moneyFormatter.format(amount);
}

/** Formatter compatible con el tipo laxo que espera recharts <Tooltip formatter>. */
export function moneyTooltip(value: unknown): string {
  return formatMoney(Number(value));
}

const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  return `${MONTH_LABELS[monthNum - 1]} ${year}`;
}

export function previousMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(month: string, delta: number): string {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

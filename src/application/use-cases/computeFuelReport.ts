import type { Expense } from "../../domain/entities/Expense";

export interface FuelEntry {
  date: string;
  amount: number;
  liters: number | null;
  pricePerLiter: number | null;
  kmPerLiter: number | null;
  cumulativeSpend: number;
}

/** Espera los gastos de la categoría de combustible, en cualquier orden. */
export function computeFuelReport(expenses: Expense[]): FuelEntry[] {
  const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
  let cumulative = 0;
  let previousOdometer: number | null = null;
  const entries: FuelEntry[] = [];

  for (const expense of sorted) {
    cumulative += expense.amount;
    const liters = expense.extra?.liters ?? null;
    const pricePerLiter = expense.extra?.pricePerLiter ?? (liters && liters > 0 ? expense.amount / liters : null);
    const odometer = expense.extra?.odometerKm ?? null;

    let kmPerLiter: number | null = null;
    if (odometer != null && previousOdometer != null && liters && liters > 0) {
      const kmTraveled = odometer - previousOdometer;
      if (kmTraveled > 0) kmPerLiter = kmTraveled / liters;
    }
    if (odometer != null) previousOdometer = odometer;

    entries.push({
      date: expense.date,
      amount: expense.amount,
      liters,
      pricePerLiter,
      kmPerLiter,
      cumulativeSpend: cumulative,
    });
  }

  return entries;
}

export interface FuelExpenseExtra {
  odometerKm?: number;
  liters?: number;
  pricePerLiter?: number;
}

export type ExpenseExtra = FuelExpenseExtra;

export type ExpenseSource = "manual" | "recurring";

export interface Expense {
  id: string;
  amount: number;
  date: string; // ISO date (yyyy-mm-dd)
  accountId: string;
  categoryId: string;
  note: string;
  source: ExpenseSource;
  recurringId: string | null;
  extra: ExpenseExtra | null;
  createdAt: number;
  updatedAt: number;
}

export type NewExpense = Omit<Expense, "id" | "createdAt" | "updatedAt">;

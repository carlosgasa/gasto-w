export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  accountId: string;
  categoryId: string;
  dayOfMonth: number;
  active: boolean;
  startDate: string; // ISO date
  endDate: string | null;
  createdAt: number;
}

export type NewRecurringTemplate = Omit<RecurringTemplate, "id" | "createdAt">;

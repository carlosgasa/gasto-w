export interface MonthlySummary {
  month: string; // "yyyy-mm"
  totalAmount: number;
  byCategory: Record<string, number>;
  byAccount: Record<string, number>;
  expenseCount: number;
  computedAt: number;
}

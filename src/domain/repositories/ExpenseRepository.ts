import type { Expense, NewExpense } from "../entities/Expense";

export interface ExpenseRepository {
  listByMonth(month: string): Promise<Expense[]>;
  subscribeByMonth(month: string, onChange: (expenses: Expense[]) => void): () => void;
  create(expense: NewExpense): Promise<string>;
  update(id: string, patch: Partial<NewExpense>): Promise<void>;
  remove(id: string): Promise<void>;
}

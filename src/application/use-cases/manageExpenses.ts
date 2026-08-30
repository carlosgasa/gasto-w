import type { ExpenseRepository } from "../../domain/repositories/ExpenseRepository";
import type { MonthlySummaryRepository } from "../../domain/repositories/MonthlySummaryRepository";
import type { Expense, NewExpense } from "../../domain/entities/Expense";

export interface ExpenseDeps {
  expenseRepo: ExpenseRepository;
  summaryRepo: MonthlySummaryRepository;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

function validate(input: Pick<NewExpense, "amount" | "date" | "accountId" | "categoryId">) {
  if (!(input.amount > 0)) throw new Error("El monto debe ser mayor a cero.");
  if (!input.date) throw new Error("Falta la fecha del gasto.");
  if (!input.accountId) throw new Error("Selecciona una cuenta.");
  if (!input.categoryId) throw new Error("Selecciona una categoría.");
}

export async function registerExpense(deps: ExpenseDeps, input: NewExpense): Promise<string> {
  validate(input);
  const id = await deps.expenseRepo.create(input);
  await deps.summaryRepo.applyDelta(monthOf(input.date), {
    amount: input.amount,
    categoryId: input.categoryId,
    accountId: input.accountId,
    countDelta: 1,
  });
  return id;
}

export async function updateExpense(
  deps: ExpenseDeps,
  original: Expense,
  patch: Partial<NewExpense>,
): Promise<void> {
  const merged = { ...original, ...patch };
  validate(merged);

  await deps.expenseRepo.update(original.id, patch);

  await deps.summaryRepo.applyDelta(monthOf(original.date), {
    amount: -original.amount,
    categoryId: original.categoryId,
    accountId: original.accountId,
    countDelta: -1,
  });
  await deps.summaryRepo.applyDelta(monthOf(merged.date), {
    amount: merged.amount,
    categoryId: merged.categoryId,
    accountId: merged.accountId,
    countDelta: 1,
  });
}

export async function deleteExpense(deps: ExpenseDeps, expense: Expense): Promise<void> {
  await deps.expenseRepo.remove(expense.id);
  await deps.summaryRepo.applyDelta(monthOf(expense.date), {
    amount: -expense.amount,
    categoryId: expense.categoryId,
    accountId: expense.accountId,
    countDelta: -1,
  });
}

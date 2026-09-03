import type { ExpenseRepository } from "../../domain/repositories/ExpenseRepository";
import type { MonthlySummaryOverwrite, MonthlySummaryRepository } from "../../domain/repositories/MonthlySummaryRepository";
import { monthOf } from "./manageExpenses";

/**
 * Reconstruye monthlySummaries desde cero a partir de los gastos reales
 * (fuente de verdad). Es seguro llamarlo cuantas veces haga falta: siempre
 * reemplaza el resumen de cada mes por el que resulta de sumar sus gastos,
 * así que repara cualquier inconsistencia (p. ej. datos escritos con un bug
 * ya corregido) sin arriesgar los gastos originales.
 */
export async function recomputeAllMonthlySummaries(
  expenseRepo: ExpenseRepository,
  summaryRepo: MonthlySummaryRepository,
): Promise<void> {
  const expenses = await expenseRepo.listAll();

  const byMonth = new Map<string, MonthlySummaryOverwrite>();
  for (const expense of expenses) {
    const month = monthOf(expense.date);
    const entry = byMonth.get(month) ?? { totalAmount: 0, byCategory: {}, byAccount: {}, expenseCount: 0 };
    entry.totalAmount += expense.amount;
    entry.byCategory[expense.categoryId] = (entry.byCategory[expense.categoryId] ?? 0) + expense.amount;
    entry.byAccount[expense.accountId] = (entry.byAccount[expense.accountId] ?? 0) + expense.amount;
    entry.expenseCount += 1;
    byMonth.set(month, entry);
  }

  for (const [month, summary] of byMonth.entries()) {
    await summaryRepo.overwrite(month, summary);
  }
}

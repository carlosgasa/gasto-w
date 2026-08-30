import type { RecurringTemplateRepository } from "../../domain/repositories/RecurringTemplateRepository";
import type { NewRecurringTemplate, RecurringTemplate } from "../../domain/entities/RecurringTemplate";
import type { Expense } from "../../domain/entities/Expense";
import { registerExpense, type ExpenseDeps } from "./manageExpenses";

export async function createRecurringTemplate(
  repo: RecurringTemplateRepository,
  input: Omit<NewRecurringTemplate, "active">,
): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new Error("El nombre del gasto recurrente no puede estar vacío.");
  if (!(input.amount > 0)) throw new Error("El monto debe ser mayor a cero.");
  if (!input.accountId) throw new Error("Selecciona una cuenta.");
  if (!input.categoryId) throw new Error("Selecciona una categoría.");

  return repo.create({ ...input, name, active: true });
}

export async function archiveRecurringTemplate(
  repo: RecurringTemplateRepository,
  id: string,
): Promise<void> {
  await repo.setActive(id, false);
}

function daysInMonth(month: string): number {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(year, monthNum, 0).getDate();
}

/**
 * Genera, para el mes dado, las instancias de gasto que falten a partir de las
 * plantillas activas. Es idempotente: no duplica si ya existe un gasto con ese
 * recurringId en el mes.
 */
export async function generateRecurringExpensesForMonth(
  deps: ExpenseDeps,
  templates: RecurringTemplate[],
  month: string,
  existingExpensesThisMonth: Expense[],
): Promise<number> {
  const alreadyGenerated = new Set(
    existingExpensesThisMonth
      .filter((e) => e.source === "recurring" && e.recurringId)
      .map((e) => e.recurringId as string),
  );

  const total = daysInMonth(month);
  let created = 0;

  for (const template of templates) {
    if (!template.active) continue;
    if (template.startDate.slice(0, 7) > month) continue;
    if (template.endDate && template.endDate.slice(0, 7) < month) continue;
    if (alreadyGenerated.has(template.id)) continue;

    const day = Math.min(template.dayOfMonth, total);
    const date = `${month}-${String(day).padStart(2, "0")}`;

    await registerExpense(deps, {
      amount: template.amount,
      date,
      accountId: template.accountId,
      categoryId: template.categoryId,
      note: template.name,
      source: "recurring",
      recurringId: template.id,
      extra: null,
    });
    created += 1;
  }

  return created;
}

import type { Account } from "./Account";
import type { Category } from "./Category";
import type { Expense } from "./Expense";
import type { RecurringTemplate } from "./RecurringTemplate";
import type { MonthlySummary } from "./MonthlySummary";

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  accounts: Account[];
  categories: Category[];
  expenses: Expense[];
  recurringTemplates: RecurringTemplate[];
  monthlySummaries: MonthlySummary[];
}

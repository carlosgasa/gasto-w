import { doc, Timestamp, writeBatch } from "firebase/firestore";
import type { BackupRepository } from "../../domain/repositories/BackupRepository";
import type { BackupPayload } from "../../domain/entities/Backup";
import type { Account } from "../../domain/entities/Account";
import type { Category } from "../../domain/entities/Category";
import type { Expense } from "../../domain/entities/Expense";
import type { RecurringTemplate } from "../../domain/entities/RecurringTemplate";
import type { MonthlySummary } from "../../domain/entities/MonthlySummary";
import { db, OWNER_UID } from "./firebaseClient";
import { FirestoreAccountRepository } from "./FirestoreAccountRepository";
import { FirestoreCategoryRepository } from "./FirestoreCategoryRepository";
import { FirestoreExpenseRepository } from "./FirestoreExpenseRepository";
import { FirestoreRecurringTemplateRepository } from "./FirestoreRecurringTemplateRepository";
import { FirestoreMonthlySummaryRepository } from "./FirestoreMonthlySummaryRepository";

const BATCH_SIZE = 400;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function restore(
  collectionName: string,
  docs: { id: string; data: Record<string, unknown> }[],
): Promise<void> {
  for (const group of chunk(docs, BATCH_SIZE)) {
    const batch = writeBatch(db);
    for (const item of group) {
      batch.set(doc(db, "users", OWNER_UID, collectionName, item.id), item.data);
    }
    await batch.commit();
  }
}

export class FirestoreBackupRepository implements BackupRepository {
  async exportAll(): Promise<BackupPayload> {
    const [accounts, categories, expenses, recurringTemplates, monthlySummaries] = await Promise.all([
      new FirestoreAccountRepository().list(),
      new FirestoreCategoryRepository().list(),
      new FirestoreExpenseRepository().listAll(),
      new FirestoreRecurringTemplateRepository().list(),
      new FirestoreMonthlySummaryRepository().listAll(),
    ]);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      accounts,
      categories,
      expenses,
      recurringTemplates,
      monthlySummaries,
    };
  }

  async importAll(payload: BackupPayload): Promise<void> {
    await restore(
      "accounts",
      payload.accounts.map((a: Account) => {
        const { id, createdAt, ...rest } = a;
        return { id, data: { ...rest, createdAt: Timestamp.fromMillis(createdAt) } };
      }),
    );
    await restore(
      "categories",
      payload.categories.map((c: Category) => {
        const { id, createdAt, ...rest } = c;
        return { id, data: { ...rest, createdAt: Timestamp.fromMillis(createdAt) } };
      }),
    );
    await restore(
      "recurringTemplates",
      payload.recurringTemplates.map((t: RecurringTemplate) => {
        const { id, createdAt, ...rest } = t;
        return { id, data: { ...rest, createdAt: Timestamp.fromMillis(createdAt) } };
      }),
    );
    await restore(
      "expenses",
      payload.expenses.map((e: Expense) => {
        const { id, createdAt, updatedAt, ...rest } = e;
        return {
          id,
          data: { ...rest, createdAt: Timestamp.fromMillis(createdAt), updatedAt: Timestamp.fromMillis(updatedAt) },
        };
      }),
    );
    await restore(
      "monthlySummaries",
      payload.monthlySummaries.map((s: MonthlySummary) => {
        const { month, computedAt, ...rest } = s;
        return { id: month, data: { ...rest, computedAt: Timestamp.fromMillis(computedAt) } };
      }),
    );
  }
}

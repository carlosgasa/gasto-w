import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { ExpenseRepository } from "../../domain/repositories/ExpenseRepository";
import type { Expense, NewExpense } from "../../domain/entities/Expense";
import { db, OWNER_UID } from "./firebaseClient";

function expensesCollection() {
  return collection(db, "users", OWNER_UID, "expenses");
}

function monthRange(month: string): { start: string; end: string } {
  const [year, monthNum] = month.split("-").map(Number);
  const start = `${month}-01`;
  const end =
    monthNum === 12
      ? `${year + 1}-01-01`
      : `${String(year).padStart(4, "0")}-${String(monthNum + 1).padStart(2, "0")}-01`;
  return { start, end };
}

function toExpense(id: string, data: Record<string, unknown>): Expense {
  const createdAt = data.createdAt as Timestamp | undefined;
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id,
    amount: data.amount as number,
    date: data.date as string,
    accountId: data.accountId as string,
    categoryId: data.categoryId as string,
    note: (data.note as string) ?? "",
    source: (data.source as Expense["source"]) ?? "manual",
    recurringId: (data.recurringId as string | null) ?? null,
    extra: (data.extra as Expense["extra"]) ?? null,
    createdAt: createdAt ? createdAt.toMillis() : Date.now(),
    updatedAt: updatedAt ? updatedAt.toMillis() : Date.now(),
  };
}

export class FirestoreExpenseRepository implements ExpenseRepository {
  async listByMonth(month: string): Promise<Expense[]> {
    const { start, end } = monthRange(month);
    const q = query(
      expensesCollection(),
      where("date", ">=", start),
      where("date", "<", end),
      orderBy("date", "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => toExpense(d.id, d.data()));
  }

  subscribeByMonth(month: string, onChange: (expenses: Expense[]) => void): () => void {
    const { start, end } = monthRange(month);
    const q = query(
      expensesCollection(),
      where("date", ">=", start),
      where("date", "<", end),
      orderBy("date", "desc"),
    );
    return onSnapshot(q, (snapshot) => {
      onChange(snapshot.docs.map((d) => toExpense(d.id, d.data())));
    });
  }

  async listByCategory(categoryId: string): Promise<Expense[]> {
    const q = query(expensesCollection(), where("categoryId", "==", categoryId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((d) => toExpense(d.id, d.data()))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async create(expense: NewExpense): Promise<string> {
    const ref = await addDoc(expensesCollection(), {
      ...expense,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, patch: Partial<NewExpense>): Promise<void> {
    await updateDoc(doc(expensesCollection(), id), { ...patch, updatedAt: serverTimestamp() });
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(expensesCollection(), id));
  }
}

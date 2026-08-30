import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import type {
  MonthlySummaryDelta,
  MonthlySummaryRepository,
} from "../../domain/repositories/MonthlySummaryRepository";
import type { MonthlySummary } from "../../domain/entities/MonthlySummary";
import { db, OWNER_UID } from "./firebaseClient";

function summariesCollection() {
  return collection(db, "users", OWNER_UID, "monthlySummaries");
}

function toSummary(id: string, data: Record<string, unknown>): MonthlySummary {
  const computedAt = data.computedAt as Timestamp | undefined;
  return {
    month: id,
    totalAmount: (data.totalAmount as number) ?? 0,
    byCategory: (data.byCategory as Record<string, number>) ?? {},
    byAccount: (data.byAccount as Record<string, number>) ?? {},
    expenseCount: (data.expenseCount as number) ?? 0,
    computedAt: computedAt ? computedAt.toMillis() : Date.now(),
  };
}

export class FirestoreMonthlySummaryRepository implements MonthlySummaryRepository {
  async get(month: string): Promise<MonthlySummary | null> {
    const snap = await getDoc(doc(summariesCollection(), month));
    if (!snap.exists()) return null;
    return toSummary(snap.id, snap.data());
  }

  async listAll(): Promise<MonthlySummary[]> {
    const snap = await getDocs(query(summariesCollection(), orderBy("__name__", "asc")));
    return snap.docs.map((d) => toSummary(d.id, d.data()));
  }

  subscribeAll(onChange: (summaries: MonthlySummary[]) => void): () => void {
    const q = query(summariesCollection(), orderBy("__name__", "asc"));
    return onSnapshot(q, (snapshot) => {
      onChange(snapshot.docs.map((d) => toSummary(d.id, d.data())));
    });
  }

  /**
   * Usa setDoc con merge + increment (en vez de una transacción) a propósito:
   * las transacciones de Firestore requieren conexión, mientras que esto se
   * encola como escritura normal y funciona sin internet — se sincroniza solo
   * al volver la conexión, igual que cualquier otra escritura de la app.
   */
  async applyDelta(month: string, delta: MonthlySummaryDelta): Promise<void> {
    const ref = doc(summariesCollection(), month);

    await setDoc(
      ref,
      {
        totalAmount: increment(delta.amount),
        [`byCategory.${delta.categoryId}`]: increment(delta.amount),
        [`byAccount.${delta.accountId}`]: increment(delta.amount),
        expenseCount: increment(delta.countDelta),
        computedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}

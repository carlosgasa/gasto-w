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
  MonthlySummaryOverwrite,
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
   *
   * Los campos anidados (byCategory/byAccount) se mandan como objeto anidado,
   * no como llave con punto ("byCategory.xyz"): con setDoc+merge, una llave
   * con punto se guarda como nombre de campo LITERAL (con el punto incluido)
   * en vez de anidarse — por eso los montos por categoría/cuenta no se veían
   * aunque el total sí. El objeto anidado sí hace merge profundo real.
   */
  async applyDelta(month: string, delta: MonthlySummaryDelta): Promise<void> {
    const ref = doc(summariesCollection(), month);

    await setDoc(
      ref,
      {
        totalAmount: increment(delta.amount),
        byCategory: { [delta.categoryId]: increment(delta.amount) },
        byAccount: { [delta.accountId]: increment(delta.amount) },
        expenseCount: increment(delta.countDelta),
        computedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  /** Reemplaza por completo el resumen de un mes (usado para reconstruir desde los gastos). */
  async overwrite(month: string, summary: MonthlySummaryOverwrite): Promise<void> {
    const ref = doc(summariesCollection(), month);
    await setDoc(ref, {
      totalAmount: summary.totalAmount,
      byCategory: summary.byCategory,
      byAccount: summary.byAccount,
      expenseCount: summary.expenseCount,
      computedAt: serverTimestamp(),
    });
  }
}

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import type { RecurringTemplateRepository } from "../../domain/repositories/RecurringTemplateRepository";
import type { NewRecurringTemplate, RecurringTemplate } from "../../domain/entities/RecurringTemplate";
import { db, OWNER_UID } from "./firebaseClient";

function templatesCollection() {
  return collection(db, "users", OWNER_UID, "recurringTemplates");
}

function toTemplate(id: string, data: Record<string, unknown>): RecurringTemplate {
  const createdAt = data.createdAt as Timestamp | undefined;
  return {
    id,
    name: data.name as string,
    amount: data.amount as number,
    accountId: data.accountId as string,
    categoryId: data.categoryId as string,
    dayOfMonth: data.dayOfMonth as number,
    active: data.active as boolean,
    startDate: data.startDate as string,
    endDate: (data.endDate as string | null) ?? null,
    createdAt: createdAt ? createdAt.toMillis() : Date.now(),
  };
}

export class FirestoreRecurringTemplateRepository implements RecurringTemplateRepository {
  async list(): Promise<RecurringTemplate[]> {
    const snapshot = await getDocs(query(templatesCollection(), orderBy("createdAt", "asc")));
    return snapshot.docs.map((d) => toTemplate(d.id, d.data()));
  }

  subscribe(onChange: (templates: RecurringTemplate[]) => void): () => void {
    const q = query(templatesCollection(), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      onChange(snapshot.docs.map((d) => toTemplate(d.id, d.data())));
    });
  }

  async create(template: NewRecurringTemplate): Promise<string> {
    const ref = await addDoc(templatesCollection(), {
      ...template,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, patch: Partial<NewRecurringTemplate>): Promise<void> {
    await updateDoc(doc(templatesCollection(), id), patch);
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await updateDoc(doc(templatesCollection(), id), { active });
  }
}

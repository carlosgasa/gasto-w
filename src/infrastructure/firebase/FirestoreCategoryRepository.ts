import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import type { CategoryRepository } from "../../domain/repositories/CategoryRepository";
import type { Category, NewCategory } from "../../domain/entities/Category";
import { db, OWNER_UID } from "./firebaseClient";

function categoriesCollection() {
  return collection(db, "users", OWNER_UID, "categories");
}

function toCategory(id: string, data: Record<string, unknown>): Category {
  const createdAt = data.createdAt as Timestamp | undefined;
  return {
    id,
    name: data.name as string,
    color: data.color as string,
    icon: data.icon as string,
    isDefault: data.isDefault as boolean,
    active: data.active as boolean,
    fieldsTemplate: (data.fieldsTemplate ?? null) as Category["fieldsTemplate"],
    createdAt: createdAt ? createdAt.toMillis() : Date.now(),
  };
}

export class FirestoreCategoryRepository implements CategoryRepository {
  async list(): Promise<Category[]> {
    const snapshot = await getDocs(query(categoriesCollection(), orderBy("createdAt", "asc")));
    return snapshot.docs.map((d) => toCategory(d.id, d.data()));
  }

  subscribe(onChange: (categories: Category[]) => void): () => void {
    const q = query(categoriesCollection(), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      onChange(snapshot.docs.map((d) => toCategory(d.id, d.data())));
    });
  }

  async create(category: NewCategory): Promise<string> {
    const ref = await addDoc(categoriesCollection(), {
      ...category,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, patch: Partial<NewCategory>): Promise<void> {
    await updateDoc(doc(categoriesCollection(), id), patch);
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await updateDoc(doc(categoriesCollection(), id), { active });
  }

  async ensureDefaults(defaults: NewCategory[]): Promise<void> {
    const existing = await getDocs(categoriesCollection());
    if (!existing.empty) return;

    const batch = writeBatch(db);
    for (const category of defaults) {
      const ref = doc(categoriesCollection());
      batch.set(ref, { ...category, createdAt: serverTimestamp() });
    }
    await batch.commit();
  }
}

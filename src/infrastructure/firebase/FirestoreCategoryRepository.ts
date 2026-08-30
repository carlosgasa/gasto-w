import {
  addDoc,
  collection,
  deleteDoc,
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
import type { CategoryRepository, SeedCategory } from "../../domain/repositories/CategoryRepository";
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

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(categoriesCollection(), id));
  }

  /**
   * Usa IDs determinísticos ("default-<seedId>") en vez de revisar si la
   * colección está vacía: así, si esto se llama dos veces en paralelo (p. ej.
   * por StrictMode en desarrollo), ambas llamadas escriben los MISMOS
   * documentos en vez de crear duplicados.
   */
  async ensureDefaults(defaults: SeedCategory[]): Promise<void> {
    const existing = await getDocs(categoriesCollection());
    const existingIds = new Set(existing.docs.map((d) => d.id));
    const missing = defaults.filter((d) => !existingIds.has(`default-${d.seedId}`));
    if (missing.length === 0) return;

    const batch = writeBatch(db);
    for (const category of missing) {
      const { seedId, ...data } = category;
      const ref = doc(categoriesCollection(), `default-${seedId}`);
      batch.set(ref, { ...data, createdAt: serverTimestamp() });
    }
    await batch.commit();
  }
}

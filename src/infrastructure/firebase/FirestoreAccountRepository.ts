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
} from "firebase/firestore";
import type { AccountRepository } from "../../domain/repositories/AccountRepository";
import type { Account, NewAccount } from "../../domain/entities/Account";
import { db, OWNER_UID } from "./firebaseClient";

function accountsCollection() {
  return collection(db, "users", OWNER_UID, "accounts");
}

function toAccount(id: string, data: Record<string, unknown>): Account {
  const createdAt = data.createdAt as Timestamp | undefined;
  return {
    id,
    name: data.name as string,
    type: data.type as Account["type"],
    color: data.color as string,
    icon: data.icon as string,
    active: data.active as boolean,
    createdAt: createdAt ? createdAt.toMillis() : Date.now(),
  };
}

export class FirestoreAccountRepository implements AccountRepository {
  async list(): Promise<Account[]> {
    const snapshot = await getDocs(query(accountsCollection(), orderBy("createdAt", "asc")));
    return snapshot.docs.map((d) => toAccount(d.id, d.data()));
  }

  subscribe(onChange: (accounts: Account[]) => void): () => void {
    const q = query(accountsCollection(), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      onChange(snapshot.docs.map((d) => toAccount(d.id, d.data())));
    });
  }

  async create(account: NewAccount): Promise<string> {
    const ref = await addDoc(accountsCollection(), {
      ...account,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async update(id: string, patch: Partial<NewAccount>): Promise<void> {
    await updateDoc(doc(accountsCollection(), id), patch);
  }

  async setActive(id: string, active: boolean): Promise<void> {
    await updateDoc(doc(accountsCollection(), id), { active });
  }
}

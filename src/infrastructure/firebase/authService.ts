import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, OWNER_UID } from "./firebaseClient";

export function signIn(email: string, password: string): Promise<void> {
  return signInWithEmailAndPassword(auth, email, password).then(() => undefined);
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export function subscribeToAuthChanges(
  onChange: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, onChange);
}

export function isOwner(user: User | null): boolean {
  return user !== null && user.uid === OWNER_UID;
}

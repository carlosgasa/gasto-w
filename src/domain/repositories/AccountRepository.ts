import type { Account, NewAccount } from "../entities/Account";

export interface AccountRepository {
  list(): Promise<Account[]>;
  subscribe(onChange: (accounts: Account[]) => void): () => void;
  create(account: NewAccount): Promise<string>;
  update(id: string, patch: Partial<NewAccount>): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
}

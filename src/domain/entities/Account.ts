export type AccountType = "card" | "cash";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  color: string;
  icon: string;
  active: boolean;
  createdAt: number;
}

export type NewAccount = Omit<Account, "id" | "createdAt">;

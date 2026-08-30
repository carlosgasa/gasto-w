import type { AccountRepository } from "../../domain/repositories/AccountRepository";
import type { NewAccount } from "../../domain/entities/Account";

export async function createAccount(
  repo: AccountRepository,
  input: Pick<NewAccount, "name" | "type" | "color" | "icon">,
): Promise<string> {
  const name = input.name.trim();
  if (!name) throw new Error("El nombre de la cuenta no puede estar vacío.");

  return repo.create({ ...input, name, active: true });
}

export async function archiveAccount(repo: AccountRepository, id: string): Promise<void> {
  await repo.setActive(id, false);
}

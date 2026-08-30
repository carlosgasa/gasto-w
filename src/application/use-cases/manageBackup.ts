import type { BackupRepository } from "../../domain/repositories/BackupRepository";
import type { BackupPayload } from "../../domain/entities/Backup";

const REQUIRED_KEYS = ["accounts", "categories", "expenses", "recurringTemplates", "monthlySummaries"] as const;

export async function exportBackup(repo: BackupRepository): Promise<BackupPayload> {
  return repo.exportAll();
}

export function parseBackupPayload(raw: unknown): BackupPayload {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("El archivo no tiene un formato de respaldo válido.");
  }
  const data = raw as Record<string, unknown>;
  if (data.version !== 1) {
    throw new Error("Este archivo es de una versión de respaldo no soportada.");
  }
  for (const key of REQUIRED_KEYS) {
    if (!Array.isArray(data[key])) {
      throw new Error(`El respaldo no contiene "${key}".`);
    }
  }
  return data as unknown as BackupPayload;
}

export async function importBackup(repo: BackupRepository, raw: unknown): Promise<void> {
  const payload = parseBackupPayload(raw);
  await repo.importAll(payload);
}

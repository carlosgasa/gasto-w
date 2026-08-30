import type { BackupPayload } from "../entities/Backup";

export interface BackupRepository {
  exportAll(): Promise<BackupPayload>;
  /** Restaura preservando los IDs originales (para no romper referencias cruzadas). */
  importAll(payload: BackupPayload): Promise<void>;
}

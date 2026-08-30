import type { MonthlySummary } from "../entities/MonthlySummary";

export interface MonthlySummaryDelta {
  amount: number; // puede ser negativo (edición/borrado)
  categoryId: string;
  accountId: string;
  countDelta: number; // +1 alta, -1 borrado, 0 si no cambia
}

export interface MonthlySummaryRepository {
  get(month: string): Promise<MonthlySummary | null>;
  listAll(): Promise<MonthlySummary[]>;
  subscribeAll(onChange: (summaries: MonthlySummary[]) => void): () => void;
  applyDelta(month: string, delta: MonthlySummaryDelta): Promise<void>;
}

import type { NewRecurringTemplate, RecurringTemplate } from "../entities/RecurringTemplate";

export interface RecurringTemplateRepository {
  list(): Promise<RecurringTemplate[]>;
  subscribe(onChange: (templates: RecurringTemplate[]) => void): () => void;
  create(template: NewRecurringTemplate): Promise<string>;
  update(id: string, patch: Partial<NewRecurringTemplate>): Promise<void>;
  setActive(id: string, active: boolean): Promise<void>;
}

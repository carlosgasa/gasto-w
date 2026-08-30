import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { Account } from "../../domain/entities/Account";
import type { Category } from "../../domain/entities/Category";
import type { MonthlySummary } from "../../domain/entities/MonthlySummary";
import { FirestoreAccountRepository } from "../../infrastructure/firebase/FirestoreAccountRepository";
import { FirestoreCategoryRepository } from "../../infrastructure/firebase/FirestoreCategoryRepository";
import { FirestoreMonthlySummaryRepository } from "../../infrastructure/firebase/FirestoreMonthlySummaryRepository";
import { buildInsightMessages } from "../../application/use-cases/computeInsights";
import { currentMonth, formatMoney, formatMonthLabel, moneyTooltip } from "../format";
import "./pages.css";
import "./ReportsPage.css";

const accountRepo = new FirestoreAccountRepository();
const categoryRepo = new FirestoreCategoryRepository();
const summaryRepo = new FirestoreMonthlySummaryRepository();

export function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);

  useEffect(() => accountRepo.subscribe(setAccounts), []);
  useEffect(() => categoryRepo.subscribe(setCategories), []);
  useEffect(() => summaryRepo.subscribeAll(setSummaries), []);

  const month = currentMonth();
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const currentSummary = summaries.find((s) => s.month === month) ?? null;

  const insights = useMemo(
    () => buildInsightMessages(summaries, categories, month).slice(0, 3),
    [summaries, categories, month],
  );

  const pieData = useMemo(() => {
    if (!currentSummary) return [];
    return Object.entries(currentSummary.byCategory)
      .map(([id, amount]) => ({
        name: categoryById.get(id)?.name ?? "Otros",
        value: amount,
        color: categoryById.get(id)?.color ?? "#8A7A99",
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [currentSummary, categoryById]);

  const byAccountEntries = useMemo(() => {
    if (!currentSummary) return [];
    return Object.entries(currentSummary.byAccount)
      .map(([id, amount]) => ({ name: accountById.get(id)?.name ?? "?", amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentSummary, accountById]);

  return (
    <div>
      <div className="page-header">
        <h1>Resumen</h1>
        <p>{formatMonthLabel(month)}</p>
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-label">Gasto del mes</div>
          <div className="stat-value">{formatMoney(currentSummary?.totalAmount ?? 0)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Movimientos</div>
          <div className="stat-value">{currentSummary?.expenseCount ?? 0}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Cuentas activas</div>
          <div className="stat-value">{accounts.filter((a) => a.active).length}</div>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="card">
          <h2>Avisos</h2>
          <ul className="insight-list">
            {insights.map((insight, i) => (
              <li key={i} className={`insight-item insight-${insight.tone}`}>
                {insight.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="reports-grid">
        <div className="card">
          <h2>Por categoría</h2>
          {pieData.length === 0 ? (
            <p className="empty-hint">Aún no registras gastos este mes.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={moneyTooltip} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2>Por cuenta</h2>
          {byAccountEntries.length === 0 ? (
            <p className="empty-hint">Aún no registras gastos este mes.</p>
          ) : (
            <div className="entity-list">
              {byAccountEntries.map((entry) => (
                <div className="entity-row" key={entry.name}>
                  <span className="entity-name">{entry.name}</span>
                  <span className="expense-amount">{formatMoney(entry.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

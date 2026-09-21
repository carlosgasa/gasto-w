import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import type { Account } from "../../domain/entities/Account";
import type { Category } from "../../domain/entities/Category";
import type { Expense } from "../../domain/entities/Expense";
import type { MonthlySummary } from "../../domain/entities/MonthlySummary";
import { FirestoreAccountRepository } from "../../infrastructure/firebase/FirestoreAccountRepository";
import { FirestoreCategoryRepository } from "../../infrastructure/firebase/FirestoreCategoryRepository";
import { FirestoreExpenseRepository } from "../../infrastructure/firebase/FirestoreExpenseRepository";
import { FirestoreMonthlySummaryRepository } from "../../infrastructure/firebase/FirestoreMonthlySummaryRepository";
import { buildInsightMessages, computeMonthComparison } from "../../application/use-cases/computeInsights";
import { computeFuelReport, type FuelEntry } from "../../application/use-cases/computeFuelReport";
import { currentMonth, formatMoney, formatMonthLabel, moneyTooltip } from "../format";
import { Icon } from "../icons/Icon";
import { CalendarHeatmap } from "../components/CalendarHeatmap";
import "./pages.css";
import "./ReportsPage.css";

const STACK_COLORS = ["#9B24DE", "#3F8CE0", "#D69A1F", "#3FAE6B", "#D14F8C", "#5B6EE0"];
const OTHER_COLOR = "#8A7A99";

const accountRepo = new FirestoreAccountRepository();
const categoryRepo = new FirestoreCategoryRepository();
const summaryRepo = new FirestoreMonthlySummaryRepository();
const expenseRepo = new FirestoreExpenseRepository();

export function ReportsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summaries, setSummaries] = useState<MonthlySummary[]>([]);
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [pdfMonth, setPdfMonth] = useState(currentMonth());
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);

  useEffect(() => accountRepo.subscribe(setAccounts), []);
  useEffect(() => categoryRepo.subscribe(setCategories), []);
  useEffect(() => summaryRepo.subscribeAll(setSummaries), []);
  useEffect(() => expenseRepo.subscribeByMonth(currentMonth(), setMonthExpenses), []);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const fuelCategory = useMemo(() => categories.find((c) => c.fieldsTemplate === "fuel"), [categories]);

  // Incluye categorías de combustible duplicadas/archivadas: sus gastos siguen existiendo.
  useEffect(() => {
    const ids = categories.filter((c) => c.fieldsTemplate === "fuel").map((c) => c.id);
    if (ids.length === 0) return;
    Promise.all(ids.map((id) => expenseRepo.listByCategory(id))).then((lists) => {
      setFuelEntries(computeFuelReport(lists.flat()));
    });
  }, [categories]);

  const month = currentMonth();
  const comparison = useMemo(() => computeMonthComparison(summaries, month), [summaries, month]);
  const insights = useMemo(
    () => buildInsightMessages(summaries, categories, month),
    [summaries, categories, month],
  );

  const currentSummary = summaries.find((s) => s.month === month);

  const pieData = useMemo(() => {
    if (!currentSummary) return [];
    return Object.entries(currentSummary.byCategory)
      .map(([categoryId, amount]) => ({
        name: categoryById.get(categoryId)?.name ?? "Otros",
        value: amount,
        color: categoryById.get(categoryId)?.color ?? "#8A7A99",
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [currentSummary, categoryById]);

  const trendData = useMemo(
    () =>
      summaries.slice(-12).map((s) => ({
        month: formatMonthLabel(s.month).slice(0, 3),
        total: s.totalAmount,
      })),
    [summaries],
  );

  const comparisonData = useMemo(
    () => [
      { label: "Mes anterior", value: comparison.previousTotal ?? 0 },
      { label: "Este mes", value: comparison.currentTotal },
    ],
    [comparison],
  );

  const topCategories = pieData.slice(0, 6);

  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const expense of monthExpenses) {
      totals[expense.date] = (totals[expense.date] ?? 0) + expense.amount;
    }
    return totals;
  }, [monthExpenses]);

  const stackedCategoryIds = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of summaries.slice(-6)) {
      for (const [categoryId, amount] of Object.entries(s.byCategory)) {
        totals.set(categoryId, (totals.get(categoryId) ?? 0) + amount);
      }
    }
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => id);
  }, [summaries]);

  const stackedSeries = useMemo(
    () =>
      stackedCategoryIds.map((id, i) => ({
        id,
        name: categoryById.get(id)?.name ?? "Otros",
        color: STACK_COLORS[i % STACK_COLORS.length],
      })),
    [stackedCategoryIds, categoryById],
  );

  const stackedData = useMemo(() => {
    return summaries.slice(-6).map((s) => {
      const row: Record<string, string | number> = { month: formatMonthLabel(s.month).slice(0, 3) };
      let otros = 0;
      for (const [categoryId, amount] of Object.entries(s.byCategory)) {
        const series = stackedSeries.find((entry) => entry.id === categoryId);
        if (series) {
          row[series.name] = (Number(row[series.name]) || 0) + amount;
        } else {
          otros += amount;
        }
      }
      if (otros > 0) row["Otros"] = otros;
      return row;
    });
  }, [summaries, stackedSeries]);

  async function handleExportPdf() {
    const summary = summaries.find((s) => s.month === pdfMonth);
    if (!summary) return;

    const byCategory = Object.entries(summary.byCategory)
      .map(([id, amount]) => ({ name: categoryById.get(id)?.name ?? "Otros", amount }))
      .sort((a, b) => b.amount - a.amount);
    const byAccount = Object.entries(summary.byAccount)
      .map(([id, amount]) => ({ name: accountById.get(id)?.name ?? "?", amount }))
      .sort((a, b) => b.amount - a.amount);

    const isCurrent = pdfMonth === currentMonth();
    const label = isCurrent
      ? `${formatMonthLabel(pdfMonth)} (al día de hoy)`
      : formatMonthLabel(pdfMonth);

    const { buildMonthlyStatementPdf } = await import("../../infrastructure/pdf/buildMonthlyStatementPdf");
    const doc = buildMonthlyStatementPdf({
      monthLabel: label,
      totalAmount: summary.totalAmount,
      expenseCount: summary.expenseCount,
      byCategory,
      byAccount,
    });
    doc.save(`cuentas-${pdfMonth}.pdf`);
  }

  const pdfSummaryAvailable = summaries.some((s) => s.month === pdfMonth);

  return (
    <div>
      <div className="page-header reports-header">
        <div>
          <h1>Reportes</h1>
          <p>Comparativas, tendencias y proyecciones a partir de tu histórico de gastos.</p>
        </div>
        <div className="pdf-export">
          <input
            type="month"
            value={pdfMonth}
            max={currentMonth()}
            onChange={(e) => setPdfMonth(e.target.value)}
          />
          <button className="btn-primary" onClick={handleExportPdf} disabled={!pdfSummaryAvailable}>
            <Icon name="reports" size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Avisos de {formatMonthLabel(month)}</h2>
        {insights.length === 0 ? (
          <p className="empty-hint">Aún no hay suficiente histórico para generar avisos.</p>
        ) : (
          <ul className="insight-list">
            {insights.map((insight, i) => (
              <li key={i} className={`insight-item insight-${insight.tone}`}>
                {insight.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="reports-grid">
        <div className="card">
          <h2>Este mes vs. mes anterior</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip formatter={moneyTooltip} />
              <Bar dataKey="value" fill="#9B24DE" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2>Gasto por categoría — {formatMonthLabel(month)}</h2>
          {pieData.length === 0 ? (
            <p className="empty-hint">No hay gastos registrados este mes.</p>
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
      </div>

      <div className="card">
        <h2>Evolución del gasto (últimos 12 meses)</h2>
        {trendData.length === 0 ? (
          <p className="empty-hint">Todavía no hay histórico suficiente.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip formatter={moneyTooltip} />
              <Line type="monotone" dataKey="total" stroke="#A62FEB" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="reports-grid">
        <div className="card">
          <h2>Composición por categoría (últimos 6 meses)</h2>
          {stackedData.length === 0 ? (
            <p className="empty-hint">Todavía no hay histórico suficiente.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stackedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip formatter={moneyTooltip} />
                <Legend />
                {stackedSeries.map((series) => (
                  <Bar key={series.id} dataKey={series.name} stackId="cat" fill={series.color} />
                ))}
                <Bar dataKey="Otros" stackId="cat" fill={OTHER_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2>Gasto diario — {formatMonthLabel(month)}</h2>
          <CalendarHeatmap month={month} dailyTotals={dailyTotals} />
        </div>
      </div>

      <div className="card">
        <h2>Ranking de categorías — {formatMonthLabel(month)}</h2>
        {topCategories.length === 0 ? (
          <p className="empty-hint">No hay datos todavía.</p>
        ) : (
          <div className="entity-list">
            {topCategories.map((c, i) => (
              <div className="entity-row" key={c.name}>
                <span className="rank-number">{i + 1}</span>
                <div className="entity-swatch" style={{ background: c.color }} />
                <span className="entity-name">{c.name}</span>
                <span className="expense-amount">{formatMoney(c.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {fuelCategory && (
        <div className="card">
          <h2>Combustible</h2>
          {fuelEntries.length === 0 ? (
            <p className="empty-hint">Registra cargas de gasolina para ver rendimiento y precio por litro.</p>
          ) : (
            <div className="reports-grid">
              <div>
                <h3 className="mini-heading">Precio por litro</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={fuelEntries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip formatter={moneyTooltip} />
                    <Line type="monotone" dataKey="pricePerLiter" stroke="#D69A1F" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="mini-heading">Rendimiento (km/litro)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={fuelEntries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="kmPerLiter" stroke="#3FAE6B" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="mini-heading">Gasto acumulado en combustible</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={fuelEntries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip formatter={moneyTooltip} />
                    <Area type="monotone" dataKey="cumulativeSpend" stroke="#9B24DE" fill="#C97DF2" fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

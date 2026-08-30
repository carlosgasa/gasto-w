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
import type { MonthlySummary } from "../../domain/entities/MonthlySummary";
import { FirestoreAccountRepository } from "../../infrastructure/firebase/FirestoreAccountRepository";
import { FirestoreCategoryRepository } from "../../infrastructure/firebase/FirestoreCategoryRepository";
import { FirestoreExpenseRepository } from "../../infrastructure/firebase/FirestoreExpenseRepository";
import { FirestoreMonthlySummaryRepository } from "../../infrastructure/firebase/FirestoreMonthlySummaryRepository";
import { buildInsightMessages, computeMonthComparison } from "../../application/use-cases/computeInsights";
import { computeFuelReport, type FuelEntry } from "../../application/use-cases/computeFuelReport";
import { buildMonthlyStatementPdf } from "../../infrastructure/pdf/buildMonthlyStatementPdf";
import { currentMonth, formatMoney, formatMonthLabel, moneyTooltip } from "../format";
import { Icon } from "../icons/Icon";
import "./pages.css";
import "./ReportsPage.css";

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

  useEffect(() => accountRepo.subscribe(setAccounts), []);
  useEffect(() => categoryRepo.subscribe(setCategories), []);
  useEffect(() => summaryRepo.subscribeAll(setSummaries), []);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const fuelCategory = useMemo(() => categories.find((c) => c.fieldsTemplate === "fuel"), [categories]);

  useEffect(() => {
    if (!fuelCategory) return;
    expenseRepo.listByCategory(fuelCategory.id).then((expenses) => {
      setFuelEntries(computeFuelReport(expenses));
    });
  }, [fuelCategory]);

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

  function handleExportPdf() {
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

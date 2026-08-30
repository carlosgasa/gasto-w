import type { MonthlySummary } from "../../domain/entities/MonthlySummary";
import type { Category } from "../../domain/entities/Category";

export interface CategoryStreak {
  categoryId: string;
  direction: "up" | "down";
  months: number;
}

export interface MonthComparison {
  currentMonth: string;
  currentTotal: number;
  previousTotal: number | null;
  deltaAmount: number | null;
  deltaPercent: number | null;
}

/** Compara el total del mes dado contra el mes inmediato anterior. */
export function computeMonthComparison(
  summaries: MonthlySummary[],
  month: string,
): MonthComparison {
  const byMonth = new Map(summaries.map((s) => [s.month, s]));
  const current = byMonth.get(month)?.totalAmount ?? 0;

  const [year, monthNum] = month.split("-").map(Number);
  const prevDate = new Date(year, monthNum - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const previous = byMonth.get(prevMonth);

  if (!previous) {
    return { currentMonth: month, currentTotal: current, previousTotal: null, deltaAmount: null, deltaPercent: null };
  }

  const deltaAmount = current - previous.totalAmount;
  const deltaPercent = previous.totalAmount > 0 ? (deltaAmount / previous.totalAmount) * 100 : null;

  return {
    currentMonth: month,
    currentTotal: current,
    previousTotal: previous.totalAmount,
    deltaAmount,
    deltaPercent,
  };
}

/** Detecta rachas de 3+ meses subiendo o bajando, por categoría, usando el histórico ordenado ascendente. */
export function computeCategoryStreaks(summaries: MonthlySummary[]): CategoryStreak[] {
  const sorted = [...summaries].sort((a, b) => a.month.localeCompare(b.month));
  const categoryIds = new Set(sorted.flatMap((s) => Object.keys(s.byCategory)));
  const results: CategoryStreak[] = [];

  for (const categoryId of categoryIds) {
    const series = sorted.map((s) => s.byCategory[categoryId] ?? 0);
    let run = 0;
    let direction: "up" | "down" | null = null;

    for (let i = series.length - 1; i > 0; i--) {
      const delta = series[i] - series[i - 1];
      const sign: "up" | "down" | null = delta > 0 ? "up" : delta < 0 ? "down" : null;
      if (sign === null) break;
      if (direction === null) direction = sign;
      if (sign !== direction) break;
      run++;
    }

    if (direction && run >= 2) {
      results.push({ categoryId, direction, months: run + 1 });
    }
  }

  return results.sort((a, b) => b.months - a.months);
}

/** Proyección simple de gasto del mes por ritmo de gasto (run-rate). */
export function computeProjection(currentMonthTotal: number, daysElapsed: number, daysInMonth: number): number {
  if (daysElapsed <= 0) return 0;
  return (currentMonthTotal / daysElapsed) * daysInMonth;
}

export function daysInMonth(month: string): number {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(year, monthNum, 0).getDate();
}

export interface InsightMessage {
  tone: "positive" | "warning" | "neutral";
  message: string;
}

export function buildInsightMessages(
  summaries: MonthlySummary[],
  categories: Category[],
  month: string,
  today: Date = new Date(),
): InsightMessage[] {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const messages: InsightMessage[] = [];

  const comparison = computeMonthComparison(summaries, month);
  if (comparison.deltaPercent !== null && comparison.deltaAmount !== null) {
    const pct = Math.abs(comparison.deltaPercent).toFixed(0);
    if (comparison.deltaAmount > 0) {
      messages.push({ tone: "warning", message: `Vas ${pct}% más que el mes pasado.` });
    } else if (comparison.deltaAmount < 0) {
      messages.push({ tone: "positive", message: `Vas ${pct}% menos que el mes pasado.` });
    } else {
      messages.push({ tone: "neutral", message: "Vas igual que el mes pasado." });
    }
  }

  const total = daysInMonth(month);
  const isCurrentCalendarMonth = month === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  if (isCurrentCalendarMonth) {
    const elapsed = today.getDate();
    const projection = computeProjection(comparison.currentTotal, elapsed, total);
    if (elapsed < total && comparison.currentTotal > 0) {
      messages.push({
        tone: "neutral",
        message: `Al ritmo actual, este mes cerrarías cerca de $${projection.toFixed(0)}.`,
      });
    }
  }

  const streaks = computeCategoryStreaks(summaries);
  for (const streak of streaks.slice(0, 3)) {
    const name = categoryName.get(streak.categoryId) ?? "una categoría";
    const verb = streak.direction === "up" ? "subiendo" : "bajando";
    messages.push({
      tone: streak.direction === "up" ? "warning" : "positive",
      message: `Llevas ${streak.months} meses ${verb} el gasto en ${name}.`,
    });
  }

  const topGrowth = findTopGrowingCategory(summaries, month);
  if (topGrowth && topGrowth.deltaAmount > 0) {
    const name = categoryName.get(topGrowth.categoryId) ?? "una categoría";
    messages.push({
      tone: "warning",
      message: `La categoría que más creció este mes fue ${name} (+$${topGrowth.deltaAmount.toFixed(0)}).`,
    });
  }

  return messages;
}

export interface TopGrowth {
  categoryId: string;
  deltaAmount: number;
}

/** Categoría con el mayor incremento absoluto en monto vs. el mes anterior. */
export function findTopGrowingCategory(summaries: MonthlySummary[], month: string): TopGrowth | null {
  const byMonth = new Map(summaries.map((s) => [s.month, s]));
  const current = byMonth.get(month);
  const [year, monthNum] = month.split("-").map(Number);
  const prevDate = new Date(year, monthNum - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const previous = byMonth.get(prevMonth);
  if (!current) return null;

  let best: TopGrowth | null = null;
  const categoryIds = new Set([...Object.keys(current.byCategory), ...Object.keys(previous?.byCategory ?? {})]);
  for (const categoryId of categoryIds) {
    const delta = (current.byCategory[categoryId] ?? 0) - (previous?.byCategory[categoryId] ?? 0);
    if (!best || delta > best.deltaAmount) best = { categoryId, deltaAmount: delta };
  }
  return best;
}

import { formatMoney } from "../format";
import "./CalendarHeatmap.css";

interface CalendarHeatmapProps {
  month: string; // "yyyy-mm"
  dailyTotals: Record<string, number>; // "yyyy-mm-dd" -> monto
}

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export function CalendarHeatmap({ month, dailyTotals }: CalendarHeatmapProps) {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstWeekday = (new Date(year, monthNum - 1, 1).getDay() + 6) % 7; // lunes = 0

  const max = Math.max(1, ...Object.values(dailyTotals));

  const cells: { day: number | null; date: string; amount: number }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, date: "", amount: 0 });
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    cells.push({ day, date, amount: dailyTotals[date] ?? 0 });
  }

  return (
    <div className="calendar-heatmap">
      <div className="calendar-heatmap-weekdays">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="calendar-heatmap-grid">
        {cells.map((cell, i) =>
          cell.day === null ? (
            <span key={i} className="calendar-heatmap-cell is-empty" />
          ) : (
            <span
              key={i}
              className="calendar-heatmap-cell"
              style={cell.amount > 0 ? { opacity: 0.22 + 0.78 * (cell.amount / max) } : undefined}
              title={cell.amount > 0 ? `${cell.date}: ${formatMoney(cell.amount)}` : cell.date}
            >
              {cell.day}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

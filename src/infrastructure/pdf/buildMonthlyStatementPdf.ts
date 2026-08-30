import jsPDF from "jspdf";

interface StatementRow {
  name: string;
  amount: number;
}

export interface MonthlyStatementData {
  monthLabel: string;
  totalAmount: number;
  expenseCount: number;
  byCategory: StatementRow[];
  byAccount: StatementRow[];
}

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function drawTable(doc: jsPDF, title: string, rows: StatementRow[], x: number, startY: number): number {
  let y = startY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, x, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  if (rows.length === 0) {
    doc.text("Sin movimientos.", x, y);
    return y + 16;
  }

  for (const row of rows) {
    doc.text(row.name, x, y);
    doc.text(money.format(row.amount), x + 300, y);
    y += 16;
  }
  return y;
}

export function buildMonthlyStatementPdf(data: MonthlyStatementData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 48;
  let y = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Cuentas — Estado de cuenta", marginX, y);

  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(data.monthLabel, marginX, y);

  y += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Total gastado: ${money.format(data.totalAmount)}`, marginX, y);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${data.expenseCount} movimientos`, marginX, y);

  y += 34;
  y = drawTable(doc, "Por categoría", data.byCategory, marginX, y);
  y += 24;
  drawTable(doc, "Por cuenta", data.byAccount, marginX, y);

  return doc;
}

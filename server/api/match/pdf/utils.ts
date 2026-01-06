import { ShootingArea } from "~/types/handball";
import { ShootingGrid } from "./types";

export function calculateEfficiency(scored: number, total: number): number {
  return total ? Math.round((scored / total) * 100) : 0;
}

export function labelShootingArea(area: ShootingArea): string {
  if (!area) return "other";
  if (area === "7M") return "7M";
  if (area === "LW" || area === "RW") return "Wing";
  if (area.endsWith("9")) return "9M";
  if (area.endsWith("6")) return "6M";
  return "other";
}

export function getAreaMapping(area: ShootingArea): string {
  switch (area) {
    case "LW":
    case "RW":
      return "Wing";
    case "LB9":
    case "CB9":
    case "RB9":
      return "Back (9M)";
    case "LB6":
    case "CB6":
    case "RB6":
      return "Line (6M)";
    case "7M":
      return "7M Penalties";
    default:
      return "other";
  }
}

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  
  // Handle MM:SS format
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseInt(parts[1], 10) || 0;
    return minutes * 60 + seconds;
  }
  
  return 0;
}

export function secondsToMinutes(seconds: number): number {
  return Math.floor(seconds / 60);
}
// ==================== PDF DRAWING HELPERS ====================

export function drawTableRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  cols: (string | number)[],
  colWidths: number[],
  rowHeight = 12,
  isHeader = false
): number {
  let curX = x;
  const baseline = y + rowHeight / 4;
  
  doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica', isHeader ? 8 : 8);
  
  cols.forEach((cell, i) => {
    doc.text(String(cell), isHeader ? curX + 1 : curX + 3, baseline, {
      width: colWidths[i],
    });
    
    // Draw vertical line
    doc.moveTo(curX + colWidths[i], y)
      .lineTo(curX + colWidths[i], y + rowHeight)
      .stroke();
    
    curX += colWidths[i];
  });
  
  // Draw bottom line
  doc.moveTo(x, y + rowHeight)
    .lineTo(x + colWidths.reduce((a, b) => a + b, 0), y + rowHeight)
    .stroke();
  
  return y + rowHeight;
}

export function drawPlayerGrid(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  grid: ShootingGrid,
  label?: string
): void {
  const square = 22;
  const recw = 22;
  const rech = 22-6;
  
  if (label) {
    doc.fontSize(8).text(label, x, y - 10);
  }
  
  // Draw 3x3 grid
  for (let i = 0; i < 9; i++) {
    const cx = x + (i % 3) * recw;
    const cy = y + Math.floor(i / 3) * rech;
    
    doc.rect(cx, cy, recw, rech).stroke();
    
    const cell = grid.squares[i] || { scored: 0, total: 0 };
    doc.font('Helvetica-Bold', 7)
      .text(`${cell.scored}/${cell.total}`, cx + 5, cy + 6);
  }
  
  // Draw missed shots if present
  if (grid.missed) {
    const missedParts: string[] = [];
    if (grid.missed.left > 0) missedParts.push(`L:${grid.missed.left}`);
    if (grid.missed.right > 0) missedParts.push(`R:${grid.missed.right}`);
    if (grid.missed.top > 0) missedParts.push(`T:${grid.missed.top}`);
    
    if (missedParts.length > 0) {
      doc.font('Helvetica-Bold', 7)
        .text(`Missed: ${missedParts.join(", ")}`, x, y + 55);
    }
  }
}



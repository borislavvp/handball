import { ShootingGrid } from "~/types/pdf";

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



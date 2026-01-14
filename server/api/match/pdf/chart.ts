import PDFKit from "pdfkit";
import { ScoreAtMinute } from "~/types/pdf";

// --------------------
// Draw score chart
// --------------------
export function drawScoreChart(
  doc: PDFKit.PDFDocument,
  scores: ScoreAtMinute[],
  startX: number,
  startY: number,
  width: number,
  height: number,
  homeName: string,
  awayName: string
): void {
  const padding = { top: 50, right: 80, bottom: 450, left: 80 }
  const chartX = startX + padding.left
  const chartY = startY + padding.top
  const chartWidth = width - padding.right - padding.left
  const chartHeight = height 

  /* -----------------------------
     DATA RANGE (COMPACT)
  ----------------------------- */
  const diffs = scores.map(s => s.difference)
  const minDiff = Math.min(...diffs)
  const maxDiff = Math.max(...diffs)

  // add breathing space 
  const paddedMin = minDiff 
  const paddedMax = maxDiff 
  const diffRange = paddedMax - paddedMin

  const yStep = chartHeight / diffRange
  const yForDiff = (d: number) =>
    chartY + (paddedMax - d) * yStep

  /* -----------------------------
     SOFT BACKGROUND GRID
  ----------------------------- */
  doc.lineWidth(0.5).strokeColor("#E5E7EB")

  for (let d = paddedMin; d <= paddedMax; d++) {
    const y = yForDiff(d)
    doc.moveTo(chartX, y).lineTo(chartX + chartWidth, y).stroke()
  }

  /* -----------------------------
     CENTER (0) LINE
  ----------------------------- */
  if (paddedMin <= 0 && paddedMax >= 0) {
    const y0 = yForDiff(0)
    console.log(y0)
    doc
      .lineWidth(1)
      .strokeColor("#9CA3AF")
      .dash(4, { space: 4 })
      .moveTo(chartX, y0)
      .lineTo(chartX + chartWidth, y0)
      .stroke()
      .undash()
  }

  /* -----------------------------
     Y-AXIS LABELS (ONLY USED VALUES)
  ----------------------------- */
  doc.font("Helvetica", 8).fillColor("#374151")

  for (let d = paddedMin; d <= paddedMax; d++) {
    if (d === 0) continue
    if (!diffs.includes(d)) continue

    const y = yForDiff(d)

    const label =
      d > 0
        ? `${homeName} +${d}`
        : `${awayName} +${Math.abs(d)}`

    doc.text(label, chartX - padding.left + 10, y - 4, {
      width: padding.left - 20,
      align: "right"
    })
  }

  // zero label
  if (diffs.includes(0)) {
    doc.font("Helvetica-Bold", 8).text(
      "0",
      chartX - padding.left + 10,
      yForDiff(0) - 4,
      { width: padding.left - 20, align: "right" }
    )
  }

  /* -----------------------------
     X-AXIS (MINIMAL)
  ----------------------------- */
  doc.font("Helvetica", 8).fillColor("#6B7280")

  ;[0, 15, 30, 45, 60].forEach(min => {
    const x = chartX + (min / 60) * chartWidth
    doc.text(`${min}'`, x - 8, chartY + chartHeight + 10)
  })

  /* -----------------------------
     SCORE LINE (MODERN)
  ----------------------------- */
  doc
    .lineWidth(1)
    .strokeColor("#111827")
    .moveTo(
      chartX,
      yForDiff(scores[0].difference)
    )

  for (let minute = 1; minute <= 60; minute++) {
    const score = scores[minute]
    const x = chartX + (minute / 60) * chartWidth
    const y = yForDiff(score.difference)
    doc.lineTo(x, y)
  }

  doc.stroke()

  /* -----------------------------
     SUBTLE SCORE MARKERS
  ----------------------------- */
  doc.fillColor("#111827")

  for (let minute = 1; minute <= 60; minute++) {
    const score = scores[minute]
    if (score.difference === scores[minute - 1]?.difference) continue

    const x = chartX + (minute / 60) * chartWidth
    const y = yForDiff(score.difference)

    doc.circle(x, y, 2).fill()
  }

  doc.lineWidth(1).strokeColor("#000000")
}

// --------------------
// Draw chart page
// --------------------
export function drawScoreChartPage(
  doc: PDFKit.PDFDocument,
  scores: ScoreAtMinute[],
  homeName: string,
  awayName: string
): void {
  doc.addPage();
  const pageWidth = doc.page.width;  // margin
  const pageHeight = 200;

  drawScoreChart(doc, scores, doc.x, doc.y, pageWidth, pageHeight, homeName, awayName);

  doc.font("Helvetica", 8)
    .text(
      "Note: Positive values indicate home team lead, negative values indicate away team lead.",
      50,
      doc.page.height - 120,
      { width: doc.page.width - 100, align: "center" }
    );
}

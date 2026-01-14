import PDFDocument from 'pdfkit'
import { ATTACK_FIELD_POSITIONS, AttackDefenseStats, DEFENSE_FIELD_POSITIONS, ShootingStatsByPosition } from '~/shared/pdf/pdfShooting'
import { ShootingArea } from '~/types/handball'

export function drawHalfFieldAttackDefenseStats(
  doc: PDFKit.PDFDocument,
  fieldImagePath: string,
  stats: AttackDefenseStats,
  startX: number,
  startY: number,
  fieldWidth: number = 300
): void {
  const fieldHeight = fieldWidth * 0.7

  // TITLES
  doc.font('Helvetica-Bold').fontSize(12)

  doc.text('ATTACK', startX, startY - 20, {
    width: fieldWidth / 2,
    align: 'center'
  })

  doc.text('DEFENSE', startX + fieldWidth / 2, startY - 20, {
    width: fieldWidth / 2,
    align: 'center'
  })

  // FIELD IMAGE
  doc.image(fieldImagePath, startX, startY, {
    width: fieldWidth
  })

  // STATS
  drawSideStats(doc, stats.attack, stats.defense, startX, startY, fieldWidth, fieldHeight)
  
  doc.text('7M Penalties', startX, startY + 190, {
        lineBreak: false
      })
  doc.text(`${stats.attack['7M'].scored}/${stats.attack['7M'].total}`, startX+120, startY + 190, {
        lineBreak: false
      })
  doc.text('7M Penalties', startX + 150, startY + 190, {
        lineBreak: false
      })
  doc.text(`${stats.defense['7M'].scored}/${stats.defense['7M'].total}`, startX+270, startY + 190, {
        lineBreak: false
      })
}

/* ----------------------------------------
   DRAW ONE SIDE
---------------------------------------- */

function drawSideStats(
  doc: PDFKit.PDFDocument,
  attackStats: ShootingStatsByPosition,
  defenseStats: ShootingStatsByPosition,
  startX: number,
  startY: number,
  fieldWidth: number,
  fieldHeight: number,
): void {
  Object.entries(ATTACK_FIELD_POSITIONS).forEach(([position, rel]) => {
    const stat = attackStats[position as ShootingArea]
    if (!stat || stat.total === 0) return

    // CORRECT X MAPPING
    const relativeX = rel.x * 0.5

    const x = startX + relativeX * fieldWidth
    const y = startY + rel.y * fieldHeight

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111')
      .text(`${stat.scored}/${stat.total}`, x, y, {
        lineBreak: false
      })
    console.log(`${position}: ${stat.scored}/${stat.total}`)
  })
   Object.entries(DEFENSE_FIELD_POSITIONS).forEach(([position, rel]) => {
    const stat = defenseStats[position as ShootingArea]
    if (!stat || stat.total === 0) return

    // CORRECT X MAPPING
    const relativeX = 0.5 + rel.x * 0.5

    const x = startX + relativeX * fieldWidth
    const y = startY + rel.y * fieldHeight

    let yOffset = 0
    if (position === 'CB9') yOffset = -6
    if (position === 'CB6') yOffset = 4
    if (position === '7M') yOffset = 6
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111')
      .text(`${stat.scored}/${stat.total}`, x, y + yOffset, {
        lineBreak: false
      })
  })
}

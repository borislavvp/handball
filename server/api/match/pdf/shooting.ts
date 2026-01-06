import PDFDocument from 'pdfkit'
import { ShootingArea, Shot } from '~/types/handball'

/* ----------------------------------------
   TYPES
---------------------------------------- */

export interface PositionShotStats {
  scored: number
  total: number
}

export type ShootingStatsByPosition = Record<
  ShootingArea,
  PositionShotStats
>

export interface AttackDefenseStats {
  attack: ShootingStatsByPosition
  defense: ShootingStatsByPosition
}

/* ----------------------------------------
   FIELD RELATIVE POSITIONS (FULL FIELD)
---------------------------------------- */

const ATTACK_FIELD_POSITIONS: Partial<Record<
  ShootingArea,
  { x: number; y: number }
>> = {
  LW:   { x: 0.15, y: 0.10 },
  LB9:  { x: 0.50, y: 0.15 },
  LB6:  { x: 0.27, y: 0.18 },
  CB9:  { x: 0.60, y: 0.42 },
  CB6:  { x: 0.36, y: 0.47 },
  RB6:  { x: 0.30, y: 0.62 },
  RB9:  { x: 0.50, y: 0.65 },
  RW:   { x: 0.15, y: 0.72 },
  // '7M': { x: 0.36, y: 0.35 }
}
const DEFENSE_FIELD_POSITIONS: Partial<Record<
  ShootingArea,
  { x: number; y: number }
>> = {
  LW:   { x: 0.75, y: 0.10 },
  LB9:  { x: 0.35, y: 0.15 },
  LB6:  { x: 0.60, y: 0.18 },
  CB9:  { x: 0.25, y: 0.45 },
  CB6:  { x: 0.53, y: 0.47 },
  RB6:  { x: 0.60, y: 0.62 },
  RB9:  { x: 0.35, y: 0.65 },
  RW:   { x: 0.75, y: 0.72 },
  // '7M': { x: 0.53, y: 0.35 }
}

const ALL_POSITIONS: ShootingArea[] = [
  'LW',
  'LB9',
  'LB6',
  'CB9',
  'CB6',
  'RB6',
  'RB9',
  'RW',
  '7M'
]

/* ----------------------------------------
   STATS HELPERS
---------------------------------------- */

function emptyStats(): ShootingStatsByPosition {
  return ALL_POSITIONS.reduce((acc, pos) => {
    acc[pos] = { scored: 0, total: 0 }
    return acc
  }, {} as ShootingStatsByPosition)
}

/* ----------------------------------------
   COMPUTATION
---------------------------------------- */

export function computeAttackDefenseStatsByPosition(
  shots: Shot[]
): AttackDefenseStats {
  const attack = emptyStats()
  const defense = emptyStats()

  for (const shot of shots) {
    const position = shot.from as ShootingArea
    if (!ALL_POSITIONS.includes(position)) continue

    // ATTACK
    if (shot.result === 'goal' || shot.result === 'miss') {
      attack[position].total++
      if (shot.result === 'goal') {
        attack[position].scored++
      }
    }

    // DEFENSE (goalkeeper saves)
    if (shot.result === 'gksave' || shot.result === 'gkmiss') {
      defense[position].total++
      if (shot.result === 'gksave') {
        defense[position].scored++
      }
    }
  }

  return { attack, defense }
}

/* ----------------------------------------
   DRAW MAIN
---------------------------------------- */

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

import { drawEmoji, drawText, withAlpha, type Ctx } from '@/lib/puzzle/canvas2d'
import { targetsOf } from './generate'
import type { FindDrawOptions, FindPuzzle } from './types'

export interface AreaBox {
  x: number
  y: number
  w: number
  h: number
}

export interface FindLayout {
  gx: number
  gy: number
  cell: number
  headerH: number
  stripH: number
}

/** 标题条 + 目标清单条 + 正方形网格的排版结果，预览与点击命中共用 */
export function findLayout(box: AreaBox, size: number, showTitle: boolean): FindLayout {
  const headerH = showTitle ? box.h * 0.08 : 0
  const stripH = box.h * 0.12
  const areaTop = box.y + headerH + stripH
  const areaH = box.h - headerH - stripH
  const side = Math.min(box.w, areaH)
  return {
    gx: box.x + (box.w - side) / 2,
    gy: areaTop + (areaH - side) / 2,
    cell: side / size,
    headerH,
    stripH
  }
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2))
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** 画一整页「图形找找看」：标题 + 目标清单 + 网格 */
export function drawFindPage(
  ctx: Ctx,
  puzzle: FindPuzzle,
  box: AreaBox,
  opts: FindDrawOptions
): void {
  const L = findLayout(box, puzzle.size, opts.showTitle)

  if (opts.showTitle) {
    drawText(ctx, opts.title, box.x + box.w / 2, box.y + L.headerH / 2, box.w * 0.9, box.h * 0.042, opts.ink, 700)
  }

  // 目标清单
  const targets = targetsOf(puzzle)
  const solvedEmojis = new Set<string>()
  puzzle.runs.forEach((run, i) => {
    if (opts.showSolution || opts.foundRuns.has(i)) solvedEmojis.add(run.emoji)
  })
  const stripMidY = box.y + L.headerH + L.stripH / 2
  const emojiSize = Math.min(L.stripH * 0.5, box.w * 0.05)
  const gap = emojiSize * 1.5
  const startX = box.x + box.w / 2 - ((targets.length - 1) * gap) / 2
  drawText(ctx, '找出它们：', box.x + box.w * 0.06, stripMidY, box.w * 0.3, box.h * 0.028, opts.muted)
  targets.forEach((t, i) => {
    const cx = startX + i * gap
    drawEmoji(ctx, t.emoji, cx, stripMidY, emojiSize)
    drawText(
      ctx,
      t.label,
      cx,
      stripMidY + emojiSize * 0.78,
      gap * 0.98,
      emojiSize * 0.34,
      solvedEmojis.has(t.emoji) ? opts.accent : opts.muted
    )
  })

  // 网格
  const line = Math.max(1, L.cell * 0.05)
  const highlight = new Set<number>()
  puzzle.runs.forEach((run, i) => {
    if (opts.showSolution || opts.foundRuns.has(i)) for (const c of run.cells) highlight.add(c)
  })

  for (let i = 0; i < puzzle.cells.length; i++) {
    const r = Math.floor(i / puzzle.size)
    const c = i % puzzle.size
    const x = L.gx + c * L.cell
    const y = L.gy + r * L.cell
    const on = highlight.has(i)

    roundRect(ctx, x + line, y + line, L.cell - line * 2, L.cell - line * 2, L.cell * 0.14)
    ctx.fillStyle = on ? withAlpha(opts.accent, 0.26) : '#f6faf8'
    ctx.fill()
    ctx.strokeStyle = on ? opts.accent : withAlpha(opts.accent, 0.35)
    ctx.lineWidth = on ? line * 2 : line
    ctx.stroke()

    drawEmoji(ctx, puzzle.cells[i], x + L.cell / 2, y + L.cell / 2, L.cell * 0.62)
  }

  // 已找到 / 答案：把整条连线描出来
  if (highlight.size) {
    ctx.save()
    ctx.strokeStyle = opts.accent
    ctx.lineWidth = Math.max(2, L.cell * 0.14)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (let i = 0; i < puzzle.runs.length; i++) {
      const run = puzzle.runs[i]
      if (!opts.showSolution && !opts.foundRuns.has(i)) continue
      ctx.beginPath()
      run.cells.forEach((idx, k) => {
        const x = L.gx + (idx % puzzle.size) * L.cell + L.cell / 2
        const y = L.gy + Math.floor(idx / puzzle.size) * L.cell + L.cell / 2
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }
    ctx.restore()
  }
}

/** 画答案说明：列出每条连线的内容与方向 */
export function drawFindAnswerKey(ctx: Ctx, puzzle: FindPuzzle, box: AreaBox, opts: FindDrawOptions): void {
  drawText(ctx, '答案', box.x + box.w / 2, box.y + box.h * 0.06, box.w * 0.9, box.h * 0.05, opts.ink, 700)
  const rowH = box.h * 0.07
  puzzle.runs.forEach((run, i) => {
    const y = box.y + box.h * 0.16 + i * rowH
    const dirText = run.dir === 'h' ? '横向' : run.dir === 'v' ? '竖向' : '斜向'
    drawEmoji(ctx, run.emoji, box.x + box.w * 0.1, y, rowH * 0.5)
    drawText(
      ctx,
      `${run.label} · ${dirText} · ${run.cells.length} 连`,
      box.x + box.w * 0.18,
      y,
      box.w * 0.7,
      rowH * 0.4,
      opts.ink
    )
  })
}

/** 把画布坐标换算成格子下标，-1 表示没点中网格 */
export function hitFind(
  puzzle: FindPuzzle,
  box: AreaBox,
  showTitle: boolean,
  px: number,
  py: number
): number {
  const L = findLayout(box, puzzle.size, showTitle)
  const side = L.cell * puzzle.size
  if (px < L.gx || px >= L.gx + side || py < L.gy || py >= L.gy + side) return -1
  const c = Math.floor((px - L.gx) / L.cell)
  const r = Math.floor((py - L.gy) / L.cell)
  return r * puzzle.size + c
}
import { solutionPoints, wallSegments } from './geometry'
import { layoutFor, type MazeStyle } from './render'
import type { Maze } from './types'

/** 保留 2 位小数，尽量压缩 path 数据体积 */
function fmt(v: number): string {
  return String(Math.round(v * 100) / 100)
}

function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * 生成独立可用的矢量 SVG。
 * 全部墙体合并为单条 <path>，40×40 也只有几个节点，可直接导入 AI / Figma / 激光切割。
 */
export function renderSvg(maze: Maze, path: number[], style: MazeStyle): string {
  const { width, height, margin, cell } = layoutFor(maze, style)
  const cap = style.round ? 'round' : 'square'
  const join = style.round ? 'round' : 'miter'

  let walls = ''
  for (const s of wallSegments(maze)) {
    walls += `M${fmt(s.x1 * cell)} ${fmt(s.y1 * cell)}L${fmt(s.x2 * cell)} ${fmt(s.y2 * cell)}`
  }

  const parts: string[] = []
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  )
  parts.push(`<rect width="${width}" height="${height}" fill="${escapeAttr(style.bgColor)}"/>`)
  parts.push(
    `<g transform="translate(${fmt(margin)},${fmt(margin)})" fill="none" stroke="${escapeAttr(
      style.wallColor
    )}" stroke-width="${fmt(style.wallWidth)}" stroke-linecap="${cap}" stroke-linejoin="${join}"><path d="${walls}"/></g>`
  )

  if (style.showSolution && path.length) {
    const pts = solutionPoints(maze, path)
    let d = ''
    for (let i = 0; i < pts.length; i++) {
      d += `${i === 0 ? 'M' : 'L'}${fmt(pts[i].x * cell)} ${fmt(pts[i].y * cell)}`
    }
    parts.push(
      `<g transform="translate(${fmt(margin)},${fmt(margin)})" fill="none" stroke="${escapeAttr(
        style.solutionColor
      )}" stroke-width="${fmt(style.solutionWidth)}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></g>`
    )
  }

  if (style.markers) {
    const r = fmt(cell * 0.26)
    const sx = fmt((maze.start.c + 0.5) * cell)
    const sy = fmt((maze.start.r + 0.5) * cell)
    const ex = fmt((maze.end.c + 0.5) * cell)
    const ey = fmt((maze.end.r + 0.5) * cell)
    parts.push(
      `<g transform="translate(${fmt(margin)},${fmt(margin)})">` +
        `<circle cx="${sx}" cy="${sy}" r="${r}" fill="${escapeAttr(style.startColor)}"/>` +
        `<circle cx="${ex}" cy="${ey}" r="${r}" fill="${escapeAttr(style.endColor)}"/>` +
        `</g>`
    )
  }

  parts.push('</svg>')
  return parts.join('\n')
}

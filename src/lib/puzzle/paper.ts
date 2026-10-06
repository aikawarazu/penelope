/** 纸张尺寸与「把内容铺进可打印区域」的换算 */

export type PaperId = 'A4' | 'Letter' | 'A3'
export type OrientationId = 'auto' | 'portrait' | 'landscape'

export interface Paper {
  id: PaperId
  label: string
  /** [宽 mm, 高 mm]（纵向） */
  mm: [number, number]
}

export const PAPERS: readonly Paper[] = [
  { id: 'A4', label: 'A4', mm: [210, 297] },
  { id: 'Letter', label: 'Letter', mm: [215.9, 279.4] },
  { id: 'A3', label: 'A3', mm: [297, 420] }
]

/** 导出用分辨率：300 DPI */
export const EXPORT_DPI = 300

export const PX_PER_MM = EXPORT_DPI / 25.4

export function getPaper(id: PaperId): Paper {
  return PAPERS.find((p) => p.id === id) ?? PAPERS[0]
}

/**
 * 按内容宽高比决定页面方向。
 * auto：内容比页面「更横」就用横向。
 */
export function resolvePage(
  paper: PaperId,
  orientation: OrientationId,
  contentW: number,
  contentH: number
): [number, number] {
  const p = getPaper(paper).mm
  const landscape = orientation === 'landscape' || (orientation === 'auto' && contentW > contentH)
  return landscape ? [p[1], p[0]] : [p[0], p[1]]
}

/** 内容区（去边距）的毫米尺寸 */
export function printableMm(pageMm: [number, number], marginMm: number): [number, number] {
  return [Math.max(1, pageMm[0] - marginMm * 2), Math.max(1, pageMm[1] - marginMm * 2)]
}

/** 内容区的像素尺寸（画布按此尺寸创建，嵌入 PDF 时正好 1:1） */
export function printablePx(
  pageMm: [number, number],
  marginMm: number,
  dpi = EXPORT_DPI
): { width: number; height: number } {
  const [wMm, hMm] = printableMm(pageMm, marginMm)
  const pxPerMm = dpi / 25.4
  return { width: Math.round(wMm * pxPerMm), height: Math.round(hMm * pxPerMm) }
}

export interface FittedGrid {
  /** 每格边长（px） */
  cell: number
  /** 画布留白（px） */
  margin: number
  width: number
  height: number
}

/** 把 cols×rows 的内容等比铺进 pageMm 的可打印区域 */
export function fitGridToPage(
  pageMm: [number, number],
  cols: number,
  rows: number,
  marginMm = 10,
  dpi = EXPORT_DPI
): FittedGrid {
  const [boxWmm, boxHmm] = printableMm(pageMm, marginMm)
  const pxPerMm = dpi / 25.4
  const boxW = boxWmm * pxPerMm
  const boxH = boxHmm * pxPerMm
  const cell = Math.max(3, Math.floor(Math.min(boxW / cols, boxH / rows)))
  const width = cols * cell
  const height = rows * cell
  const margin = Math.max(2, Math.floor(Math.min((boxW - width) / 2, (boxH - height) / 2)))
  return { cell, margin, width: width + margin * 2, height: height + margin * 2 }
}
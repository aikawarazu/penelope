import { buildPdf, type PdfImagePage } from './pdf'
import { createCanvas, drawMaze, layoutFor, makeStyle, type StyleInput } from './render'
import { renderSvg } from './renderSvg'
import { PAPERS, type Maze, type OrientationId, type PaperId } from './types'

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('画布导出失败'))),
      type,
      quality
    )
  })
}

async function canvasToJpegBytes(canvas: HTMLCanvasElement, quality = 0.92): Promise<Uint8Array> {
  const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  return new Uint8Array(await blob.arrayBuffer())
}

function cellForTarget(maze: Maze, targetPx: number): number {
  const longest = Math.max(maze.cols, maze.rows)
  return Math.max(4, Math.floor(targetPx / (longest + 1)))
}

export function mazeFileName(maze: Maze, seed: number, ext: string): string {
  return `maze-${maze.cols}x${maze.rows}-${seed}.${ext}`
}

/* ------------------------------- SVG ------------------------------- */

export function exportSvg(maze: Maze, path: number[], input: StyleInput): Blob {
  const style = makeStyle({ ...input, cell: cellForTarget(maze, 1600) })
  const svg = renderSvg(maze, path, style)
  return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
}

/* ------------------------------- PNG ------------------------------- */

export async function exportPng(
  maze: Maze,
  path: number[],
  input: StyleInput,
  targetPx = 2400
): Promise<Blob> {
  const style = makeStyle({ ...input, cell: cellForTarget(maze, targetPx) })
  const { width, height } = layoutFor(maze, style)
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布上下文')
  drawMaze(ctx, maze, path, style)
  return canvasToBlob(canvas, 'image/png')
}

/* ------------------------------- PDF ------------------------------- */

export interface PdfOptions {
  paper: PaperId
  orientation: OrientationId
  /** 页边距（mm） */
  marginMm?: number
}

/** 300 DPI 下把迷宫铺满可打印区域 */
function cellForPaper(maze: Maze, pageMm: [number, number], marginMm: number): number {
  const pxPerMm = 300 / 25.4
  const boxW = Math.max(1, pageMm[0] - marginMm * 2)
  const boxH = Math.max(1, pageMm[1] - marginMm * 2)
  const cellMm = Math.min(boxW / maze.cols, boxH / maze.rows)
  return Math.max(4, Math.floor(cellMm * pxPerMm))
}

export async function exportPdf(
  maze: Maze,
  path: number[],
  input: StyleInput,
  options: PdfOptions
): Promise<Blob> {
  const paper = PAPERS.find((p) => p.id === options.paper) ?? PAPERS[0]
  const landscape =
    options.orientation === 'landscape' ||
    (options.orientation === 'auto' && maze.cols > maze.rows)
  const pageMm: [number, number] = landscape ? [paper.mm[1], paper.mm[0]] : [paper.mm[0], paper.mm[1]]
  const marginMm = options.marginMm ?? 12

  const cell = cellForPaper(maze, pageMm, marginMm)
  const base = { ...input, cell }

  const render = async (showSolution: boolean): Promise<PdfImagePage> => {
    const style = makeStyle({ ...base, showSolution })
    const { width, height } = layoutFor(maze, style)
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建画布上下文')
    drawMaze(ctx, maze, path, style)
    return { bytes: await canvasToJpegBytes(canvas), width: canvas.width, height: canvas.height }
  }

  const pages: PdfImagePage[] = [await render(false), await render(true)]
  return buildPdf(pages, pageMm, marginMm)
}

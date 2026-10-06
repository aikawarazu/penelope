/** 浏览器端下载与画布导出工具 */

import { buildPdf } from './pdf'

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

export function downloadText(text: string, filename: string, mime = 'image/svg+xml;charset=utf-8'): void {
  downloadBlob(new Blob([text], { type: mime }), filename)
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.ceil(width))
  canvas.height = Math.max(1, Math.ceil(height))
  return canvas
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
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

export async function canvasToJpegBytes(
  canvas: HTMLCanvasElement,
  quality = 0.92
): Promise<Uint8Array> {
  const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  return new Uint8Array(await blob.arrayBuffer())
}

/**
 * 把若干张画布合并成多页 PDF。
 * 画布会被等比缩放并居中放到每页的可打印区域内。
 */
export async function canvasesToPdf(
  canvases: HTMLCanvasElement[],
  pageMm: [number, number],
  marginMm = 0
): Promise<Blob> {
  const pages = await Promise.all(
    canvases.map(async (c) => ({
      bytes: await canvasToJpegBytes(c),
      width: c.width,
      height: c.height
    }))
  )
  return buildPdf(pages, pageMm, marginMm)
}
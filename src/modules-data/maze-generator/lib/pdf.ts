/**
 * 极简 PDF 写入器：不依赖任何第三方库。
 * 每页就是一张 JPEG（/Filter /DCTDecode），直接嵌进 Image XObject。
 * 足以输出「第 1 页题目 + 第 2 页答案」的打印稿。
 */

export interface PdfImagePage {
  bytes: Uint8Array
  width: number
  height: number
}

const encoder = new TextEncoder()

function num(v: number): string {
  return String(Math.round(v * 100) / 100)
}

export function buildPdf(pages: PdfImagePage[], pageMm: [number, number], marginMm: number): Blob {
  const mmToPt = 72 / 25.4
  const pageW = pageMm[0] * mmToPt
  const pageH = pageMm[1] * mmToPt
  const boxW = Math.max(1, (pageMm[0] - marginMm * 2) * mmToPt)
  const boxH = Math.max(1, (pageMm[1] - marginMm * 2) * mmToPt)

  const chunks: Uint8Array[] = []
  let offset = 0

  const push = (data: string | Uint8Array) => {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data
    chunks.push(bytes)
    offset += bytes.length
  }

  push('%PDF-1.4\n')
  // 二进制标记，提示下游工具这是含二进制流的文件
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]))

  const objectOffsets: number[] = []
  const count = Math.max(1, pages.length)
  const pageNums = pages.map((_, i) => 3 + i * 3)

  const begin = (objNum: number, body: string) => {
    objectOffsets[objNum] = offset
    push(`${objNum} 0 obj\n${body}\nendobj\n`)
  }

  begin(1, '<< /Type /Catalog /Pages 2 0 R >>')
  begin(
    2,
    `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageNums.length} >>`
  )

  pages.forEach((page, i) => {
    const pageNum = pageNums[i]
    const contentNum = pageNum + 1
    const imageNum = pageNum + 2

    const scale = Math.min(boxW / page.width, boxH / page.height)
    const dw = page.width * scale
    const dh = page.height * scale
    const x = (pageW - dw) / 2
    const y = (pageH - dh) / 2
    const content = `q\n${num(dw)} 0 0 ${num(dh)} ${num(x)} ${num(y)} cm\n/Im0 Do\nQ\n`

    begin(
      pageNum,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(pageW)} ${num(pageH)}] ` +
        `/Resources << /XObject << /Im0 ${imageNum} 0 R >> >> /Contents ${contentNum} 0 R >>`
    )

    objectOffsets[contentNum] = offset
    push(`${contentNum} 0 obj\n<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream\nendobj\n`)

    objectOffsets[imageNum] = offset
    push(
      `${imageNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`
    )
    push(page.bytes)
    push('\nendstream\nendobj\n')
  })

  const size = 2 + count * 3 + 1
  const xrefOffset = offset
  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`
  for (let i = 1; i < size; i++) {
    xref += `${String(objectOffsets[i] ?? 0).padStart(10, '0')} 00000 n \n`
  }
  push(xref)
  push(`trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

  return new Blob(chunks, { type: 'application/pdf' })
}

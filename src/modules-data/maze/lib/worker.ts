import { generateMaze, type MazeOptions, type MazeResult } from './generate'

interface WorkerScope {
  onmessage: ((event: MessageEvent) => void) | null
  postMessage(data: unknown, transfer?: Transferable[]): void
}

const ctx = self as unknown as WorkerScope

ctx.onmessage = (event: MessageEvent) => {
  const options = event.data as MazeOptions
  const result: MazeResult = generateMaze(options)
  ctx.postMessage(result, [result.maze.walls.buffer])
}

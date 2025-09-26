import { buildWorkflow } from './workflow'
import type { GenerationResult, GeneratedImage } from '../types/generation'
import type { WorkflowConfig } from '../config/workflow'

const DEFAULT_TIMEOUT = 5 * 60 * 1000
const POLL_INTERVAL = 2000

type GenerateParams = {
  baseUrl: string
  prompt: string
  negativePrompt?: string
  width?: number
  height?: number
  seed?: number
  steps?: number
  workflowConfig?: WorkflowConfig
  signal?: AbortSignal
}

interface QueueResponse {
  prompt_id: string
  number: number
}

interface ComfyHistoryImage {
  filename: string
  subfolder?: string
  type?: string
}

interface ComfyHistoryEntry {
  outputs?: Record<string, { images?: ComfyHistoryImage[] }>
}

export async function generateImage({
  baseUrl,
  prompt,
  negativePrompt,
  width,
  height,
  seed,
  steps,
  workflowConfig,
  signal,
}: GenerateParams): Promise<GenerationResult> {
  if (!baseUrl) {
    throw new Error('Vui lòng nhập URL ComfyUI worker hợp lệ.')
  }

  const controller = new AbortController()
  const combinedSignal = signal
    ? new AbortSignalMerger([signal, controller.signal]).signal
    : controller.signal

  const workflow = await buildWorkflow(
    { prompt, negativePrompt, width, height, seed, steps },
    workflowConfig,
  )

  const clientId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  const queued = await queuePrompt(baseUrl, workflow, clientId, combinedSignal)
  const history = await waitForHistory(baseUrl, queued.prompt_id, combinedSignal)
  const images = extractImages(baseUrl, history)

  if (!images.length) {
    throw new Error('Không tìm thấy ảnh đầu ra trong kết quả từ ComfyUI.')
  }

  controller.abort()

  return {
    promptId: queued.prompt_id,
    images,
    rawHistory: history,
  }
}

async function queuePrompt(
  baseUrl: string,
  workflow: unknown,
  clientId: string,
  signal?: AbortSignal,
): Promise<QueueResponse> {
  const response = await fetch(`${baseUrl}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
    signal,
  })

  if (!response.ok) {
    const errorBody = await safeRead(response)
    throw new Error(`Không thể gửi prompt tới ComfyUI (${response.status}): ${errorBody}`)
  }

  return response.json()
}

async function waitForHistory(baseUrl: string, promptId: string, signal?: AbortSignal) {
  const start = Date.now()

  while (Date.now() - start < DEFAULT_TIMEOUT) {
    const response = await fetch(`${baseUrl}/history/${promptId}`, { signal })

    if (response.status === 404) {
      await sleep()
      continue
    }

    if (!response.ok) {
      const errorBody = await safeRead(response)
      throw new Error(`Không thể lấy lịch sử job (${response.status}): ${errorBody}`)
    }

    const payload = await response.json()
    const entry: ComfyHistoryEntry | undefined = payload[promptId]

    if (entry && entry.outputs) {
      return entry
    }

    await sleep()
  }

  throw new Error('Job mất quá nhiều thời gian. Vui lòng thử lại hoặc kiểm tra worker.')
}

function extractImages(baseUrl: string, history: ComfyHistoryEntry): GeneratedImage[] {
  const images: GeneratedImage[] = []

  for (const node of Object.values(history.outputs ?? {})) {
    for (const image of node.images ?? []) {
      const params = new URLSearchParams({
        filename: image.filename,
        type: image.type ?? 'output',
      })

      if (image.subfolder) {
        params.append('subfolder', image.subfolder)
      }

      images.push({
        url: `${baseUrl}/view?${params.toString()}`,
        filename: image.filename,
        subfolder: image.subfolder,
        type: image.type,
      })
    }
  }

  return images
}

async function safeRead(response: Response) {
  try {
    return await response.text()
  } catch (error) {
    console.error('Không thể đọc nội dung lỗi từ ComfyUI', error)
    return ''
  }
}

function sleep(duration = POLL_INTERVAL) {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

class AbortSignalMerger {
  private controller: AbortController

  signal: AbortSignal

  constructor(signals: AbortSignal[]) {
    this.controller = new AbortController()
    this.signal = this.controller.signal

    const onAbort = () => this.controller.abort()

    for (const sig of signals) {
      if (sig.aborted) {
        this.controller.abort()
        return
      }

      sig.addEventListener('abort', onAbort, { once: true })
    }
  }
}

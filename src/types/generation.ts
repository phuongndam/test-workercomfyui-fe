export interface GeneratedImage {
  url: string
  filename: string
  subfolder?: string
  type?: string
}

export interface GenerationResult {
  promptId: string
  images: GeneratedImage[]
  rawHistory?: unknown
}

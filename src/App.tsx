import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { SERVER_PRESETS } from './config/servers'
import { defaultWorkflowConfig } from './config/workflow'
import { AdvancedOptions } from './components/AdvancedOptions'
import { ImagePreview } from './components/ImagePreview'
import { ServerSelect } from './components/ServerSelect'
import { StatusBadge } from './components/StatusBadge'
import { generateImage } from './lib/api'
import type { GeneratedImage } from './types/generation'

type Status = 'idle' | 'loading' | 'error' | 'success'

function App() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [steps, setSteps] = useState(30)
  const [seed, setSeed] = useState<number | ''>('')
  const [selectedServer, setSelectedServer] = useState(SERVER_PRESETS[0].id)
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [promptId, setPromptId] = useState<string | null>(null)

  const activePreset = useMemo(
    () => SERVER_PRESETS.find((preset) => preset.id === selectedServer) ?? SERVER_PRESETS[0],
    [selectedServer],
  )

  const baseUrl = useMemo(() => {
    if (activePreset.requiresBaseUrlInput || selectedServer === 'custom') {
      return customBaseUrl.trim()
    }

    return activePreset.baseUrl
  }, [activePreset, customBaseUrl, selectedServer])

  const canSubmit = prompt.trim().length > 0 && !!baseUrl

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      setStatus('error')
      setStatusMessage('Vui lòng nhập prompt và URL hợp lệ.')
      return
    }

    try {
      setStatus('loading')
      setStatusMessage('Đang gửi prompt tới ComfyUI...')
      setImages([])
      setPromptId(null)
      const result = await generateImage({
        baseUrl,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        width,
        height,
        seed: seed === '' ? undefined : Number(seed),
        steps,
        workflowConfig: defaultWorkflowConfig,
      })

      setImages(result.images)
      setPromptId(result.promptId)
      setStatus('success')
      setStatusMessage('Hoàn tất! Ảnh đã sẵn sàng bên dưới.')
    } catch (error) {
      console.error(error)
      setStatus('error')
      setStatusMessage(error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định.')
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="icon">🖼️</div>
        <h1>Image</h1>
        <p>Mô tả bức ảnh bạn muốn tạo và nhấn Generate để gửi đến ComfyUI.</p>
      </header>

      <form className="prompt-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            rows={3}
            placeholder="Describe an image and click generate..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <button type="submit" disabled={!canSubmit || status === 'loading'}>
            {status === 'loading' ? 'Generating…' : 'Generate'}
          </button>
        </div>

        <label className="field-label" htmlFor="negative-prompt">
          Negative prompt (tuỳ chọn)
        </label>
        <textarea
          id="negative-prompt"
          rows={2}
          placeholder="Các chi tiết muốn loại bỏ..."
          value={negativePrompt}
          onChange={(event) => setNegativePrompt(event.target.value)}
        />

        <details className="advanced-toggle">
          <summary>Advanced options</summary>
          <AdvancedOptions
            width={width}
            height={height}
            steps={steps}
            seed={seed}
            onWidthChange={(event) => setWidth(Number(event.target.value))}
            onHeightChange={(event) => setHeight(Number(event.target.value))}
            onStepsChange={(event) => setSteps(Number(event.target.value))}
            onSeedChange={(event) => setSeed(event.target.value === '' ? '' : Number(event.target.value))}
          />
        </details>

        <ServerSelect
          presets={SERVER_PRESETS}
          selectedId={selectedServer}
          onChange={(event) => setSelectedServer(event.target.value)}
          customBaseUrl={customBaseUrl}
          onCustomBaseUrlChange={(event) => setCustomBaseUrl(event.target.value)}
          requiresCustomUrl={!activePreset.baseUrl}
        />
      </form>

      <StatusBadge status={status} message={statusMessage} />

      {promptId ? <p className="prompt-id">Prompt ID: {promptId}</p> : null}

      <ImagePreview images={images} />
    </div>
  )
}

export default App

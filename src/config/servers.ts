export interface ServerPreset {
  id: string
  label: string
  baseUrl: string
  description?: string
  requiresBaseUrlInput?: boolean
}

export const SERVER_PRESETS: ServerPreset[] = [
  {
    id: 'local',
    label: 'Local Docker Worker',
    baseUrl: 'http://127.0.0.1:8188',
    description: 'Connects to a ComfyUI worker exposed from your local Docker container.',
  },
  {
    id: 'runpod',
    label: 'RunPod Serverless',
    baseUrl: '',
    description:
      'Use this preset when the ComfyUI worker is deployed on RunPod serverless. Paste the public endpoint URL.',
    requiresBaseUrlInput: true,
  },
  {
    id: 'custom',
    label: 'Custom URL',
    baseUrl: '',
    description: 'Manually provide a ComfyUI endpoint URL.',
    requiresBaseUrlInput: true,
  },
]

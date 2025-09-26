import type { ChangeEventHandler } from 'react'
import type { ServerPreset } from '../config/servers'

interface Props {
  presets: ServerPreset[]
  selectedId: string
  onChange: ChangeEventHandler<HTMLSelectElement>
  customBaseUrl: string
  onCustomBaseUrlChange: ChangeEventHandler<HTMLInputElement>
  requiresCustomUrl: boolean
}

export function ServerSelect({
  presets,
  selectedId,
  onChange,
  customBaseUrl,
  onCustomBaseUrlChange,
  requiresCustomUrl,
}: Props) {
  const activePreset = presets.find((preset) => preset.id === selectedId)

  return (
    <div className="server-select">
      <label className="field-label" htmlFor="server-select">
        Worker endpoint
      </label>
      <select id="server-select" value={selectedId} onChange={onChange}>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
      {activePreset?.description ? (
        <p className="helper-text">{activePreset.description}</p>
      ) : null}
      {(requiresCustomUrl || activePreset?.requiresBaseUrlInput) && (
        <div className="custom-url-field">
          <input
            type="url"
            placeholder="https://your-comfy-endpoint"
            value={customBaseUrl}
            onChange={onCustomBaseUrlChange}
            required
          />
        </div>
      )}
    </div>
  )
}

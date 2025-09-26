import type { ChangeEventHandler } from 'react'

interface Props {
  width: number
  height: number
  steps: number
  seed: number | ''
  onWidthChange: ChangeEventHandler<HTMLInputElement>
  onHeightChange: ChangeEventHandler<HTMLInputElement>
  onStepsChange: ChangeEventHandler<HTMLInputElement>
  onSeedChange: ChangeEventHandler<HTMLInputElement>
}

export function AdvancedOptions({
  width,
  height,
  steps,
  seed,
  onWidthChange,
  onHeightChange,
  onStepsChange,
  onSeedChange,
}: Props) {
  return (
    <div className="advanced-panel">
      <div className="field-group">
        <label>
          Width
          <input type="number" value={width} min={64} max={4096} step={64} onChange={onWidthChange} />
        </label>
        <label>
          Height
          <input type="number" value={height} min={64} max={4096} step={64} onChange={onHeightChange} />
        </label>
      </div>
      <div className="field-group">
        <label>
          Steps
          <input type="number" value={steps} min={1} max={100} onChange={onStepsChange} />
        </label>
        <label>
          Seed
          <input
            type="number"
            value={seed}
            placeholder="Random"
            onChange={onSeedChange}
            min={0}
          />
        </label>
      </div>
    </div>
  )
}

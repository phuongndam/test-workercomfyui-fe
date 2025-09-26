interface Props {
  status: 'idle' | 'loading' | 'error' | 'success'
  message?: string
}

export function StatusBadge({ status, message }: Props) {
  if (status === 'idle') {
    return null
  }

  return (
    <div className={`status-badge status-${status}`}>
      <span>{message}</span>
    </div>
  )
}

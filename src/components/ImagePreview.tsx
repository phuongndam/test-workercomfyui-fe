import type { GeneratedImage } from '../types/generation'

interface Props {
  images: GeneratedImage[]
}

export function ImagePreview({ images }: Props) {
  if (!images.length) {
    return null
  }

  return (
    <div className="image-grid">
      {images.map((image) => (
        <figure key={image.url} className="image-card">
          <img src={image.url} alt={image.filename} loading="lazy" />
          <figcaption>{image.filename}</figcaption>
        </figure>
      ))}
    </div>
  )
}

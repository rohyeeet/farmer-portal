'use client'

type BrandMarkProps = {
  size?: number
  className?: string
  title?: string
}

/**
 * Varaha leaf mark — a single elegant leaf with a midrib.
 * Used in the brand chip on screen headers and as the document-viewer stamp.
 * The previous radial six-petal variant rendered as an asterisk-looking
 * speck at small sizes, so it was replaced with this calmer leaf silhouette.
 */
export function BrandMark({ size = 18, className, title = 'Varaha' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={className}
      fill="none"
    >
      <title>{title}</title>
      {/* Leaf body */}
      <path
        d="M5.5 18.5C5.5 11.5 11 6 18.5 5.5C18 13 12.5 18.5 5.5 18.5Z"
        fill="currentColor"
      />
      {/* Midrib */}
      <path
        d="M5.5 18.5L18.5 5.5"
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

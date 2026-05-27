'use client'

import Image from 'next/image'

const FALLBACK_INITIAL = 'F'

export function ProfileAvatar({
  src,
  name,
  size = 80,
  className = '',
}: {
  src: string | null | undefined
  name?: string
  size?: number
  className?: string
}) {
  const initial = (name?.trim()?.[0] ?? FALLBACK_INITIAL).toUpperCase()

  if (src?.trim()) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={`fp-avatar fp-avatar--img ${className}`.trim()}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
        unoptimized
      />
    )
  }

  return (
    <span
      className={`fp-avatar fp-avatar--fallback ${className}`.trim()}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initial}
    </span>
  )
}

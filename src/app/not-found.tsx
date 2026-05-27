import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Page not found</h1>
      <p>
        <Link href="/">Return home</Link>
      </p>
    </div>
  )
}

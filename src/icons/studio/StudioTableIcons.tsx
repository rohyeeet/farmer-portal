/**
 * Same SVG assets as Studio `app/atoms/icons/index.tsx` for table toolbar parity
 * (SearchIcon, IconCalender). Filter trigger uses lucide `FunnelPlus`; columns uses `Columns3Cog`.
 */

import type { SVGProps } from 'react'

type SvgProps = SVGProps<SVGSVGElement>

export function StudioSearchIcon(props: SvgProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M22 22L20 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

/** Studio `IconCalender` — filled calendar used on the date range trigger */
export function StudioCalendarIcon(props: SvgProps) {
  return (
    <svg fill="currentColor" height="1.5em" viewBox="0 0 24 24" width="1.5em" {...props}>
      <path d="M19.5 4h-3V2.5a.5.5 0 00-1 0V4h-7V2.5a.5.5 0 00-1 0V4h-3A2.503 2.503 0 002 6.5v13A2.503 2.503 0 004.5 22h15a2.502 2.502 0 002.5-2.5v-13A2.502 2.502 0 0019.5 4zM21 19.5c0 .828-.672 1.5-1.5 1.5h-15C3.67 21 3 20.328 3 19.5V11h18v8.5zm0-9.5H3V6.5C3 5.672 3.67 5 4.5 5h3v1.5a.5.5 0 001 0V5h7v1.5a.5.5 0 001 0V5h3c.828 0 1.5.672 1.5 1.5V10z" />
    </svg>
  )
}

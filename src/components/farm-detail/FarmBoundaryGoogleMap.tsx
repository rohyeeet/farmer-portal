'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import type { FarmBoundaryGeometry } from '../../types/farm.api'
import { getGoogleMapApiKey, getGoogleMapId } from '../../config/env'

type LatLng = { lat: number; lng: number }
type LatLngBoundsLiteral = { east: number; north: number; south: number; west: number }
type LatLngBoundsInput = LatLngBoundsLike | LatLngBoundsLiteral
type LatLngBoundsLike = {
  contains: (latLng: LatLng) => boolean
  equals: (other: LatLngBoundsInput | null) => boolean
  extend: (point: LatLng) => LatLngBoundsLike
  getCenter: () => LatLng
  getNorthEast: () => LatLng
  getSouthWest: () => LatLng
  intersects: (other: LatLngBoundsInput) => boolean
  isEmpty: () => boolean
  toJSON: () => LatLngBoundsLiteral
  toSpan: () => LatLng
  toUrlValue: (precision?: number) => string
  union: (other: LatLngBoundsInput) => LatLngBoundsLike
}
type MapInstance = NonNullable<ReturnType<typeof useMap>>
type FitBoundsArg = Parameters<MapInstance['fitBounds']>[0]
type GoogleMapsApi = {
  LatLngBounds: new () => LatLngBoundsLike
  Polygon: new (opts: {
    paths: LatLng[]
    strokeColor: string
    strokeOpacity: number
    strokeWeight: number
    fillColor: string
    fillOpacity: number
  }) => { setMap: (map: unknown) => void }
}

function toLatLngRing(ring: number[][]): LatLng[] {
  return ring
    .map((point) => {
      if (!Array.isArray(point) || point.length < 2) return null
      const lng = Number(point[0])
      const lat = Number(point[1])
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return { lat, lng }
    })
    .filter((point): point is LatLng => point != null)
}

function toBoundaryRings(boundary: FarmBoundaryGeometry): LatLng[][] {
  if (boundary.type === 'Polygon') {
    const polygonCoordinates = boundary.coordinates as number[][][]
    const ring = Array.isArray(polygonCoordinates[0]) ? toLatLngRing(polygonCoordinates[0]) : []
    return ring.length >= 3 ? [ring] : []
  }

  const polygons = boundary.coordinates as number[][][][]
  return polygons
    .map((polygon) => (Array.isArray(polygon[0]) ? toLatLngRing(polygon[0]) : []))
    .filter((ring) => ring.length >= 3)
}

function BoundaryOverlay({ rings }: { rings: LatLng[][] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || rings.length === 0) return
    const gmaps = (window as Window & { google?: { maps?: unknown } }).google?.maps as
      | GoogleMapsApi
      | undefined
    if (!gmaps) return

    const polygons: Array<{ setMap: (m: unknown) => void }> = []
    const bounds = new gmaps.LatLngBounds()

    for (const ring of rings) {
      ring.forEach((p) => bounds.extend(p))
      const polygon = new gmaps.Polygon({
        paths: ring,
        strokeColor: '#EC0909',
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: '#F00000',
        fillOpacity: 0.25,
      })
      polygon.setMap(map)
      polygons.push(polygon)
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds as unknown as FitBoundsArg, 36)
    }

    return () => {
      polygons.forEach((polygon) => polygon.setMap(null))
    }
  }, [map, rings])

  return null
}

const fallbackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, #1f3a2a 0%, #143324 60%, #0d2618 100%)',
  color: '#e6f5ec',
  textAlign: 'center',
  padding: '1.25rem',
}

const mapStyle: CSSProperties = { width: '100%', height: '100%' }

export function FarmBoundaryGoogleMap({ boundary }: { boundary: FarmBoundaryGeometry }) {
  const apiKey = getGoogleMapApiKey()
  const mapId = getGoogleMapId()
  const rings = useMemo(() => toBoundaryRings(boundary), [boundary])
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    if (!apiKey) return
    const prev = (window as Window & { gm_authFailure?: () => void }).gm_authFailure
    ;(window as Window & { gm_authFailure?: () => void }).gm_authFailure = () => {
      setAuthError(true)
      prev?.()
    }
    return () => {
      ;(window as Window & { gm_authFailure?: () => void }).gm_authFailure = prev
    }
  }, [apiKey])

  if (!apiKey) {
    return (
      <div className="fp-farm-hero__svg" aria-hidden style={fallbackStyle}>
        <span style={{ fontWeight: 800, letterSpacing: '0.06em' }}>FARM BOUNDARY</span>
        {process.env.NODE_ENV !== 'production' ? (
          <span style={{ marginTop: 8, fontSize: '0.75rem', opacity: 0.85 }}>
            Set NEXT_PUBLIC_GOOGLE_MAP_API_KEY in .env.local to render the map.
          </span>
        ) : null}
      </div>
    )
  }

  if (rings.length === 0) {
    return (
      <div className="fp-farm-hero__svg" aria-hidden style={fallbackStyle}>
        <span style={{ fontWeight: 800, letterSpacing: '0.06em' }}>BOUNDARY UNAVAILABLE</span>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="fp-farm-hero__svg" aria-hidden style={fallbackStyle}>
        <span style={{ fontWeight: 800, letterSpacing: '0.06em' }}>MAP UNAVAILABLE</span>
        {process.env.NODE_ENV !== 'production' ? (
          <span style={{ marginTop: 8, fontSize: '0.75rem', opacity: 0.85, maxWidth: '16rem' }}>
            Google Maps rejected this API key (billing, referrer restriction, or Maps JavaScript API
            not enabled). Check Google Cloud Console.
          </span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="farm-detail__map-canvas">
      <APIProvider apiKey={apiKey}>
        <Map
          style={mapStyle}
          mapTypeId="hybrid"
          {...(mapId ? { mapId } : {})}
          defaultCenter={rings[0][0]}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={true}
        >
          <BoundaryOverlay rings={rings} />
        </Map>
      </APIProvider>
    </div>
  )
}

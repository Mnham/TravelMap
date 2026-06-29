import maplibregl from 'maplibre-gl'
import type {
  CountryFeature,
  CountryGeometryCoordinates,
  GeoJsonPosition,
} from '../countries/countryTypes'
import type { LngLatBounds } from 'maplibre-gl'

export function getFeatureBounds(features: CountryFeature[]): LngLatBounds {
  const positions: GeoJsonPosition[] = []
  for (const feature of features) {
    collectPositions(positions, feature.geometry.coordinates)
  }

  if (!positions.length) {
    return new maplibregl.LngLatBounds()
  }

  const { east, west } = getShortestLongitudeRange(positions)
  const latitudes = positions.map((position) => position[1])

  return new maplibregl.LngLatBounds(
    [west, Math.min(...latitudes)],
    [east, Math.max(...latitudes)],
  )
}

function collectPositions(positions: GeoJsonPosition[], coordinates: CountryGeometryCoordinates): void {
  if (isGeoJsonPosition(coordinates)) {
    positions.push(coordinates)
    return
  }

  for (const coordinate of coordinates) {
    collectPositions(positions, coordinate)
  }
}

function getShortestLongitudeRange(positions: GeoJsonPosition[]): { east: number, west: number } {
  const longitudes = positions
    .map((position) => normalizeLongitudeTo360(position[0]))
    .sort((left, right) => left - right)
  let largestGap = -1
  let largestGapStartIndex = 0

  for (let index = 0; index < longitudes.length; index += 1) {
    const current = longitudes[index]
    const next = longitudes[(index + 1) % longitudes.length] + (index === longitudes.length - 1 ? 360 : 0)
    const gap = next - current

    if (gap > largestGap) {
      largestGap = gap
      largestGapStartIndex = index
    }
  }

  const westIndex = (largestGapStartIndex + 1) % longitudes.length
  const west360 = longitudes[westIndex]
  const east360 = west360 + 360 - largestGap
  const west = normalizeLongitudeTo180(west360)
  let east = normalizeLongitudeTo180(east360)

  if (west > east) {
    east += 360
  }

  return { east, west }
}

function normalizeLongitudeTo360(longitude: number): number {
  return ((longitude % 360) + 360) % 360
}

function normalizeLongitudeTo180(longitude: number): number {
  const normalized = ((longitude + 180) % 360 + 360) % 360 - 180
  return normalized === -180 && longitude > 0 ? 180 : normalized
}

function isGeoJsonPosition(coordinates: CountryGeometryCoordinates): coordinates is GeoJsonPosition {
  return typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number'
}

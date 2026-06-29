export type CountryCode = string | number
export type GeoJsonPosition = [number, number] | [number, number, number]
export type CountryGeometryCoordinates = GeoJsonPosition | CountryGeometryCoordinates[]

export interface CountryFeatureProperties {
  name?: string
  russianName?: string
  'ISO3166-1-Alpha-2'?: string
  'ISO3166-1-Alpha-3'?: string
  [key: string]: unknown
}

export interface CountryFeature {
  type: 'Feature'
  id?: CountryCode
  properties: CountryFeatureProperties
  geometry: {
    type: string
    coordinates: CountryGeometryCoordinates
  }
}

export interface CountryFeatureCollection {
  type: 'FeatureCollection'
  features: CountryFeature[]
}

export interface CountryTranslation {
  common?: string
  official?: string
}

export interface CountryNameRecord {
  cca2?: string
  cca3?: string
  name?: CountryTranslation
  altSpellings?: string[]
  translations?: Record<string, CountryTranslation>
}

export type CountryOverride =
  | string
  | {
      code?: string
      featureName?: string
      displayName?: string
    }

export interface CountrySearchEntry {
  normalizedName: string
  feature: CountryFeature
  displayName: string
}

export interface CountryIndexData {
  index: Map<string, CountryFeature>
  searchEntries: CountrySearchEntry[]
}

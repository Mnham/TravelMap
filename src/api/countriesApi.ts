import { COUNTRIES_URL, COUNTRY_NAMES_URL } from '../config'
import type { CountryFeatureCollection, CountryNameRecord } from '../countries/countryTypes'

interface CountryData {
  countriesData: CountryFeatureCollection
  countryNames: CountryNameRecord[]
}

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function fetchCountryNames(): Promise<CountryNameRecord[]> {
  try {
    const countryNames = await fetchJson<unknown>(COUNTRY_NAMES_URL)
    if (!Array.isArray(countryNames)) {
      throw new Error(`${COUNTRY_NAMES_URL} returned invalid country names data`)
    }

    return countryNames as CountryNameRecord[]
  } catch (error) {
    console.warn('Country names API is unavailable. Falling back to GeoJSON names.', error)
    return []
  }
}

export async function loadCountryData(): Promise<CountryData> {
  const [countriesDataResponse, countryNames] = await Promise.all([
    fetchJson<unknown>(COUNTRIES_URL),
    fetchCountryNames(),
  ])
  if (!isCountryFeatureCollection(countriesDataResponse)) {
    throw new Error(`${COUNTRIES_URL} returned invalid GeoJSON data`)
  }

  return { countriesData: countriesDataResponse, countryNames }
}

function isCountryFeatureCollection(value: unknown): value is CountryFeatureCollection {
  return Boolean(
    value
      && typeof value === 'object'
      && 'type' in value
      && value.type === 'FeatureCollection'
      && 'features' in value
      && Array.isArray(value.features),
  )
}

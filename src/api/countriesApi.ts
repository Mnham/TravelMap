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
    return await fetchJson<CountryNameRecord[]>(COUNTRY_NAMES_URL)
  } catch (error) {
    console.warn('Country names API is unavailable. Falling back to GeoJSON names.', error)
    return []
  }
}

export async function loadCountryData(): Promise<CountryData> {
  const [countriesData, countryNames] = await Promise.all([
    fetchJson<CountryFeatureCollection>(COUNTRIES_URL),
    fetchCountryNames(),
  ])

  return { countriesData, countryNames }
}

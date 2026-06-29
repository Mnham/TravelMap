import { COUNTRIES_URL, COUNTRY_NAMES_URL } from '../config.js'

export async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }

  return response.json()
}

export async function fetchCountryNames() {
  try {
    return await fetchJson(COUNTRY_NAMES_URL)
  } catch (error) {
    console.warn('Country names API is unavailable. Falling back to GeoJSON names.', error)
    return []
  }
}

export async function loadCountryData() {
  const [countriesData, countryNames] = await Promise.all([
    fetchJson(COUNTRIES_URL),
    fetchCountryNames(),
  ])

  return { countriesData, countryNames }
}

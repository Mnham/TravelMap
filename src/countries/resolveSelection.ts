import { findCountry, getCountryKey } from './countryIndex'
import { extractCountryNames } from './countryParser'
import type { CountryFeature, CountrySearchEntry } from './countryTypes'

export interface CountryInputResolution {
  missing: string[]
  normalizedNames: string[]
  selected: CountryFeature[]
}

export function getCountryInputItems(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function resolveCountryInput(
  value: string,
  countryIndex: Map<string, CountryFeature>,
  countrySearchEntries: CountrySearchEntry[],
): CountryInputResolution {
  const selected: CountryFeature[] = []
  const normalizedNames: string[] = []
  const missing: string[] = []
  const seen = new Set<string>()

  for (const item of getCountryInputItems(value)) {
    const names = extractCountryNames(item, countrySearchEntries)
    if (!names.length) {
      missing.push(item)
      continue
    }

    for (const name of names) {
      const feature = findCountry(countryIndex, name)
      if (!feature) {
        missing.push(name)
        continue
      }

      const countryKey = getCountryKey(feature)
      if (seen.has(countryKey)) {
        continue
      }

      seen.add(countryKey)
      selected.push(feature)
      normalizedNames.push(name)
    }
  }

  return { missing, normalizedNames, selected }
}

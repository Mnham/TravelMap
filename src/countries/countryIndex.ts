import { COUNTRY_NAME_OVERRIDES } from '../config'
import type {
  CountryCode,
  CountryFeature,
  CountryIndexData,
  CountryNameRecord,
  CountryOverride,
  CountrySearchEntry,
} from './countryTypes'

type CountryNameValue = CountryCode | null | undefined

export function buildCountryIndex(
  features: CountryFeature[],
  countryNames: CountryNameRecord[],
): CountryIndexData {
  const index = new Map<string, CountryFeature>()
  const searchEntries = new Map<string, CountrySearchEntry>()
  const featuresByCode = buildFeaturesByCode(features)
  const featuresByName = buildFeaturesByName(features)

  for (const feature of features) {
    addNamesToIndex(index, [
      feature.id,
      getCountryId(feature),
      feature.properties['ISO3166-1-Alpha-2'],
      feature.properties.name,
    ], feature)
    addNamesToSearch(searchEntries, [feature.properties.name], feature)
  }

  for (const country of countryNames) {
    const feature = getFeatureByCode(featuresByCode, country.cca3)
      || getFeatureByCode(featuresByCode, country.cca2)
      || findFeatureByName(country, featuresByName)
    if (feature) {
      feature.properties.russianName = getRussianCountryName(country)
      addNamesToIndex(index, getCountryNames(country), feature)
      addNamesToSearch(searchEntries, getCountrySearchNames(country), feature)
    }
  }

  for (const [name, override] of Object.entries(COUNTRY_NAME_OVERRIDES)) {
    const feature = findOverrideFeature(override, featuresByCode, featuresByName)
    if (feature) {
      feature.properties.russianName = getOverrideDisplayName(name, override, feature)
      index.set(normalizeName(name), feature)
      addNamesToSearch(searchEntries, [name], feature)
    }
  }

  return {
    index,
    searchEntries: [...searchEntries.values()]
      .sort((left, right) => right.normalizedName.length - left.normalizedName.length),
  }
}

export function findCountry(
  index: Map<string, CountryFeature>,
  name: string,
): CountryFeature | undefined {
  return index.get(normalizeName(name))
}

export function getCountryKey(feature: CountryFeature): string {
  const code = feature.id || feature.properties['ISO3166-1-Alpha-3']
  if (isValidCountryCode(code)) {
    return `code:${code}`
  }

  return `name:${normalizeName(feature.properties.name || '')}`
}

export function normalizeName(value: string | number): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^the\s+/i, '')
    .replace(/&/g, 'and')
    .replace(/[^a-zа-яё0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function addNamesToIndex(
  index: Map<string, CountryFeature>,
  names: CountryNameValue[],
  feature: CountryFeature,
): void {
  for (const name of names) {
    if (name && name !== '-99') {
      index.set(normalizeName(name), feature)
    }
  }
}

function addNamesToSearch(
  searchEntries: Map<string, CountrySearchEntry>,
  names: CountryNameValue[],
  feature: CountryFeature,
): void {
  for (const name of names) {
    if (!isSearchableCountryName(name)) {
      continue
    }

    const normalizedName = normalizeName(name)
    if (!normalizedName) {
      continue
    }

    const key = `${getCountryKey(feature)}:${normalizedName}`
    searchEntries.set(key, {
      normalizedName,
      feature,
      displayName: feature.properties.russianName || feature.properties.name || String(name),
    })
  }
}

function isSearchableCountryName(name: CountryNameValue): name is string | number {
  if (!name || name === '-99') {
    return false
  }

  const normalizedName = normalizeName(name)
  return normalizedName.length >= 3 && !/^[a-z]{2}$/i.test(String(name))
}

function buildFeaturesByCode(features: CountryFeature[]): Map<CountryCode, CountryFeature> {
  const featuresByCode = new Map<CountryCode, CountryFeature>()

  for (const feature of features) {
    const codes = [
      feature.id,
      feature.properties['ISO3166-1-Alpha-3'],
      feature.properties['ISO3166-1-Alpha-2'],
    ].filter(isValidCountryCode)

    for (const code of codes) {
      featuresByCode.set(code, feature)
    }
  }

  return featuresByCode
}

function buildFeaturesByName(features: CountryFeature[]): Map<string, CountryFeature> {
  const featuresByName = new Map<string, CountryFeature>()

  for (const feature of features) {
    if (feature.properties.name) {
      featuresByName.set(normalizeName(feature.properties.name), feature)
    }
  }

  return featuresByName
}

function getFeatureByCode(
  featuresByCode: Map<CountryCode, CountryFeature>,
  code: CountryNameValue,
): CountryFeature | undefined {
  return isValidCountryCode(code) ? featuresByCode.get(code) : undefined
}

function findFeatureByName(
  country: CountryNameRecord,
  featuresByName: Map<string, CountryFeature>,
): CountryFeature | undefined {
  for (const name of getCountryNames(country)) {
    const feature = featuresByName.get(normalizeName(name))
    if (feature) {
      return feature
    }
  }

  return undefined
}

function findOverrideFeature(
  override: CountryOverride,
  featuresByCode: Map<CountryCode, CountryFeature>,
  featuresByName: Map<string, CountryFeature>,
): CountryFeature | undefined {
  if (typeof override === 'string') {
    return featuresByCode.get(override)
  }

  return (override.code ? featuresByCode.get(override.code) : undefined)
    || (override.featureName ? featuresByName.get(normalizeName(override.featureName)) : undefined)
}

function getOverrideDisplayName(
  name: string,
  override: CountryOverride,
  feature: CountryFeature,
): string {
  if (typeof override === 'object' && override.displayName) {
    return override.displayName
  }

  return feature.properties.russianName || feature.properties.name || name
}

function getCountryNames(country: CountryNameRecord): string[] {
  return getCountryNameValues(country, { includeCodes: true })
}

function getCountrySearchNames(country: CountryNameRecord): string[] {
  return getCountryNameValues(country, { includeCodes: false })
}

function getCountryNameValues(
  country: CountryNameRecord,
  options: { includeCodes: boolean },
): string[] {
  const names: CountryNameValue[] = [
    ...(options.includeCodes ? [country.cca2, country.cca3] : []),
    country.name?.common,
    country.name?.official,
    ...(country.altSpellings || []),
  ]

  for (const translation of Object.values(country.translations || {})) {
    names.push(translation.common, translation.official)
  }

  return names.filter(isNonEmptyString)
}

function getRussianCountryName(country: CountryNameRecord): string | undefined {
  return country.translations?.rus?.common
    || country.translations?.rus?.official
    || country.name?.common
}

function getCountryId(feature: CountryFeature): CountryNameValue {
  const code = feature.id || feature.properties['ISO3166-1-Alpha-3']
  return isValidCountryCode(code) ? code : feature.properties.name
}

function isValidCountryCode(code: CountryNameValue): code is CountryCode {
  return Boolean(code && code !== '-99')
}

function isNonEmptyString(value: CountryNameValue): value is string {
  return typeof value === 'string' && Boolean(value)
}

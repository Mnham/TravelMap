import { COUNTRY_NAME_OVERRIDES } from '../config.js'

export function buildCountryIndex(features, countryNames) {
  const index = new Map()
  const searchEntries = new Map()
  const featuresByCode = buildFeaturesByCode(features)
  const featuresByName = buildFeaturesByName(features)

  for (const feature of features) {
    addNamesToIndex(index, [
      feature.id,
      getCountryId(feature),
      feature.properties?.['ISO3166-1-Alpha-2'],
      feature.properties?.name,
    ], feature)
    addNamesToSearch(searchEntries, [feature.properties?.name], feature)
  }

  for (const country of countryNames) {
    const feature = featuresByCode.get(country.cca3)
      || featuresByCode.get(country.cca2)
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

export function findCountry(index, name) {
  return index.get(normalizeName(name))
}

export function getCountryKey(feature) {
  const code = feature.id || feature.properties?.['ISO3166-1-Alpha-3']
  if (isValidCountryCode(code)) {
    return `code:${code}`
  }

  return `name:${normalizeName(feature.properties?.name || '')}`
}

export function normalizeName(value) {
  return value
    .toString()
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

function addNamesToIndex(index, names, feature) {
  for (const name of names) {
    if (name && name !== '-99') {
      index.set(normalizeName(name), feature)
    }
  }
}

function addNamesToSearch(searchEntries, names, feature) {
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
      displayName: feature.properties.russianName || feature.properties.name || name,
    })
  }
}

function isSearchableCountryName(name) {
  if (!name || name === '-99') {
    return false
  }

  const normalizedName = normalizeName(name)
  return normalizedName.length >= 3 && !/^[a-z]{2}$/i.test(name)
}

function buildFeaturesByCode(features) {
  const featuresByCode = new Map()

  for (const feature of features) {
    const codes = [
      feature.id,
      feature.properties?.['ISO3166-1-Alpha-3'],
      feature.properties?.['ISO3166-1-Alpha-2'],
    ].filter(isValidCountryCode)

    for (const code of codes) {
      featuresByCode.set(code, feature)
    }
  }

  return featuresByCode
}

function buildFeaturesByName(features) {
  const featuresByName = new Map()

  for (const feature of features) {
    if (feature.properties?.name) {
      featuresByName.set(normalizeName(feature.properties.name), feature)
    }
  }

  return featuresByName
}

function findFeatureByName(country, featuresByName) {
  for (const name of getCountryNames(country)) {
    const feature = featuresByName.get(normalizeName(name))
    if (feature) {
      return feature
    }
  }

  return null
}

function findOverrideFeature(override, featuresByCode, featuresByName) {
  if (typeof override === 'string') {
    return featuresByCode.get(override)
  }

  return (override.code ? featuresByCode.get(override.code) : null)
    || (override.featureName ? featuresByName.get(normalizeName(override.featureName)) : null)
}

function getOverrideDisplayName(name, override, feature) {
  if (typeof override === 'object' && override.displayName) {
    return override.displayName
  }

  return feature.properties.russianName || feature.properties.name || name
}

function getCountryNames(country) {
  const names = [
    country.cca2,
    country.cca3,
    country.name?.common,
    country.name?.official,
    ...(country.altSpellings || []),
  ]

  for (const translation of Object.values(country.translations || {})) {
    names.push(translation.common, translation.official)
  }

  return names.filter(Boolean)
}

function getCountrySearchNames(country) {
  const names = [
    country.cca3,
    country.name?.common,
    country.name?.official,
    ...(country.altSpellings || []),
  ]

  for (const translation of Object.values(country.translations || {})) {
    names.push(translation.common, translation.official)
  }

  return names.filter(Boolean)
}

function getRussianCountryName(country) {
  return country.translations?.rus?.common
    || country.translations?.rus?.official
    || country.name?.common
}

function getCountryId(feature) {
  const code = feature.id || feature.properties?.['ISO3166-1-Alpha-3']
  return isValidCountryCode(code) ? code : feature.properties?.name
}

function isValidCountryCode(code) {
  return Boolean(code && code !== '-99')
}

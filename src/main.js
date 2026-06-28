import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'

const COUNTRIES_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
const COUNTRY_NAMES_URL = 'https://cdn.jsdelivr.net/npm/world-countries@latest/countries.json'
const COUNTRY_NAME_OVERRIDES = {
  багамы: 'BHS',
  'др конго': 'COD',
  конго: 'COG',
  косово: {
    featureName: 'Kosovo',
    displayName: 'Косово',
  },
  'коморские острова': 'COM',
  кыргызстан: 'KGZ',
  микронезия: 'FSM',
  оаэ: 'ARE',
  'палестинские территории': 'PSE',
  'святой престол': 'VAT',
  сомалиленд: {
    featureName: 'Somaliland',
    displayName: 'Сомалиленд',
  },
  'соединенное королевство': 'GBR',
  'соединенные штаты': 'USA',
  'тимор лесте': 'TLS',
  'южная африка': 'ZAF',
  эсватини: 'SWZ',
}
const EMPTY_COLLECTION = {
  type: 'FeatureCollection',
  features: [],
}

let countryIndex = new Map()
let mapLoaded = false

document.querySelector('#app').innerHTML = `
  <aside class="panel">
    <div>
      <p class="eyebrow">Travel Map</p>
      <h1>Подсветка стран на карте</h1>
      <p class="intro">
        Введите страны через запятую или с новой строки. Русские и английские названия
        загружаются онлайн из открытого справочника стран.
      </p>
    </div>

    <label class="country-input">
      <span>Список стран</span>
      <textarea id="countries-input" rows="8" spellcheck="false">Франция
Германия
Япония</textarea>
    </label>

    <div class="actions">
      <button id="apply-button" type="button">Подсветить</button>
      <button id="clear-button" type="button" class="secondary">Очистить</button>
    </div>

    <p id="status" class="status">Загружаю границы и названия стран...</p>
  </aside>

  <main class="map-wrap">
    <div id="map"></div>
  </main>
`

const input = document.querySelector('#countries-input')
const applyButton = document.querySelector('#apply-button')
const clearButton = document.querySelector('#clear-button')
const statusEl = document.querySelector('#status')

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/bright',
  center: [20, 25],
  zoom: 1.5,
  attributionControl: true,
})
const countryPopup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
  offset: 12,
  className: 'country-tooltip',
})

map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')

map.on('load', async () => {
  mapLoaded = true
  map.addSource('countries', {
    type: 'geojson',
    data: EMPTY_COLLECTION,
  })
  map.addSource('selected-countries', {
    type: 'geojson',
    data: EMPTY_COLLECTION,
  })

  map.addLayer({
    id: 'country-fills',
    type: 'fill',
    source: 'countries',
    paint: {
      'fill-color': '#6b7280',
      'fill-opacity': 0.06,
    },
  })

  map.addLayer({
    id: 'country-borders',
    type: 'line',
    source: 'countries',
    paint: {
      'line-color': '#64748b',
      'line-opacity': 0.4,
      'line-width': 0.6,
    },
  })

  map.addLayer({
    id: 'selected-country-fills',
    type: 'fill',
    source: 'selected-countries',
    paint: {
      'fill-color': '#f97316',
      'fill-opacity': 0.55,
    },
  })

  map.addLayer({
    id: 'selected-country-borders',
    type: 'line',
    source: 'selected-countries',
    paint: {
      'line-color': '#9a3412',
      'line-width': 1.8,
    },
  })
  addSelectedCountryTooltip()

  await loadCountries()
  updateSelectedCountries()
})

applyButton.addEventListener('click', updateSelectedCountries)
input.addEventListener('input', updateSelectedCountries)
clearButton.addEventListener('click', () => {
  input.value = ''
  updateSelectedCountries()
})

async function loadCountries() {
  try {
    const [countriesData, countryNames] = await Promise.all([
      fetchJson(COUNTRIES_URL),
      fetchCountryNames(),
    ])

    countryIndex = buildCountryIndex(countriesData.features, countryNames)
    map.getSource('countries').setData(countriesData)
    statusEl.textContent = 'Введите страны, чтобы подсветить их на карте.'
  } catch (error) {
    statusEl.textContent = 'Не удалось загрузить границы стран. Проверьте подключение к интернету.'
    console.error(error)
  }
}

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`)
  }

  return response.json()
}

async function fetchCountryNames() {
  try {
    return await fetchJson(COUNTRY_NAMES_URL)
  } catch (error) {
    console.warn('Country names API is unavailable. Falling back to GeoJSON names.', error)
    return []
  }
}

function updateSelectedCountries() {
  if (!mapLoaded || !countryIndex.size) {
    return
  }

  const names = parseCountryNames(input.value)
  const selected = []
  const missing = []
  const seen = new Set()

  for (const name of names) {
    const feature = findCountry(name)

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
  }

  const collection = {
    type: 'FeatureCollection',
    features: selected,
  }

  countryPopup.remove()
  map.getSource('selected-countries').setData(collection)
  renderStatus(selected, missing)
  fitToFeatures(selected)
}

function buildCountryIndex(features, countryNames) {
  const index = new Map()
  const featuresByCode = buildFeaturesByCode(features)
  const featuresByName = buildFeaturesByName(features)

  for (const feature of features) {
    addNamesToIndex(index, [
      feature.id,
      getCountryId(feature),
      feature.properties?.['ISO3166-1-Alpha-2'],
      feature.properties?.name,
    ], feature)
  }

  for (const country of countryNames) {
    const feature = featuresByCode.get(country.cca3)
      || featuresByCode.get(country.cca2)
      || findFeatureByName(country, featuresByName)
    if (feature) {
      feature.properties.russianName = getRussianCountryName(country)
      addNamesToIndex(index, getCountryNames(country), feature)
    }
  }

  for (const [name, override] of Object.entries(COUNTRY_NAME_OVERRIDES)) {
    const feature = findOverrideFeature(override, featuresByCode, featuresByName)
    if (feature) {
      feature.properties.russianName = getOverrideDisplayName(name, override, feature)
      index.set(normalizeName(name), feature)
    }
  }

  return index
}

function addNamesToIndex(index, names, feature) {
  for (const name of names) {
    if (name && name !== '-99') {
      index.set(normalizeName(name), feature)
    }
  }
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

function getRussianCountryName(country) {
  return country.translations?.rus?.common
    || country.translations?.rus?.official
    || country.name?.common
}

function findCountry(name) {
  return countryIndex.get(normalizeName(name))
}

function getCountryId(feature) {
  const code = feature.id || feature.properties?.['ISO3166-1-Alpha-3']
  return isValidCountryCode(code) ? code : feature.properties?.name
}

function getCountryKey(feature) {
  const code = feature.id || feature.properties?.['ISO3166-1-Alpha-3']
  if (isValidCountryCode(code)) {
    return `code:${code}`
  }

  return `name:${normalizeName(feature.properties?.name || '')}`
}

function isValidCountryCode(code) {
  return Boolean(code && code !== '-99')
}

function parseCountryNames(value) {
  return value
    .split(/[\n,;]+/)
    .map(cleanCountryInput)
    .filter(Boolean)
}

function cleanCountryInput(value) {
  return value
    .trim()
    .replace(/^.+:\s*/, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[.。]+$/g, '')
    .trim()
}

function normalizeName(value) {
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

function renderStatus(selected, missing) {
  const foundText = selected.length
    ? `Найдено: ${selected.length}.`
    : 'Пока ничего не выбрано.'
  const missingText = missing.length
    ? ` Не найдено: ${missing.join(', ')}.`
    : ''

  statusEl.textContent = `${foundText}${missingText}`
}

function addSelectedCountryTooltip() {
  map.on('mousemove', 'selected-country-fills', (event) => {
    const feature = event.features?.[0]
    if (!feature) {
      return
    }

    map.getCanvas().style.cursor = 'pointer'
    countryPopup
      .setLngLat(event.lngLat)
      .setText(feature.properties.russianName || feature.properties.name)
      .addTo(map)
  })

  map.on('mouseleave', 'selected-country-fills', () => {
    map.getCanvas().style.cursor = ''
    countryPopup.remove()
  })
}

function fitToFeatures(features) {
  if (!features.length) {
    map.easeTo({ center: [20, 25], zoom: 1.5, duration: 700 })
    return
  }

  const bounds = new maplibregl.LngLatBounds()
  for (const feature of features) {
    extendBounds(bounds, feature.geometry.coordinates)
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 60,
      maxZoom: 4.5,
      duration: 800,
    })
  }
}

function extendBounds(bounds, coordinates) {
  if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
    bounds.extend(coordinates)
    return
  }

  for (const coordinate of coordinates) {
    extendBounds(bounds, coordinate)
  }
}

import './style.css'
import { loadCountryData } from './api/countriesApi.js'
import { buildCountryIndex, findCountry, getCountryKey } from './countries/countryIndex.js'
import { extractCountryNames } from './countries/countryParser.js'
import { createCountryMap } from './map/countryMap.js'
import { createAppView } from './ui/appView.js'
import { getSelectionStatusText, LOAD_ERROR_STATUS_TEXT, READY_STATUS_TEXT } from './ui/status.js'

let countryIndex = new Map()
let countrySearchEntries = []
let mapLoaded = false

const { input, applyButton, clearButton, statusEl } = createAppView('#app')
const countryMap = createCountryMap('map')

countryMap.onLoad(async () => {
  mapLoaded = true
  await loadAppData()
  updateSelectedCountries()
})

applyButton.addEventListener('click', applyCountryInput)
input.addEventListener('input', updateSelectedCountries)
input.addEventListener('paste', () => {
  requestAnimationFrame(() => {
    applyCountryInput()
  })
})
clearButton.addEventListener('click', () => {
  input.value = ''
  updateSelectedCountries()
})

async function loadAppData() {
  try {
    const { countriesData, countryNames } = await loadCountryData()

    const countryData = buildCountryIndex(countriesData.features, countryNames)
    countryIndex = countryData.index
    countrySearchEntries = countryData.searchEntries
    countryMap.setCountriesData(countriesData)
    statusEl.textContent = READY_STATUS_TEXT
  } catch (error) {
    statusEl.textContent = LOAD_ERROR_STATUS_TEXT
    console.error(error)
  }
}

function updateSelectedCountries() {
  if (!mapLoaded || !countryIndex.size) {
    return
  }

  const names = extractCountryNames(input.value, countrySearchEntries)
  const selected = []
  const missing = []
  const seen = new Set()

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
  }

  countryMap.setSelectedCountries(selected)
  renderStatus(selected, missing)
}

function applyCountryInput() {
  normalizeCountryInput()
  updateSelectedCountries()
}

function normalizeCountryInput() {
  if (!countrySearchEntries.length) {
    return
  }

  const names = extractCountryNames(input.value, countrySearchEntries)
  const normalizedValue = names.join('\n')
  if (input.value !== normalizedValue) {
    input.value = normalizedValue
  }
}

function renderStatus(selected, missing) {
  statusEl.textContent = getSelectionStatusText(selected.length, missing)
}


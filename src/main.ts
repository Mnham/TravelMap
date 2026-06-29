import './style.css'
import { loadCountryData } from './api/countriesApi'
import { buildCountryIndex, findCountry, getCountryKey } from './countries/countryIndex'
import { extractCountryNames } from './countries/countryParser'
import type { CountryFeature, CountrySearchEntry } from './countries/countryTypes'
import { createCountryMap } from './map/countryMap'
import { createAppView } from './ui/appView'
import { getSelectionStatusText, LOAD_ERROR_STATUS_TEXT, READY_STATUS_TEXT } from './ui/status'

let countryIndex = new Map<string, CountryFeature>()
let countrySearchEntries: CountrySearchEntry[] = []
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

async function loadAppData(): Promise<void> {
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

function updateSelectedCountries(): void {
  if (!mapLoaded || !countryIndex.size) {
    return
  }

  const names = extractCountryNames(input.value, countrySearchEntries)
  const selected: CountryFeature[] = []
  const missing: string[] = []
  const seen = new Set<string>()

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
  statusEl.textContent = getSelectionStatusText(selected.length, missing)
}

function applyCountryInput(): void {
  normalizeCountryInput()
  updateSelectedCountries()
}

function normalizeCountryInput(): void {
  if (!countrySearchEntries.length) {
    return
  }

  const names = extractCountryNames(input.value, countrySearchEntries)
  const normalizedValue = names.join('\n')
  if (input.value !== normalizedValue) {
    input.value = normalizedValue
  }
}


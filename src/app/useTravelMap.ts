import { useCallback, useEffect, useRef, useState } from 'react'
import { loadCountryData } from '../api/countriesApi'
import { DEFAULT_MAP_STYLE, MAP_STYLES } from '../config'
import { buildCountryIndex, getCountryKey } from '../countries/countryIndex'
import { COUNTRY_NAME_OVERRIDES } from '../countries/overrides'
import { resolveCountryInput } from '../countries/resolveSelection'
import type { CountryFeature, CountrySearchEntry } from '../countries/countryTypes'
import { createCountryMap, type CountryMap } from '../map/countryMap'
import { getSelectionStatusText, LOAD_ERROR_STATUS_TEXT, LOADING_STATUS_TEXT, READY_STATUS_TEXT } from '../ui/status'

export interface TravelMapState {
  countryText: string
  selectedCountriesCount: number
  selectedStyleId: string
  statusText: string
}

export interface TravelMapActions {
  applyCountryInput(value: string): void
  centerSelected(): void
  clearCountries(): void
  setMapStyle(styleId: string): void
}

export type TravelMapViewModel = TravelMapState & TravelMapActions

export function useTravelMap(mapContainerId: string): TravelMapViewModel {
  const [countryText, setCountryText] = useState('')
  const [selectedStyleId, setSelectedStyleId] = useState<string>(DEFAULT_MAP_STYLE.id)
  const [selectedCountriesCount, setSelectedCountriesCount] = useState(0)
  const [statusText, setStatusText] = useState(LOADING_STATUS_TEXT)
  const countryTextRef = useRef(countryText)
  const countryIndexRef = useRef(new Map<string, CountryFeature>())
  const countrySearchEntriesRef = useRef<CountrySearchEntry[]>([])
  const displayNamesByCountryKeyRef = useRef(new Map<string, string>())
  const mapRef = useRef<CountryMap | undefined>(undefined)
  const mapLoadedRef = useRef(false)

  const applyCountryInput = useCallback((rawValue: string) => {
    countryTextRef.current = rawValue

    const countryIndex = countryIndexRef.current
    if (!mapLoadedRef.current || !countryIndex.size || !mapRef.current) {
      setCountryText(rawValue)
      return
    }

    if (!rawValue.trim()) {
      countryTextRef.current = ''
      setCountryText('')
      mapRef.current.setSelectedCountries([])
      setSelectedCountriesCount(0)
      setStatusText(READY_STATUS_TEXT)
      return
    }

    const { missing, normalizedNames, selected } = resolveCountryInput(
      rawValue,
      countryIndex,
      countrySearchEntriesRef.current,
    )
    const nextValue = normalizedNames.length ? normalizedNames.join('\n') : rawValue

    countryTextRef.current = nextValue
    setCountryText(nextValue)
    mapRef.current.setSelectedCountries(
      selected.map((feature) => withCountryDisplayName(feature, displayNamesByCountryKeyRef.current)),
    )
    setSelectedCountriesCount(selected.length)
    setStatusText(getSelectionStatusText(selected.length, missing))

    if (selected.length) {
      mapRef.current.fitToSelectedCountries()
    }
  }, [])

  useEffect(() => {
    let isCancelled = false
    const countryMap = createCountryMap(mapContainerId)
    mapRef.current = countryMap

    countryMap.onLoad(async () => {
      if (isCancelled) {
        return
      }

      mapLoadedRef.current = true
      try {
        const { countriesData, countryNames } = await loadCountryData()
        if (isCancelled) {
          return
        }

        const countryData = buildCountryIndex(countriesData.features, countryNames, COUNTRY_NAME_OVERRIDES)

        countryIndexRef.current = countryData.index
        countrySearchEntriesRef.current = countryData.searchEntries
        displayNamesByCountryKeyRef.current = countryData.displayNamesByCountryKey
        countryMap.setCountriesData(countriesData)
        applyCountryInput(countryTextRef.current)
      } catch (error) {
        if (isCancelled) {
          return
        }

        setStatusText(LOAD_ERROR_STATUS_TEXT)
        console.error(error)
      }
    })

    return () => {
      isCancelled = true
      mapLoadedRef.current = false
      mapRef.current = undefined
      countryMap.remove()
    }
  }, [applyCountryInput, mapContainerId])

  const clearCountries = useCallback(() => {
    applyCountryInput('')
  }, [applyCountryInput])

  const centerSelected = useCallback(() => {
    mapRef.current?.fitToSelectedCountries()
  }, [])

  const setMapStyle = useCallback((nextStyleId: string) => {
    const nextStyle = MAP_STYLES.find((style) => style.id === nextStyleId)
    if (!nextStyle) {
      return
    }

    setSelectedStyleId(nextStyle.id)
    mapRef.current?.setStyleUrl(nextStyle.url)
  }, [])

  return {
    applyCountryInput,
    centerSelected,
    clearCountries,
    countryText,
    selectedCountriesCount,
    selectedStyleId,
    setMapStyle,
    statusText,
  }
}

function withCountryDisplayName(
  feature: CountryFeature,
  displayNamesByCountryKey: Map<string, string>,
): CountryFeature {
  const displayName = displayNamesByCountryKey.get(getCountryKey(feature))
  if (!displayName) {
    return feature
  }

  return {
    ...feature,
    properties: {
      ...feature.properties,
      russianName: displayName,
    },
  }
}

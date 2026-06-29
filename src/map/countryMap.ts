import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { DEFAULT_MAP_STYLE, EMPTY_COLLECTION } from '../config'
import { getFeatureBounds } from './bounds'
import type { CountryFeature, CountryFeatureCollection } from '../countries/countryTypes'
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl'

const DEFAULT_CENTER: [number, number] = [90, 60]
const DEFAULT_ZOOM = 1.5
const MAX_FIT_ZOOM = 16
const FIT_BOUNDS_PADDING = {
  bottom: 60,
  left: 500,
  right: 60,
  top: 60,
}

export interface CountryMap {
  fitToSelectedCountries(): void
  onLoad(callback: () => void): void
  remove(): void
  setStyleUrl(styleUrl: string): void
  setCountriesData(collection: CountryFeatureCollection): void
  setSelectedCountries(features: CountryFeature[]): void
}

type GeoJsonSourceData = Parameters<GeoJSONSource['setData']>[0]

export function createCountryMap(containerId: string): CountryMap {
  const map = new maplibregl.Map({
    container: containerId,
    style: DEFAULT_MAP_STYLE.url,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  })
  const countryPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12,
    className: 'country-tooltip',
  })
  let countriesData: CountryFeatureCollection = EMPTY_COLLECTION
  let selectedFeatures: CountryFeature[] = []
  let styleLoadGeneration = 0
  let isRemoved = false

  map.on('error', (event) => {
    console.error('Map rendering error:', event.error)
  })

  function onLoad(callback: () => void): void {
    map.on('load', () => {
      if (isRemoved) {
        return
      }

      map.resize()
      restoreCountryLayers()
      addSelectedCountryTooltip()
      callback()
    })
  }

  function setCountriesData(collection: CountryFeatureCollection): void {
    if (isRemoved) {
      return
    }

    countriesData = collection
    getGeoJsonSource(map, 'countries')?.setData(toGeoJsonFeatureCollection(collection))
  }

  function setSelectedCountries(features: CountryFeature[]): void {
    if (isRemoved) {
      return
    }

    selectedFeatures = features
    countryPopup.remove()
    setSelectedCountrySourceData(features)
  }

  function setStyleUrl(styleUrl: string): void {
    if (isRemoved) {
      return
    }

    const currentStyleLoadGeneration = ++styleLoadGeneration
    countryPopup.remove()
    map.once('style.load', () => {
      if (isRemoved || currentStyleLoadGeneration !== styleLoadGeneration) {
        return
      }

      restoreCountryLayers()
    })
    map.setStyle(styleUrl)
  }

  function fitToSelectedCountries(): void {
    if (isRemoved) {
      return
    }

    countryPopup.remove()
    fitToFeatures(selectedFeatures, { resetCamera: true })
  }

  function remove(): void {
    if (isRemoved) {
      return
    }

    isRemoved = true
    styleLoadGeneration += 1
    countryPopup.remove()
    map.remove()
  }

  function fitToDefaultView(resetCamera = false): void {
    map.easeTo({
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      ...(resetCamera ? { bearing: 0, pitch: 0 } : {}),
      duration: 700,
    })
  }

  function addCountrySources(): void {
    if (!map.getSource('countries')) {
      map.addSource('countries', {
        type: 'geojson',
        data: toGeoJsonFeatureCollection(EMPTY_COLLECTION),
      })
    }

    if (!map.getSource('selected-countries')) {
      map.addSource('selected-countries', {
        type: 'geojson',
        data: toGeoJsonFeatureCollection(EMPTY_COLLECTION),
      })
    }
  }

  function addCountryLayers(): void {
    if (!map.getLayer('country-fills')) {
      map.addLayer({
        id: 'country-fills',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': '#6b7280',
          'fill-opacity': 0.03,
        },
      })
    }

    if (!map.getLayer('country-borders')) {
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
    }

    if (!map.getLayer('selected-country-fills')) {
      map.addLayer({
        id: 'selected-country-fills',
        type: 'fill',
        source: 'selected-countries',
        paint: {
          'fill-color': getThemeColor('--app-selected-fill'),
          'fill-opacity': 0.55,
        },
      })
    }

    if (!map.getLayer('selected-country-borders')) {
      map.addLayer({
        id: 'selected-country-borders',
        type: 'line',
        source: 'selected-countries',
        paint: {
          'line-color': getThemeColor('--app-selected-border'),
          'line-width': 1.8,
        },
      })
    }
    applyThemeToLayers()
  }

  function restoreCountryLayers(): void {
    addCountrySources()
    addCountryLayers()
    getGeoJsonSource(map, 'countries')?.setData(toGeoJsonFeatureCollection(countriesData))
    setSelectedCountrySourceData(selectedFeatures)
  }

  function applyThemeToLayers(): void {
    if (!map.getLayer('selected-country-fills') || !map.getLayer('selected-country-borders')) {
      return
    }

    map.setPaintProperty('selected-country-fills', 'fill-color', getThemeColor('--app-selected-fill'))
    map.setPaintProperty('selected-country-borders', 'line-color', getThemeColor('--app-selected-border'))
  }

  function setSelectedCountrySourceData(features: CountryFeature[]): void {
    getGeoJsonSource(map, 'selected-countries')?.setData(toGeoJsonFeatureCollection({
      type: 'FeatureCollection',
      features,
    }))
  }

  function addSelectedCountryTooltip(): void {
    map.on('mousemove', 'selected-country-fills', (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) {
        return
      }

      map.getCanvas().style.cursor = 'pointer'
      countryPopup
        .setLngLat(event.lngLat)
        .setText(getFeatureTooltipText(feature))
        .addTo(map)
    })

    map.on('mouseleave', 'selected-country-fills', () => {
      map.getCanvas().style.cursor = ''
      countryPopup.remove()
    })
  }

  function fitToFeatures(features: CountryFeature[], options: { resetCamera?: boolean } = {}): void {
    if (!features.length) {
      fitToDefaultView(options.resetCamera)
      return
    }

    const bounds = getFeatureBounds(features)

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: FIT_BOUNDS_PADDING,
        maxZoom: MAX_FIT_ZOOM,
        ...(options.resetCamera ? { bearing: 0, pitch: 0 } : {}),
        duration: 800,
      })
    }
  }

  return {
    fitToSelectedCountries,
    onLoad,
    remove,
    setStyleUrl,
    setCountriesData,
    setSelectedCountries,
  }
}

function getGeoJsonSource(map: MapLibreMap, sourceId: string): GeoJSONSource | undefined {
  const source = map.getSource(sourceId)
  return source as GeoJSONSource | undefined
}

function getFeatureTooltipText(feature: { properties?: Record<string, unknown> | null }): string {
  const russianName = feature.properties?.russianName
  const name = feature.properties?.name

  return String(russianName || name || '')
}

function toGeoJsonFeatureCollection(collection: CountryFeatureCollection): GeoJsonSourceData {
  return collection as GeoJsonSourceData
}

function getThemeColor(propertyName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim()
}

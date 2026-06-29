import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { EMPTY_COLLECTION, MAP_STYLE } from '../config'
import type {
  CountryFeature,
  CountryFeatureCollection,
  CountryGeometryCoordinates,
  GeoJsonPosition,
} from '../countries/countryTypes'
import type {
  GeoJSONSource,
  LngLatBounds,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from 'maplibre-gl'

const DEFAULT_CENTER: [number, number] = [20, 25]
const DEFAULT_ZOOM = 1.5

export interface CountryMap {
  onLoad(callback: () => void): void
  setCountriesData(collection: CountryFeatureCollection): void
  setSelectedCountries(features: CountryFeature[]): void
}

type GeoJsonSourceData = Parameters<GeoJSONSource['setData']>[0]

export function createCountryMap(containerId: string): CountryMap {
  const map = new maplibregl.Map({
    container: containerId,
    style: MAP_STYLE,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
  })
  const countryPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12,
    className: 'country-tooltip',
  })

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
  map.on('error', (event) => {
    console.error('Map rendering error:', event.error)
  })

  function onLoad(callback: () => void): void {
    map.on('load', () => {
      map.resize()
      addCountrySources()
      addCountryLayers()
      addSelectedCountryTooltip()
      callback()
    })
  }

  function setCountriesData(collection: CountryFeatureCollection): void {
    getGeoJsonSource(map, 'countries').setData(toGeoJsonFeatureCollection(collection))
  }

  function setSelectedCountries(features: CountryFeature[]): void {
    countryPopup.remove()
    getGeoJsonSource(map, 'selected-countries').setData(toGeoJsonFeatureCollection({
      type: 'FeatureCollection',
      features,
    }))
    fitToFeatures(features)
  }

  function fitToDefaultView(): void {
    map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 700 })
  }

  function addCountrySources(): void {
    map.addSource('countries', {
      type: 'geojson',
      data: toGeoJsonFeatureCollection(EMPTY_COLLECTION),
    })
    map.addSource('selected-countries', {
      type: 'geojson',
      data: toGeoJsonFeatureCollection(EMPTY_COLLECTION),
    })
  }

  function addCountryLayers(): void {
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

  function fitToFeatures(features: CountryFeature[]): void {
    if (!features.length) {
      fitToDefaultView()
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

  return {
    onLoad,
    setCountriesData,
    setSelectedCountries,
  }
}

function getGeoJsonSource(map: MapLibreMap, sourceId: string): GeoJSONSource {
  const source = map.getSource(sourceId)
  if (!source) {
    throw new Error(`GeoJSON source not found: ${sourceId}`)
  }

  return source as GeoJSONSource
}

function extendBounds(bounds: LngLatBounds, coordinates: CountryGeometryCoordinates): void {
  if (isGeoJsonPosition(coordinates)) {
    bounds.extend([coordinates[0], coordinates[1]])
    return
  }

  for (const coordinate of coordinates) {
    extendBounds(bounds, coordinate)
  }
}

function isGeoJsonPosition(coordinates: CountryGeometryCoordinates): coordinates is GeoJsonPosition {
  return typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number'
}

function getFeatureTooltipText(feature: { properties?: Record<string, unknown> | null }): string {
  const russianName = feature.properties?.russianName
  const name = feature.properties?.name

  return String(russianName || name || '')
}

function toGeoJsonFeatureCollection(collection: CountryFeatureCollection): GeoJsonSourceData {
  return collection as GeoJsonSourceData
}

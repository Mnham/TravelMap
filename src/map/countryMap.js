import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { EMPTY_COLLECTION, MAP_STYLE } from '../config.js'

const DEFAULT_CENTER = [20, 25]
const DEFAULT_ZOOM = 1.5

export function createCountryMap(containerId) {
  const map = new maplibregl.Map({
    container: containerId,
    style: MAP_STYLE,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    attributionControl: true,
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

  function onLoad(callback) {
    map.on('load', () => {
      map.resize()
      addCountrySources()
      addCountryLayers()
      addSelectedCountryTooltip()
      callback()
    })
  }

  function setCountriesData(collection) {
    map.getSource('countries').setData(collection)
  }

  function setSelectedCountries(features) {
    countryPopup.remove()
    map.getSource('selected-countries').setData({
      type: 'FeatureCollection',
      features,
    })
    fitToFeatures(features)
  }

  function resetView() {
    map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, duration: 700 })
  }

  function addCountrySources() {
    map.addSource('countries', {
      type: 'geojson',
      data: EMPTY_COLLECTION,
    })
    map.addSource('selected-countries', {
      type: 'geojson',
      data: EMPTY_COLLECTION,
    })
  }

  function addCountryLayers() {
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
      resetView()
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
    resetView,
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

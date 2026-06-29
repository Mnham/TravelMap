import type { CountryFeatureCollection } from './countries/countryTypes'

export const COUNTRIES_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
export const COUNTRY_NAMES_URL = 'https://cdn.jsdelivr.net/npm/world-countries@latest/countries.json'
export const MAP_STYLES = [
  {
    id: 'bright',
    name: 'Bright',
    url: 'https://tiles.openfreemap.org/styles/bright',
  },
  {
    id: 'positron',
    name: 'Positron',
    url: 'https://tiles.openfreemap.org/styles/positron',
  },
  {
    id: 'liberty',
    name: 'Liberty',
    url: 'https://tiles.openfreemap.org/styles/liberty',
  },
  {
    id: 'dark',
    name: 'Dark',
    url: 'https://tiles.openfreemap.org/styles/dark',
  },
  {
    id: 'fiord',
    name: 'Fiord',
    url: 'https://tiles.openfreemap.org/styles/fiord',
  },
] as const
export const DEFAULT_MAP_STYLE = MAP_STYLES[0]

export const EMPTY_COLLECTION: CountryFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

export const COUNTRIES_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
export const COUNTRY_NAMES_URL = 'https://cdn.jsdelivr.net/npm/world-countries@latest/countries.json'

export const MAP_STYLE = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#dbeafe',
      },
    },
  ],
}

export const COUNTRY_NAME_OVERRIDES = {
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
  ватикан: {
    code: 'VAT',
    displayName: 'Ватикан',
  },
  сомалиленд: {
    featureName: 'Somaliland',
    displayName: 'Сомалиленд',
  },
  'соединенное королевство': 'GBR',
  'соединенные штаты': 'USA',
  сша: 'USA',
  'тимор лесте': 'TLS',
  'южная африка': 'ZAF',
  эсватини: 'SWZ',
}

export const EMPTY_COLLECTION = {
  type: 'FeatureCollection',
  features: [],
}

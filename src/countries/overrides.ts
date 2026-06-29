import type { CountryOverride } from './countryTypes'

export const COUNTRY_NAME_OVERRIDES: Record<string, CountryOverride> = {
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

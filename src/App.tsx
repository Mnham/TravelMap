import { useTravelMap } from './app/useTravelMap'
import { MAP_STYLES } from './config'
import {
  UiButton,
  UiControlPanel,
  UiFieldLabel,
  UiMapCanvas,
  UiMapViewport,
  UiSection,
  UiShell,
  UiSplitRow,
  UiStatus,
  UiTextArea,
} from './shared/ui'
import { MapStylePicker } from './ui/MapStylePicker'

export default function App() {
  const map = useTravelMap('map')

  return (
    <UiShell>
      <UiMapViewport>
        <UiMapCanvas id="map" />
      </UiMapViewport>

      <UiControlPanel aria-label="Управление картой">
        <UiSection className="ui-section--form">
          <UiSplitRow density="compact">
            <UiFieldLabel htmlFor="countries-input">Список стран</UiFieldLabel>
            <UiButton onClick={map.clearCountries} variant="danger">
              Очистить
            </UiButton>
          </UiSplitRow>
          <UiTextArea
            id="countries-input"
            onChange={(event) => map.applyCountryInput(event.currentTarget.value)}
            rows={8}
            spellCheck={false}
            value={map.countryText}
          />
        </UiSection>

        <UiSection className="ui-section--form">
          <UiFieldLabel id="map-style-label">Стиль карты</UiFieldLabel>
          <UiSplitRow>
            <MapStylePicker styles={MAP_STYLES} value={map.selectedStyleId} onChange={map.setMapStyle} />
            <UiButton
              disabled={map.selectedCountriesCount === 0}
              onClick={map.centerSelected}
              variant="neutral"
            >
              Центрировать
            </UiButton>
          </UiSplitRow>
        </UiSection>

        <UiStatus id="status">
          {map.statusText}
        </UiStatus>
      </UiControlPanel>
    </UiShell>
  )
}

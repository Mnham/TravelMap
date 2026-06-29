import { LOADING_STATUS_TEXT } from './status.js'

export function createAppView(rootSelector) {
  const root = document.querySelector(rootSelector)
  if (!root) {
    throw new Error(`App root not found: ${rootSelector}`)
  }

  root.innerHTML = `
    <aside class="panel">
      <label class="country-input">
        <span>Список стран</span>
        <textarea id="countries-input" rows="8" spellcheck="false"></textarea>
      </label>

      <div class="actions">
        <button id="apply-button" type="button">Подсветить</button>
        <button id="clear-button" type="button" class="secondary">Очистить</button>
      </div>

      <p id="status" class="status">${LOADING_STATUS_TEXT}</p>
    </aside>

    <main class="map-wrap">
      <div id="map"></div>
    </main>
  `

  return {
    input: root.querySelector('#countries-input'),
    applyButton: root.querySelector('#apply-button'),
    clearButton: root.querySelector('#clear-button'),
    statusEl: root.querySelector('#status'),
  }
}

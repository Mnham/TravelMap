import { LOADING_STATUS_TEXT } from './status'

export interface AppView {
  input: HTMLTextAreaElement
  applyButton: HTMLButtonElement
  clearButton: HTMLButtonElement
  statusEl: HTMLElement
}

export function createAppView(rootSelector: string): AppView {
  const root = document.querySelector(rootSelector)
  if (!(root instanceof HTMLElement)) {
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

  const input = root.querySelector('#countries-input')
  const applyButton = root.querySelector('#apply-button')
  const clearButton = root.querySelector('#clear-button')
  const statusEl = root.querySelector('#status')

  if (!(input instanceof HTMLTextAreaElement)) {
    throw new Error('Countries input not found')
  }
  if (!(applyButton instanceof HTMLButtonElement)) {
    throw new Error('Apply button not found')
  }
  if (!(clearButton instanceof HTMLButtonElement)) {
    throw new Error('Clear button not found')
  }
  if (!(statusEl instanceof HTMLElement)) {
    throw new Error('Status element not found')
  }

  return { input, applyButton, clearButton, statusEl }
}

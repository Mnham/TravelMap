export const LOADING_STATUS_TEXT = 'Загружаю границы и названия стран...'
export const READY_STATUS_TEXT = 'Введите страны, чтобы подсветить их на карте.'
export const LOAD_ERROR_STATUS_TEXT = 'Не удалось загрузить границы стран. Проверьте подключение к интернету.'

export function getSelectionStatusText(selectedCount, missingNames) {
  const foundText = selectedCount
    ? `Найдено: ${selectedCount}.`
    : 'Пока ничего не выбрано.'
  const missingText = missingNames.length
    ? ` Не найдено: ${missingNames.slice(0, 5).join(', ')}${missingNames.length > 5 ? ` и еще ${missingNames.length - 5}` : ''}.`
    : ''

  return `${foundText}${missingText}`
}

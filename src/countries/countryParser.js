import { getCountryKey, normalizeName } from './countryIndex.js'

export function extractCountryNames(text, searchEntries) {
  const normalizedValue = normalizeName(text)
  if (!normalizedValue) {
    return []
  }

  const matchesByCountry = new Map()
  const occupiedRanges = []

  for (const entry of searchEntries) {
    const countryKey = getCountryKey(entry.feature)
    const occurrences = findNormalizedCountryNameOccurrences(normalizedValue, entry.normalizedName)

    for (const occurrence of occurrences) {
      if (isRangeOccupied(occurrence, occupiedRanges)) {
        continue
      }

      const currentMatch = matchesByCountry.get(countryKey)
      if (!currentMatch || occurrence.index < currentMatch.index) {
        matchesByCountry.set(countryKey, {
          index: occurrence.index,
          name: entry.displayName,
        })
      }

      occupiedRanges.push(occurrence)
      break
    }
  }

  return [...matchesByCountry.values()]
    .sort((left, right) => left.index - right.index)
    .map((match) => match.name)
}

function findNormalizedCountryNameOccurrences(value, countryName) {
  const escapedName = countryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(?:^|\\s)${escapedName}(?=\\s|$)`, 'g')
  const matches = []
  let match = regex.exec(value)

  while (match) {
    const index = match.index + match[0].length - countryName.length
    matches.push({
      index,
      endIndex: index + countryName.length,
    })
    match = regex.exec(value)
  }

  return matches
}

function isRangeOccupied(range, occupiedRanges) {
  return occupiedRanges.some((occupiedRange) => (
    range.index < occupiedRange.endIndex && range.endIndex > occupiedRange.index
  ))
}

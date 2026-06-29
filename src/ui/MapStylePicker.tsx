import { useState, type FocusEvent, type KeyboardEvent } from 'react'
import {
  UiSelectCombobox,
  UiSelectListbox,
  UiSelectOption,
  UiSelectTrigger,
  UiSelectTriggerIcon,
} from '../shared/ui'

interface MapStyle {
  id: string
  name: string
}

interface MapStylePickerProps {
  styles: readonly MapStyle[]
  value: string
  onChange: (styleId: string) => void
}

export function MapStylePicker({ styles, value, onChange }: MapStylePickerProps) {
  const [activeStyleId, setActiveStyleId] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const selectedStyle = styles.find((style) => style.id === value) ?? styles[0]

  function handleStyleSelect(nextStyleId: string) {
    setActiveStyleId(nextStyleId)
    setIsOpen(false)
    onChange(nextStyleId)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!styles.length) {
      return
    }

    const activeIndex = Math.max(
      styles.findIndex((style) => style.id === activeStyleId),
      0,
    )

    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()

      if (!isOpen) {
        setActiveStyleId(value)
        setIsOpen(true)
        return
      }

      handleStyleSelect(activeStyleId)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()

      if (!isOpen) {
        setActiveStyleId(value)
        setIsOpen(true)
        return
      }

      const direction = event.key === 'ArrowDown' ? 1 : -1
      const nextIndex = (activeIndex + direction + styles.length) % styles.length
      setActiveStyleId(styles[nextIndex].id)
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setIsOpen(true)
      setActiveStyleId(event.key === 'Home' ? styles[0].id : styles[styles.length - 1].id)
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return
    }

    setIsOpen(false)
  }

  function getStyleOptionId(styleId: string) {
    return `map-style-option-${styleId}`
  }

  return (
    <UiSelectCombobox onBlur={handleBlur}>
      <UiSelectTrigger
        aria-activedescendant={isOpen ? getStyleOptionId(activeStyleId) : undefined}
        aria-labelledby="map-style-label map-style-value"
        aria-controls="map-style-listbox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => {
          setActiveStyleId(value)
          setIsOpen((currentIsOpen) => !currentIsOpen)
        }}
        onKeyDown={handleKeyDown}
      >
        <span id="map-style-value">{selectedStyle?.name ?? ''}</span>
        <UiSelectTriggerIcon />
      </UiSelectTrigger>
      {isOpen && (
        <UiSelectListbox id="map-style-listbox">
          {styles.map((style) => (
            <UiSelectOption
              aria-selected={style.id === value}
              data-active={style.id === activeStyleId}
              id={getStyleOptionId(style.id)}
              key={style.id}
              onClick={() => handleStyleSelect(style.id)}
              onMouseEnter={() => setActiveStyleId(style.id)}
            >
              {style.name}
            </UiSelectOption>
          ))}
        </UiSelectListbox>
      )}
    </UiSelectCombobox>
  )
}

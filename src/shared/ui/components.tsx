import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

type ButtonVariant = 'danger' | 'neutral' | 'primary'
type SplitRowDensity = 'compact' | 'default'

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function UiShell({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <main className={classNames('ui-shell', className)} {...props} />
}

export function UiControlPanel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <aside className={classNames('ui-control-panel', className)} {...props} />
}

export function UiSection({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={classNames('ui-section', className)} {...props} />
}

export function UiFieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={classNames('ui-field-label', className)} {...props} />
}

interface UiSplitRowProps extends HTMLAttributes<HTMLDivElement> {
  density?: SplitRowDensity
}

export function UiSplitRow({ className, density = 'default', ...props }: UiSplitRowProps) {
  return (
    <div
      className={classNames(
        'ui-split-row',
        density === 'compact' && 'ui-split-row--compact',
        className,
      )}
      {...props}
    />
  )
}

export function UiSelectCombobox({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-select-combobox', className)} {...props} />
}

export function UiSelectTrigger({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={classNames('ui-select-trigger', className)}
      type="button"
      {...props}
    />
  )
}

export function UiSelectTriggerIcon({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={classNames('ui-select-trigger-icon', className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export function UiSelectListbox({
  className,
  role = 'listbox',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-select-listbox', className)} role={role} {...props} />
}

export function UiSelectOption({
  className,
  role = 'option',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={classNames('ui-select-option', className)}
      role={role}
      type="button"
      {...props}
    />
  )
}

interface UiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function UiButton({ className, variant = 'neutral', ...props }: UiButtonProps) {
  return (
    <button
      className={classNames('ui-button', `ui-button--${variant}`, className)}
      type="button"
      {...props}
    />
  )
}

export function UiTextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={classNames('ui-textarea', className)} {...props} />
}

export function UiStatus({
  className,
  role = 'status',
  'aria-live': ariaLive = 'polite',
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      aria-live={ariaLive}
      className={classNames('ui-status', className)}
      role={role}
      {...props}
    />
  )
}

export function UiMapViewport({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-map-viewport', className)} {...props} />
}

export function UiMapCanvas({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classNames('ui-map-canvas', className)} {...props} />
}


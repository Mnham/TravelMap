import { createRoot } from 'react-dom/client'
import App from './App'
import './shared/ui/ui.css'
import './style.css'

const root = document.querySelector('#app')
if (!(root instanceof HTMLElement)) {
  throw new Error('App root not found')
}

createRoot(root).render(<App />)

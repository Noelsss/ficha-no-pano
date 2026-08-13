import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Versões antigas do app guardavam etapas e jogadores em localStorage.
// Apaga esse resíduo: são dados privados e não devem ficar no aparelho.
try {
  localStorage.removeItem('ficha-no-pano-cache')
} catch { /* ignora */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

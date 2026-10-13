import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CentralAvisos from './components/CentralAvisos.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <CentralAvisos />
  </StrictMode>,
)

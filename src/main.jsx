import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerGlobalErrorHandlers } from './utils/errorHandler.js'
import './Style/theme.css'

registerGlobalErrorHandlers()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
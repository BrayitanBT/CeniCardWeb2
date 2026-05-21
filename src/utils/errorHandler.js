import { handleApiError } from '../services/errorService'
import Swal from 'sweetalert2'

let hasShownGlobalError = false

function showGlobalError(message) {
  if (hasShownGlobalError) return
  hasShownGlobalError = true
  setTimeout(() => { hasShownGlobalError = false }, 5000)

  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonColor: '#007832',
    timer: 8000,
    timerProgressBar: true,
  })
}

export function registerGlobalErrorHandlers() {
  window.onerror = function (message, source, lineno, colno, error) {
    const userMessage = handleApiError(error || new Error(message), 'window.onerror')
    showGlobalError(userMessage)
    return false
  }

  window.addEventListener('unhandledrejection', function (event) {
    const error = event.reason || new Error('Promesa rechazada sin manejar')
    const userMessage = handleApiError(error, 'unhandledrejection')
    showGlobalError(userMessage)
    event.preventDefault()
  })
}

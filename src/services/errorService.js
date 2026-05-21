const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
}

const NETWORK_PATTERNS = [
  'ERR_NETWORK',
  'ERR_INTERNET_DISCONNECTED',
  'ERR_NAME_NOT_RESOLVED',
  'ERR_CONNECTION_REFUSED',
  'ERR_CONNECTION_TIMED_OUT',
  'Failed to fetch',
  'Network Error',
  'net::ERR_',
  'timeout',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
]

const AUTH_PATTERNS = [
  '401',
  '403',
  'Invalid login credentials',
  'session expired',
  'JWT expired',
  'not authenticated',
  'not authorized',
  'Email not confirmed',
]

const VALIDATION_PATTERNS = [
  '422',
  'violates check constraint',
  'duplicate key',
  'unique constraint',
  'null value in column',
  'violates not-null',
  'is too long',
  'is too short',
  'invalid input syntax',
  'invalid email',
  'Password should be at least',
]

const NOT_FOUND_PATTERNS = [
  '404',
  'not found',
  'does not exist',
  'no rows',
  'no results',
]

const SERVER_PATTERNS = [
  '500',
  '502',
  '503',
  '504',
  'internal server error',
  'bad gateway',
  'service unavailable',
  'gateway timeout',
]

export function classifyError(error) {
  if (!error) return ERROR_TYPES.UNKNOWN_ERROR

  const message = (
    error.message ||
    error.statusText ||
    error.code ||
    error.hint ||
    error.details ||
    String(error)
  ).toLowerCase()

  for (const pattern of NETWORK_PATTERNS) {
    if (message.includes(pattern.toLowerCase())) return ERROR_TYPES.NETWORK_ERROR
  }

  for (const pattern of AUTH_PATTERNS) {
    if (message.includes(pattern.toLowerCase())) return ERROR_TYPES.AUTH_ERROR
  }

  for (const pattern of VALIDATION_PATTERNS) {
    if (message.includes(pattern.toLowerCase())) return ERROR_TYPES.VALIDATION_ERROR
  }

  for (const pattern of NOT_FOUND_PATTERNS) {
    if (message.includes(pattern.toLowerCase())) return ERROR_TYPES.NOT_FOUND_ERROR
  }

  for (const pattern of SERVER_PATTERNS) {
    if (message.includes(pattern.toLowerCase())) return ERROR_TYPES.SERVER_ERROR
  }

  if (error.status >= 400 && error.status < 500) {
    if (error.status === 401 || error.status === 403) return ERROR_TYPES.AUTH_ERROR
    if (error.status === 422) return ERROR_TYPES.VALIDATION_ERROR
    if (error.status === 404) return ERROR_TYPES.NOT_FOUND_ERROR
  }

  if (error.status >= 500) return ERROR_TYPES.SERVER_ERROR

  return ERROR_TYPES.UNKNOWN_ERROR
}

const USER_MESSAGES = {
  [ERROR_TYPES.NETWORK_ERROR]: 'No hay conexión a internet. Verifica tu conexión e intenta de nuevo.',
  [ERROR_TYPES.AUTH_ERROR]: 'Tu sesión ha expirado o no tienes permisos. Inicia sesión de nuevo.',
  [ERROR_TYPES.VALIDATION_ERROR]: 'Los datos ingresados no son válidos. Verifica la información e intenta de nuevo.',
  [ERROR_TYPES.NOT_FOUND_ERROR]: 'El recurso solicitado no existe o fue eliminado.',
  [ERROR_TYPES.SERVER_ERROR]: 'Error en el servidor. Intenta de nuevo en unos momentos.',
  [ERROR_TYPES.UNKNOWN_ERROR]: 'Ocurrió un error inesperado.',
}

export function getUserMessage(error) {
  if (!error) return USER_MESSAGES[ERROR_TYPES.UNKNOWN_ERROR]

  if (error.message && error.message.trim()) {
    const msg = error.message.trim()
    if (msg.length > 5 && msg.length < 200) return msg
  }

  const type = classifyError(error)
  return USER_MESSAGES[type]
}

export function logError(error, context = 'global') {
  const type = classifyError(error)
  const timestamp = new Date().toISOString()
  const message = error?.message || String(error)
  const stack = error?.stack || ''

  console.error(
    `[ERROR] [${context}] ${timestamp} | Type: ${type} | Message: ${message}`,
    stack ? `\nStack: ${stack}` : ''
  )
}

export function handleApiError(error, context = 'api') {
  logError(error, context)
  return getUserMessage(error)
}

export { ERROR_TYPES }

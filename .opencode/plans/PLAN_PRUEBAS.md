# Plan de Pruebas — CeniCardWeb2

> Sistema de Carné Digital SENA — Plan integral de pruebas unitarias, de integración y E2E.

---

## Índice

1. [Resumen del Proyecto](#1-resumen-del-proyecto)
2. [Stack de Pruebas](#2-stack-de-pruebas)
3. [Estructura de Archivos de Tests](#3-estructura-de-archivos-de-tests)
4. [Fase 1: Pruebas Unitarias — errorService.js](#4-fase-1-pruebas-unitarias--errorservicejs)
5. [Fase 2: Pruebas Unitarias — Servicios de API](#5-fase-2-pruebas-unitarias--servicios-de-api)
6. [Fase 3: Pruebas de Componentes (Integration)](#6-fase-3-pruebas-de-componentes-integration)
7. [Fase 4: Pruebas de Integración E2E (Flujos completos)](#7-fase-4-pruebas-de-integración-e2e-flujos-completos)
8. [Fase 5: Pruebas de Regresión y Edge Cases](#8-fase-5-pruebas-de-regresión-y-edge-cases)
9. [Cobertura Esperada](#9-cobertura-esperada)
10. [Comandos de Ejecución](#10-comandos-de-ejecución)

---

## 1. Resumen del Proyecto

| Aspecto | Detalle |
|---|---|
| **Framework** | React 19.2.0 + Vite 7.3.1 |
| **Routing** | React Router DOM 7.13.0 |
| **Backend** | Supabase (`@supabase/supabase-js` 2.103.0) |
| **UI** | SweetAlert2, Recharts, jsPDF, html2canvas |
| **Estilos** | CSS puro con variables CSS (design tokens en `theme.css`) |
| **Rutas protegidas** | Por rol: `admin`/`funcionario` → `/Principal`, `instructor`/`contratista` → `/Carnes` |
| **Error handling** | 3 capas: global (`errorHandler.js`), ErrorBoundary, API (`errorService.js`) |
| **Componentes** | 17 componentes React (Login, Registro, Principal, Usuarios, Solicitudes, Servicios, Perfil, Historial, Añadir, Categorias, Carnes, Header, MenuLateral, Layout, ProtectedRoute, ProtectedRouteByRole, ErrorBoundary) |
| **Servicios** | 12 archivos (auth, user, equipo, prestamo, notificacion, estadistica, historial, noticia, ficha, error, utils, index) |

---

## 2. Stack de Pruebas

| Tipo | Herramienta | Propósito |
|---|---|---|
| Unit tests | **Vitest** | Tests de servicios, utilidades y lógica pura |
| Component tests | **@testing-library/react** | Tests de componentes React con DOM virtual |
| Mocks | **vi.mock** (Vitest) | Mock de Supabase client y servicios |
| E2E (opcional) | **Playwright** o **Cypress** | Flujos completos de navegador |
| Coverage | **v8** (built-in Vitest) | Reporte de cobertura de código |
| DOM environment | **jsdom** | Simulación de navegador para Vitest |

---

## 3. Estructura de Archivos de Tests

```
CeniCardWeb2/
├── src/
│   ├── __tests__/
│   │   ├── services/
│   │   │   ├── errorService.test.js
│   │   │   ├── authService.test.js
│   │   │   ├── userService.test.js
│   │   │   ├── equipoService.test.js
│   │   │   ├── prestamoService.test.js
│   │   │   ├── noticiaService.test.js
│   │   │   ├── historialService.test.js
│   │   │   ├── notificacionService.test.js
│   │   │   ├── estadisticaService.test.js
│   │   │   └── fichaService.test.js
│   │   ├── components/
│   │   │   ├── Login.test.jsx
│   │   │   ├── ProtectedRoute.test.jsx
│   │   │   ├── ProtectedRouteByRole.test.jsx
│   │   │   ├── ErrorBoundary.test.jsx
│   │   │   ├── Usuarios.test.jsx
│   │   │   ├── Solicitudes.test.jsx
│   │   │   ├── Servicios.test.jsx
│   │   │   ├── Historial.test.jsx
│   │   │   ├── Añadir.test.jsx
│   │   │   ├── Categorias.test.jsx
│   │   │   ├── Perfil.test.jsx
│   │   │   ├── Header.test.jsx
│   │   │   ├── Principal.test.jsx
│   │   │   ├── Carnes.test.jsx
│   │   │   ├── Layout.test.jsx
│   │   │   └── Registro.test.jsx
│   │   └── integration/
│   │       ├── auth-flow.test.jsx
│   │       ├── crud-usuarios-flow.test.jsx
│   │       ├── prestamo-flow.test.jsx
│   │       └── error-handling-flow.test.jsx
│   └── services/
│       └── __mocks__/
│           └── supabaseClient.js
├── vitest.config.js
└── setupTests.js
```

---

## 4. Fase 1: Pruebas Unitarias — errorService.js

**Archivo:** `src/__tests__/services/errorService.test.js`

| # | Función | Caso de prueba | Entrada | Resultado esperado |
|---|---|---|---|---|
| 1.1 | `classifyError` | Error de red (TypeError) | `new TypeError("Failed to fetch")` | `NETWORK_ERROR` |
| 1.2 | `classifyError` | Error 401 | `{ status: 401, message: "Unauthorized" }` | `AUTH_ERROR` |
| 1.3 | `classifyError` | Error 403 | `{ status: 403 }` | `AUTH_ERROR` |
| 1.4 | `classifyError` | Error 422 (validación) | `{ status: 422, details: [{message: "duplicate"}] }` | `VALIDATION_ERROR` |
| 1.5 | `classifyError` | Error 404 | `{ status: 404 }` | `NOT_FOUND_ERROR` |
| 1.6 | `classifyError` | Error 500 | `{ status: 500 }` | `SERVER_ERROR` |
| 1.7 | `classifyError` | Error 502 | `{ status: 502 }` | `SERVER_ERROR` |
| 1.8 | `classifyError` | Error 503 | `{ status: 503 }` | `SERVER_ERROR` |
| 1.9 | `classifyError` | String genérico | `"algo pasó"` | `UNKNOWN_ERROR` |
| 1.10 | `classifyError` | Objeto sin status | `{ message: "error raro" }` | `UNKNOWN_ERROR` |
| 1.11 | `classifyError` | Error con mensaje de red | `{ message: "Network Error" }` | `NETWORK_ERROR` |
| 1.12 | `classifyError` | Error con mensaje de timeout | `{ message: "timeout of 5000ms exceeded" }` | `NETWORK_ERROR` |
| 1.13 | `getUserMessage` | NETWORK_ERROR | `ERROR_TYPES.NETWORK_ERROR` | `"No se pudo conectar al servidor. Verifica tu conexión a internet e intenta de nuevo."` |
| 1.14 | `getUserMessage` | AUTH_ERROR | `ERROR_TYPES.AUTH_ERROR` | `"Tu sesión ha expirado o no tienes permisos. Inicia sesión nuevamente."` |
| 1.15 | `getUserMessage` | VALIDATION_ERROR | `ERROR_TYPES.VALIDATION_ERROR` | `"Los datos ingresados no son válidos. Verifica la información e intenta de nuevo."` |
| 1.16 | `getUserMessage` | NOT_FOUND_ERROR | `ERROR_TYPES.NOT_FOUND_ERROR` | `"El recurso solicitado no fue encontrado."` |
| 1.17 | `getUserMessage` | SERVER_ERROR | `ERROR_TYPES.SERVER_ERROR` | `"Error interno del servidor. Intenta de nuevo más tarde."` |
| 1.18 | `getUserMessage` | UNKNOWN_ERROR | `ERROR_TYPES.UNKNOWN_ERROR` | `"Ocurrió un error inesperado. Intenta de nuevo."` |
| 1.19 | `handleApiError` | Combina log + mensaje | Error de red | Retorna string con mensaje de red |
| 1.20 | `handleApiError` | Con contexto | Error 401 + contexto "login" | Log con contexto + retorna mensaje auth |
| 1.21 | `logError` | Estructura consola | Error con contexto "usuarios" | Log con timestamp, tipo, contexto, stack |
| 1.22 | `getUserMessage` | Fallback a error.message | `{ message: "Error específico de 50 caracteres" }` | Retorna el message si tiene 5-200 chars |

---

## 5. Fase 2: Pruebas Unitarias — Servicios de API

### 5.1 authService.js

**Archivo:** `src/__tests__/services/authService.test.js`

| # | Función | Caso | Mock Supabase | Resultado esperado |
|---|---|---|---|---|
| 2.1 | `loginConDocumento` | Login exitoso (admin) | `usuarios.select` → user activo, `auth.signInWithPassword` → ok | `{ user, rol: "admin" }` |
| 2.2 | `loginConDocumento` | Documento no existe | `usuarios.select` → empty | Lanza `"No se encontró una cuenta con este documento"` |
| 2.3 | `loginConDocumento` | Usuario inactivo | `usuarios.select` → user con estado="inactivo" | Lanza `"Tu cuenta está desactivada"` |
| 2.4 | `loginConDocumento` | Contraseña incorrecta | `auth.signInWithPassword` → error 400 | Lanza error de auth |
| 2.5 | `loginConDocumento` | Error de red | `usuarios.select` → throws | Lanza error propagado |
| 2.6 | `registrarUsuario` | Datos válidos | `usuarios.insert` → ok, `auth.signUp` → ok | Retorna usuario creado |
| 2.7 | `registrarUsuario` | Correo duplicado | `auth.signUp` → error 422 | Lanza error de validación |
| 2.8 | `obtenerSesionActual` | Sesión activa | `auth.getSession` → session válida | Retorna sesión |
| 2.9 | `obtenerSesionActual` | Sin sesión | `auth.getSession` → null | Retorna null |
| 2.10 | `cerrarSesion` | Logout exitoso | `auth.signOut` → ok | Retorna sin error |
| 2.11 | `cerrarSesion` | Fallo de red | `auth.signOut` → throws | Lanza error propagado |
| 2.12 | `obtenerPerfilUsuario` | Perfil existe | `usuarios.select` → user data | Retorna perfil |
| 2.13 | `obtenerPerfilUsuario` | Perfil no existe | `usuarios.select` → empty | Retorna null |
| 2.14 | `actualizarPerfilUsuario` | Campos válidos | `usuarios.update` → ok | Retorna usuario actualizado |
| 2.15 | `actualizarPerfilUsuario` | Campos no permitidos | Intenta actualizar `id` | Solo actualiza campos permitidos |

### 5.2 userService.js

**Archivo:** `src/__tests__/services/userService.test.js`

| # | Función | Caso | Mock | Resultado |
|---|---|---|---|---|
| 2.16 | `getUsuarios` | Lista completa | `select` → array de usuarios | Retorna array |
| 2.17 | `getUsuarios` | Error de red | `select` → throws | Lanza error |
| 2.18 | `getUsuarioById` | ID válido | `select` → user | Retorna usuario |
| 2.19 | `getUsuarioById` | ID no existe | `select` → empty | Retorna null |
| 2.20 | `createUsuario` | Datos válidos | `insert` → ok | Retorna usuario creado |
| 2.21 | `createUsuario` | Documento duplicado | `insert` → error 409 | Lanza error de duplicado |
| 2.22 | `updateUsuario` | Campos permitidos | `update` → ok | Retorna usuario actualizado |
| 2.23 | `updateUsuario` | Campos no permitidos | Intenta actualizar `id`, `created_at` | Filtra campos no permitidos |
| 2.24 | `deleteUsuario` | ID válido | `delete` → ok | Retorna sin error |
| 2.25 | `getRolesDisponibles` | Roles configurados | `select` → ["admin", "funcionario", ...] | Retorna array de roles |
| 2.26 | `getAllUsuariosConFichas` | Con fichas | `select` con join | Retorna usuarios con fichas |

### 5.3 equipoService.js

**Archivo:** `src/__tests__/services/equipoService.test.js`

| # | Función | Caso | Mock | Resultado |
|---|---|---|---|---|
| 2.27 | `getEquipos` | Con categorías | `select` con join `categorias_equipos` | Retorna equipos con categoria |
| 2.28 | `getEquiposByCategoria` | Categoría específica | `select` where categoria_id | Retorna equipos filtrados |
| 2.29 | `getEquiposDisponibles` | Solo disponibles | `select` where estado="disponible" | Retorna equipos disponibles |
| 2.30 | `getEquipoById` | ID válido | `select` → equipo | Retorna equipo |
| 2.31 | `createEquipo` | Datos válidos | `insert` → ok | Retorna equipo creado |
| 2.32 | `updateEquipo` | Campos permitidos | `update` → ok | Retorna equipo actualizado |
| 2.33 | `deleteEquipo` | ID válido | `delete` → ok | Retorna sin error |
| 2.34 | `getCategoriasEquipos` | Lista categorías | `select` → array | Retorna categorías |
| 2.35 | `createCategoria` | Datos válidos | `insert` → ok | Retorna categoría creada |
| 2.36 | `updateCategoria` | Toggle activa | `update` {activa: false} | Retorna categoría actualizada |
| 2.37 | `deleteCategoria` | ID válido | `delete` → ok | Retorna sin error |

### 5.4 prestamoService.js

**Archivo:** `src/__tests__/services/prestamoService.test.js`

| # | Función | Caso | Mock | Resultado |
|---|---|---|---|---|
| 2.38 | `getPrestamos` | Lista completa | `select` con joins | Retorna préstamos |
| 2.39 | `aprobarPrestamo` | ID + admin_id | `rpc` → ok | Retorna préstamo aprobado |
| 2.40 | `aprobarPrestamo` | ID no existe | `rpc` → error | Lanza error |
| 2.41 | `rechazarPrestamo` | ID + motivo + admin_id | `rpc` → ok | Retorna préstamo rechazado |
| 2.42 | `rechazarPrestamo` | Motivo vacío | `rpc` → error validación | Lanza error |
| 2.43 | `devolverEquipo` | ID + admin_id | `rpc` → ok | Retorna equipo devuelto |
| 2.44 | `crearSolicitudPrestamo` | Datos válidos | `insert` → ok | Retorna solicitud creada |
| 2.45 | `getSolicitudesPorUsuario` | Usuario específico | `select` where usuario_id | Retorna solicitudes del usuario |

### 5.5 noticiaService.js

**Archivo:** `src/__tests__/services/noticiaService.test.js`

| # | Función | Caso | Mock | Resultado |
|---|---|---|---|---|
| 2.46 | `getNoticias` | Con autor | `select` con join autor | Retorna noticias con autor_nombre |
| 2.47 | `getNoticiasPublicadas` | Solo publicadas | `select` where publicado=true | Retorna noticias publicadas |
| 2.48 | `getNoticiaById` | ID válido | `select` → noticia | Retorna noticia |
| 2.49 | `createNoticia` | Datos válidos | `insert` → ok | Retorna noticia creada |
| 2.50 | `updateNoticia` | Toggle publicado | `update` {publicado: false} | Retorna noticia actualizada |
| 2.51 | `deleteNoticia` | ID válido | `delete` → ok | Retorna sin error |

### 5.6 historialService.js

**Archivo:** `src/__tests__/services/historialService.test.js`

| # | Función | Caso | Mock | Resultado |
|---|---|---|---|---|
| 2.52 | `getHistorial` | Sin filtros | `select` con joins | Retorna historial completo |
| 2.53 | `getHistorial` | Filtro estado | `select` where estado="devuelto" | Retorna historial filtrado |
| 2.54 | `getHistorial` | Filtro fecha | `select` where fecha >= X | Retorna historial en rango |
| 2.55 | `getHistorial` | Error de red | `select` → throws | Lanza error |

### 5.7 Otros servicios

**Archivos:** `src/__tests__/services/notificacionService.test.js`, `estadisticaService.test.js`, `fichaService.test.js`

| # | Servicio | Función | Caso | Resultado |
|---|---|---|---|---|
| 2.56 | notificacionService | `getNotificaciones` | Lista completa | Retorna notificaciones |
| 2.57 | notificacionService | `getNotificacionesNoLeidas` | Solo no leídas | Retorna notificaciones no leídas |
| 2.58 | notificacionService | `marcarNotificacionLeida` | ID válido | Marca como leída |
| 2.59 | notificacionService | `marcarTodasNotificacionesLeidas` | Usuario ID | Marca todas como leídas |
| 2.60 | estadisticaService | `getEstadisticas` | Dashboard stats | Retorna estadísticas |
| 2.61 | estadisticaService | `getEstadisticasPorCategoria` | Por categoría | Retorna stats por categoría |
| 2.62 | fichaService | `getFichas` | Lista fichas | Retorna fichas |
| 2.63 | fichaService | `getFichasActivas` | Solo activas | Retorna fichas activas |
| 2.64 | fichaService | `createFicha` | Datos válidos | Retorna ficha creada |
| 2.65 | fichaService | `deleteFicha` | ID válido | Retorna sin error |

---

## 6. Fase 3: Pruebas de Componentes (Integration)

### 6.1 Login.test.jsx

**Archivo:** `src/__tests__/components/Login.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.1 | Render inicial | Montar componente | Muestra formulario doc + contraseña |
| 3.2 | Login exitoso (admin) | Submit con credenciales admin | Redirige a `/Principal` |
| 3.3 | Login exitoso (instructor) | Submit con credenciales instructor | Redirige a `/Carnes` |
| 3.4 | Login fallido | Credenciales incorrectas | Muestra mensaje de error inline |
| 3.5 | Campo vacío | Submit sin documento | No envía formulario |
| 3.6 | Campo vacío | Submit sin contraseña | No envía formulario |
| 3.7 | Usuario ya autenticado | Montar con sesión activa | Redirige automáticamente |

### 6.2 ProtectedRoute.test.jsx

**Archivo:** `src/__tests__/components/ProtectedRoute.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.8 | Sin sesión | Render sin user en context | Redirige a `/` |
| 3.9 | Con sesión | Render con user | Renderiza children |
| 3.10 | Loading state | Render con loading=true | Muestra indicador de carga |

### 6.3 ProtectedRouteByRole.test.jsx

**Archivo:** `src/__tests__/components/ProtectedRouteByRole.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.11 | Rol no permitido | user=aprendiz, allowed=["admin"] | Redirige a `/` |
| 3.12 | Rol permitido | user=admin, allowed=["admin", "funcionario"] | Renderiza children |
| 3.13 | Sin sesión | user=null, allowed=["admin"] | Redirige a `/` |
| 3.14 | Múltiples roles | user=funcionario, allowed=["admin", "funcionario"] | Renderiza children |

### 6.4 ErrorBoundary.test.jsx

**Archivo:** `src/__tests__/components/ErrorBoundary.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.15 | Error en child | Componente hijo lanza error en render | Muestra fallback UI con mensaje |
| 3.16 | Sin error | Componente normal | Renderiza children sin cambios |
| 3.17 | Botón reintentar | Click en "Reintentar" | Recarga la página (window.location.reload) |
| 3.18 | Error con info | Error con componentStack | Log con componentDidCatch |

### 6.5 Usuarios.test.jsx

**Archivo:** `src/__tests__/components/Usuarios.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.19 | Carga de datos | Mock getUsuarios | Muestra tabla con usuarios |
| 3.20 | Filtro por nombre | Escribir en buscador | Filtra tabla correctamente |
| 3.21 | Filtro por rol | Seleccionar rol | Filtra por rol |
| 3.22 | Filtro por estado | Seleccionar estado | Filtra por estado |
| 3.23 | Error de carga | Mock getUsuarios throws | Muestra Swal con mensaje de error |
| 3.24 | Editar usuario | Click editar + guardar | Llama updateUsuario + recarga |
| 3.25 | Eliminar usuario | Confirmar eliminación | Llama deleteUsuario + recarga |
| 3.26 | Crear usuario | Formulario completo + guardar | Llama createUsuario + recarga |
| 3.27 | Crear usuario - campos requeridos | Formulario incompleto | Muestra error de validación |
| 3.28 | Cambiar estado carné | Seleccionar estado + guardar | Llama updateUsuario con estado_carne |
| 3.29 | Loading state | Mientras carga datos | Muestra "Cargando usuarios..." |
| 3.30 | Sin resultados | Filtro que no coincide | Muestra "No se encontraron usuarios" |

### 6.6 Solicitudes.test.jsx

**Archivo:** `src/__tests__/components/Solicitudes.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.31 | Carga de datos | Mock getPrestamos + getCategoriasEquipos | Muestra tabla solicitudes |
| 3.32 | Aprobar solicitud | Click aprobar + confirmar | Llama aprobarPrestamo + recarga |
| 3.33 | Rechazar solicitud | Click rechazar + motivo | Llama rechazarPrestamo + recarga |
| 3.34 | Rechazar sin motivo | Click rechazar sin texto | Muestra validación "Debes proporcionar un motivo" |
| 3.35 | Error en aprobación | Mock aprobarPrestamo throws | Muestra Swal con error específico |
| 3.36 | Filtro por categoría | Seleccionar categoría | Filtra solicitudes |
| 3.37 | Filtro por estado | Seleccionar estado | Filtra solicitudes |
| 3.38 | Loading state | Mientras carga | Muestra "Cargando solicitudes..." |

### 6.7 Servicios.test.jsx

**Archivo:** `src/__tests__/components/Servicios.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.39 | Carga dual | Mock getNoticias + getEquipos + getCategoriasEquipos | Muestra noticias y equipos |
| 3.40 | Crear noticia | Formulario + submit | Llama createNoticia + recarga |
| 3.41 | Crear noticia - campos requeridos | Título vacío | Muestra error de validación |
| 3.42 | Crear equipo | Formulario + submit | Llama createEquipo + recarga |
| 3.43 | Crear equipo - campos requeridos | Sin número o categoría | Muestra error de validación |
| 3.44 | Editar noticia | Click editar + guardar | Llama updateNoticia + recarga |
| 3.45 | Editar equipo | Click editar + guardar | Llama updateEquipo + recarga |
| 3.46 | Eliminar noticia | Confirmar eliminación | Llama deleteNoticia + recarga |
| 3.47 | Eliminar equipo | Confirmar eliminación | Llama deleteEquipo + recarga |
| 3.48 | Error genérico | Mock throws | Muestra Swal con handleApiError |
| 3.49 | Búsqueda noticias | Escribir en buscador | Filtra noticias |
| 3.50 | Búsqueda equipos | Escribir en buscador | Filtra equipos |
| 3.51 | Filtro categoría equipos | Seleccionar categoría | Filtra equipos |
| 3.52 | Filtro estado equipos | Seleccionar estado | Filtra equipos |

### 6.8 Historial.test.jsx

**Archivo:** `src/__tests__/components/Historial.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.53 | Carga de datos | Mock getHistorial | Muestra tabla historial |
| 3.54 | Liberar equipo | Click liberar + confirmar | Llama devolverEquipo + recarga |
| 3.55 | Generar PDF | Click descargar PDF | Llama jsPDF + descarga archivo |
| 3.56 | Error en carga | Mock getHistorial throws | Muestra Swal con error |
| 3.57 | Filtro por estado | Seleccionar estado | Filtra historial |
| 3.58 | Búsqueda | Escribir en buscador | Filtra por nombre/documento/ID |
| 3.59 | Loading state | Mientras carga | Muestra "Cargando historial..." |
| 3.60 | Sin resultados | Filtro sin coincidencias | Muestra "No se encontraron registros" |
| 3.61 | PDF sin datos | getHistorial retorna [] | Botón PDF deshabilitado |

### 6.9 Añadir.test.jsx

**Archivo:** `src/__tests__/components/Añadir.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.62 | Carga préstamos activos | Mock getPrestamos | Muestra tabla préstamos aceptados |
| 3.63 | Liberar equipo | Click liberar + confirmar | Llama devolverEquipo + recarga |
| 3.64 | Error en carga | Mock getPrestamos throws | Muestra Swal con error |
| 3.65 | Búsqueda | Escribir en buscador | Filtra préstamos |
| 3.66 | Sin préstamos activos | getPrestamos retorna [] o sin aceptados | Muestra "No hay equipos entregados" |

### 6.10 Categorias.test.jsx

**Archivo:** `src/__tests__/components/Categorias.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.67 | Carga categorías | Mock getCategoriasEquipos | Muestra tabla categorías |
| 3.68 | Crear categoría | Formulario + submit | Llama createCategoria + recarga |
| 3.69 | Crear - nombre requerido | Nombre vacío | Muestra error de validación |
| 3.70 | Editar categoría | Formulario Swal + guardar | Llama updateCategoria + recarga |
| 3.71 | Toggle activa | Click activar/desactivar | Llama updateCategoria + recarga |
| 3.72 | Eliminar categoría | Confirmar eliminación | Llama deleteCategoria + recarga |
| 3.73 | Error en carga | Mock throws | Muestra Swal con error |
| 3.74 | Búsqueda | Escribir en buscador | Filtra categorías |

### 6.11 Perfil.test.jsx

**Archivo:** `src/__tests__/components/Perfil.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.75 | Carga perfil | Mock obtenerPerfilUsuario | Muestra datos del usuario |
| 3.76 | Error al cargar perfil | Mock throws | Muestra estado vacío o error |
| 3.77 | Perfil null | Mock retorna null | Muestra fallback "No se encontró perfil" |
| 3.78 | Editar perfil | Modificar campos + guardar | Llama actualizarPerfilUsuario |
| 3.79 | Bloquear carné | Click bloquear | Actualiza estado_carne a "bloqueado" |
| 3.80 | Desbloquear carné | Click desbloquear | Actualiza estado_carne a "activo" |

### 6.12 Header.test.jsx

**Archivo:** `src/__tests__/components/Header.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.81 | Render con usuario | Mock user context | Muestra nombre de usuario |
| 3.82 | Logout | Click cerrar sesión | Llama cerrarSesion + redirige a `/` |
| 3.83 | Error en logout | Mock cerrarSesion throws | Muestra Swal con error |
| 3.84 | Notificaciones | Click campana | Muestra panel de notificaciones |

### 6.13 Principal.test.jsx

**Archivo:** `src/__tests__/components/Principal.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.85 | Carga dashboard | Mock getEstadisticas + getEquipos + getPrestamos + getNoticias | Muestra gráficas y estadísticas |
| 3.86 | Error en carga | Mock getEstadisticas throws | Muestra Swal con error |
| 3.87 | Gráfica de equipos | Datos de equipos | Renderiza BarChart de Recharts |
| 3.88 | Gráfica de préstamos | Datos de préstamos | Renderiza PieChart de Recharts |

### 6.14 Carnes.test.jsx

**Archivo:** `src/__tests__/components/Carnes.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.89 | Carga carné | Mock datos carné | Muestra carné digital |
| 3.90 | Error en carga | Mock throws | Muestra Swal con error |
| 3.91 | Sin carné | Datos null | Muestra mensaje "No tienes carné" |

### 6.15 Layout.test.jsx

**Archivo:** `src/__tests__/components/Layout.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.92 | Render completo | Montar con children | Muestra sidebar + header + contenido |
| 3.93 | Sidebar toggle | Click en toggle | Abre/cierra sidebar |
| 3.94 | Responsive overlay | Click fuera del sidebar | Cierra sidebar en móvil |

### 6.16 Registro.test.jsx

**Archivo:** `src/__tests__/components/Registro.test.jsx`

| # | Prueba | Acción | Resultado esperado |
|---|---|---|---|
| 3.95 | Render inicial | Montar componente | Muestra formulario de registro |
| 3.96 | Registro exitoso | Formulario completo + submit | Llama registrarUsuario + redirige |
| 3.97 | Campos requeridos | Formulario incompleto | Muestra error de validación |
| 3.98 | Error en registro | Mock registrarUsuario throws | Muestra error |

---

## 7. Fase 4: Pruebas de Integración E2E (Flujos completos)

**Archivos:** `src/__tests__/integration/*.test.jsx`

### 7.1 auth-flow.test.jsx

| # | Flujo | Pasos | Resultado esperado |
|---|---|---|---|
| 4.1 | Login → Dashboard admin | Login como admin → ver Principal | Redirección correcta + datos cargados |
| 4.2 | Login → Carné instructor | Login como instructor → ver Carnes | Redirección correcta + carné visible |
| 4.3 | Protección de rutas | Intentar acceder a /Principal sin login | Redirige a `/` |
| 4.4 | Protección por rol | Aprendiz intenta acceder a /Principal | Redirige a `/` |
| 4.5 | Logout completo | Login → navegar → cerrar sesión | Redirige a `/` + limpia sesión |
| 4.6 | Sesión persistente | Login → recargar página | Mantiene sesión activa |

### 7.2 crud-usuarios-flow.test.jsx

| # | Flujo | Pasos | Resultado esperado |
|---|---|---|---|
| 4.7 | CRUD usuario completo | Crear → Ver en tabla → Editar → Ver cambios → Eliminar → Ver que desaparece | Usuario completa el ciclo |
| 4.8 | Filtros combinados | Buscar por nombre + filtrar por rol + filtrar por estado | Resultados correctos |
| 4.9 | Validación de formulario | Intentar crear sin campos requeridos | Bloquea creación + muestra error |
| 4.10 | Cambio de estado carné | Cambiar a "bloqueado" → verificar → cambiar a "activo" | Estados se reflejan correctamente |

### 7.3 prestamo-flow.test.jsx

| # | Flujo | Pasos | Resultado esperado |
|---|---|---|---|
| 4.11 | Ciclo préstamo completo | Solicitar → Ver en Solicitudes → Aprobar → Ver en Añadir → Devolver → Ver en Historial | Préstamo pasa por todos los estados |
| 4.12 | Rechazo de solicitud | Solicitar → Rechazar con motivo → Ver en Historial como rechazado | Solicitud rechazada correctamente |
| 4.13 | Generar reporte PDF | Ir a Historial → Descargar PDF | PDF generado con datos correctos |

### 7.4 error-handling-flow.test.jsx

| # | Flujo | Pasos | Resultado esperado |
|---|---|---|---|
| 4.14 | Error de red global | Simular offline → intentar cualquier acción | Swal con mensaje de red en español |
| 4.15 | ErrorBoundary recovery | Forzar error de render en componente hijo | Muestra fallback → click reintentar → recarga |
| 4.16 | Error de auth | Sesión expirada → intentar acceder a ruta protegida | Redirige a login |
| 4.17 | Error de validación | Enviar datos inválidos a API | Swal con mensaje de validación específico |
| 4.18 | Error 500 del servidor | Mock de servicio retorna 500 | Swal con "Error interno del servidor" |
| 4.19 | Debounce de errores | Múltiples errores rápidos | Máximo 1 Swal cada 5 segundos |

---

## 8. Fase 5: Pruebas de Regresión y Edge Cases

| # | Escenario | Prueba | Resultado esperado |
|---|---|---|---|
| 5.1 | Supabase cae | Todos los servicios fallan | Mensajes de error apropiados, app no crashea |
| 5.2 | Sesión expirada | Token expira durante uso | Redirige a login automáticamente |
| 5.3 | Datos nulos | API retorna null en lugar de array | Componentes manejan gracefully |
| 5.4 | Búsqueda vacía | Filtros sin resultados | Muestra "No se encontraron..." |
| 5.5 | Doble submit | Click rápido en botón guardar | No crea duplicados |
| 5.6 | Navegación rápida | Click en múltiples rutas rápido | No hay race conditions |
| 5.7 | Resize ventana | Cambiar tamaño de pantalla | Layout responsive funciona |
| 5.8 | Tema oscuro | Cambiar data-theme="dark" | Todos los componentes se adaptan |
| 5.9 | PDF sin datos | Click descargar PDF sin historial | Botón deshabilitado o mensaje |
| 5.10 | Caracteres especiales | Nombres con ñ, tildes, emojis | Se muestran correctamente |
| 5.11 | Documento muy largo | Ingresar documento de 50 caracteres | Validación o truncamiento |
| 5.12 | Contraseña corta | Registrar con contraseña < 6 caracteres | Muestra error de validación |
| 5.13 | Fecha futura | Ingresar fecha de vencimiento futura | Acepta correctamente |
| 5.14 | URL de foto inválida | Ingresar URL mal formada | Maneja error de carga de imagen |
| 5.15 | LocalStorage corrupto | localStorage con datos inválidos | App se recupera gracefully |
| 5.16 | Múltiples pestañas | Login en pestaña 1 → logout en pestaña 2 | Pestaña 1 detecta cambio de sesión |
| 5.17 | Botón atrás del navegador | Login → navegar → botón atrás | Comportamiento esperado sin errores |
| 5.18 | URL inválida | Navegar a /ruta-inexistente | Redirige a `/` o muestra 404 |

---

## 9. Cobertura Esperada

| Módulo | Cobertura mínima | Líneas | Ramas | Funciones |
|---|---|---|---|---|
| `services/errorService.js` | 100% | 100% | 100% | 100% |
| `services/authService.js` | 90% | 90% | 85% | 90% |
| `services/userService.js` | 85% | 85% | 80% | 85% |
| `services/equipoService.js` | 85% | 85% | 80% | 85% |
| `services/prestamoService.js` | 85% | 85% | 80% | 85% |
| `services/noticiaService.js` | 80% | 80% | 75% | 80% |
| `services/historialService.js` | 80% | 80% | 75% | 80% |
| `services/notificacionService.js` | 75% | 75% | 70% | 75% |
| `services/estadisticaService.js` | 75% | 75% | 70% | 75% |
| `services/fichaService.js` | 75% | 75% | 70% | 75% |
| `utils/errorHandler.js` | 90% | 90% | 85% | 90% |
| **Components (promedio)** | 70% | 70% | 65% | 70% |
| **TOTAL PROYECTO** | **~80%** | **~80%** | **~75%** | **~80%** |

---

## 10. Comandos de Ejecución

```bash
# Instalar dependencias de testing
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event

# Ejecutar todos los tests
npm run test

# Ejecutar tests con UI interactiva
npm run test:ui

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests de un archivo específico
npm run test -- src/__tests__/services/errorService.test.js

# Ejecutar tests de componentes
npm run test -- src/__tests__/components/

# Ejecutar tests de integración
npm run test -- src/__tests__/integration/

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Generar reporte de cobertura en HTML
npm run test:coverage -- --reporter=html
```

### Configuración propuesta: `vitest.config.js`

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        'src/supabaseClient.js',
        'src/services/index.js',
        '**/*.css',
      ],
    },
  },
});
```

### Configuración propuesta: `setupTests.js`

```js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock de SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(() => Promise.resolve({ isConfirmed: true })),
  },
}));

// Mock de React Router DOM
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
    NavLink: ({ children, ...props }) => actual.NavLink ? actual.NavLink({ children, ...props }) : children,
  };
});

// Mock de Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  BarChart: ({ children }) => children,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  PieChart: ({ children }) => children,
  Pie: ({ children }) => children,
  Cell: () => null,
}));

// Mock de jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    save: vi.fn(),
    internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
  })),
}));

// Mock de html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({ toDataURL: () => 'data:image/png;base64,mock' })),
}));
```

---

## Resumen de Ejecución por Fases

| Fase | Descripción | Tests | Tiempo estimado |
|---|---|---|---|
| **Fase 1** | Unitarias — errorService.js | 22 tests | 1-2 horas |
| **Fase 2** | Unitarias — Servicios de API | 43 tests | 4-6 horas |
| **Fase 3** | Componentes (Integration) | 70 tests | 8-12 horas |
| **Fase 4** | Integración E2E (Flujos) | 19 tests | 4-6 horas |
| **Fase 5** | Regresión y Edge Cases | 18 tests | 3-4 horas |
| **TOTAL** | | **~172 tests** | **20-30 horas** |

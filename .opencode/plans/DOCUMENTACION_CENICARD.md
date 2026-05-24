# DOCUMENTACIÓN TÉCNICA — CeniCard

> Sistema de Carné Digital — SENA Colombia

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Base de Datos](#5-base-de-datos)
6. [Triggers de Base de Datos](#6-triggers-de-base-de-datos)
7. [Sistema de Autenticación](#7-sistema-de-autenticación)
8. [Rutas y Protección por Roles](#8-rutas-y-protección-por-roles)
9. [Componentes del Frontend](#9-componentes-del-frontend)
10. [Servicios (Capa de API)](#10-servicios-capa-de-api)
11. [Manejo de Errores](#11-manejo-de-errores)
12. [Flujo de Préstamos de Equipos](#12-flujo-de-préstamos-de-equipos)
13. [Estados del Carné Digital](#13-estados-del-carné-digital)
14. [Estilos y Recursos](#14-estilos-y-recursos)
15. [Comandos de Desarrollo](#15-comandos-de-desarrollo)
16. [Despliegue](#16-despliegue)

---

## 1. Descripción General

CeniCard es un sistema web de gestión de carné digital diseñado para el SENA (Servicio Nacional de Aprendizaje). Permite la administración centralizada de carnés digitales, gestión de usuarios por roles, control de préstamos de equipos, generación de noticias institucionales, solicitudes de eventos y salones, y reportes en formato PDF.

### Funcionalidades principales

| Funcionalidad | Descripción |
|---|---|
| **Carné Digital** | Visualización y gestión del carné institucional con código QR, datos personales y estado |
| **Gestión de Usuarios** | CRUD completo con roles, fichas de formación, y control de acceso |
| **Préstamos de Equipos** | Sistema de solicitud → aprobación → devolución con validaciones automáticas |
| **Inventario de Equipos** | Catálogo categorizado con control de estado (disponible, ocupado, no disponible) |
| **Noticias** | Publicación y gestión de noticias institucionales |
| **Solicitudes** | Gestión de préstamos, eventos y salones con aprobación/rechazo |
| **Historial** | Registro completo con gráficas estadísticas y exportación a PDF |
| **Notificaciones** | Sistema de alertas automáticas por cambios de estado |

---

## 2. Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| React | 19.2.0 | Framework principal de UI |
| Vite | 7.3.1 | Build tool y dev server |
| React Router DOM | 7.13.0 | Enrutamiento del lado del cliente |
| SweetAlert2 | 11.26.20 | Notificaciones y diálogos modales |
| Recharts | 3.8.0 | Gráficas estadísticas (barras, pastel, área) |
| jsPDF + autoTable | 4.2.1 + 5.0.8 | Generación de reportes PDF |
| html2canvas | 1.4.1 | Captura de componentes como imagen |
| React Icons | 5.6.0 | Biblioteca de iconos |

### Backend / Infraestructura

| Tecnología | Propósito |
|---|---|
| Supabase | Backend-as-a-Service (BaaS) |
| PostgreSQL | Base de datos relacional |
| Supabase Auth | Autenticación con email/password |
| Supabase Storage | Almacenamiento de fotos de usuarios |
| Row Level Security (RLS) | Políticas de seguridad a nivel de fila |

### Desarrollo

| Tecnología | Propósito |
|---|---|
| ESLint | Linting y calidad de código |
| JavaScript (ES Modules) | Lenguaje principal |
| CSS Variables | Sistema de diseño con tokens |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     NAVEGADOR WEB                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │              CeniCard (React 19)                   │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐          │  │
│  │ │Components│ │ Context  │ │ Services  │          │  │
│  │ │  (17)    │ │ (Auth)   │ │  (12)     │          │  │
│  │ └─────────┘ └──────────┘ └─────┬─────┘          │  │
│  │                                │                 │  │
│  └────────────────────────────────┼────────────────┘  │
└───────────────────────────────────┼───────────────────┘
                                    │ HTTPS
                                    ▼
┌───────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  PostgreSQL   │  │  Supabase    │  │  Supabase      │  │
│  │  Database     │  │  Auth        │  │  Storage       │  │
│  │  + Triggers   │  │  (JWT)       │  │  (Fotos)       │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Patrón de comunicación

- **SPA (Single Page Application):** Todo el renderizado ocurre en el navegador
- **Comunicación directa:** React → Supabase SDK → PostgreSQL
- **Sin servidor intermedio:** Supabase actúa como backend completo
- **Autenticación:** JWT gestionado automáticamente por Supabase Auth
- **Triggers en BD:** Validaciones y automatizaciones a nivel de base de datos

---

## 4. Estructura del Proyecto

```
CeniCardWeb2/
│
├── index.html                      # Punto de entrada HTML
├── package.json                    # Dependencias y scripts
├── vite.config.js                  # Configuración de Vite
├── eslint.config.js                # Configuración de ESLint
├── README.md                       # Documentación
│
├── public/
│   └── favicon.ico                 # Icono del sitio
│
└── src/
    ├── main.jsx                    # Entry point de React
    ├── App.jsx                     # Configuración de rutas
    ├── supabaseClient.js           # Cliente de Supabase
    │
    ├── Components/                 # 17 componentes React
    │   ├── Login.jsx               # Página de inicio de sesión
    │   ├── Registro.jsx            # Página de registro
    │   ├── Principal.jsx           # Dashboard con estadísticas
    │   ├── Menu.jsx                # Menú lateral de navegación
    │   ├── Header.jsx              # Barra superior
    │   ├── Layout.jsx              # Wrapper responsive
    │   ├── Usuarios.jsx            # CRUD de usuarios
    │   ├── Solicitudes.jsx         # Aprobación/rechazo de préstamos
    │   ├── Servicios.jsx           # Gestión de noticias y equipos
    │   ├── Perfil.jsx              # Perfil + carné digital
    │   ├── Historial.jsx           # Historial + PDF
    │   ├── Añadir.jsx              # Devolución de equipos
    │   ├── Categorias.jsx          # CRUD de categorías
    │   ├── Carnes.jsx              # Visualizador de carné
    │   ├── ProtectedRoute.jsx      # Guard de autenticación
    │   ├── ProtectedRouteByRole.jsx# Guard por rol
    │   └── ErrorBoundary.jsx       # Error boundary React
    │
    ├── Context/                    # Contexto de autenticación
    │   ├── AuthContext.js          # Creación del contexto
    │   └── AuthProvider.jsx        # Provider con estado
    │
    ├── services/                   # 12 archivos de servicios
    │   ├── authService.js          # Login, registro, sesión
    │   ├── userService.js          # CRUD usuarios
    │   ├── equipoService.js        # CRUD equipos + categorías
    │   ├── prestamoService.js      # Gestión de préstamos
    │   ├── noticiaService.js       # CRUD noticias
    │   ├── notificacionService.js  # Gestión de notificaciones
    │   ├── estadisticaService.js   # Estadísticas dashboard
    │   ├── historialService.js     # Historial de préstamos
    │   ├── fichaService.js         # CRUD fichas
    │   ├── errorService.js         # Clasificación de errores
    │   ├── utils.js                # Utilidades
    │   └── index.js                # Barrel export
    │
    ├── Style/                      # 14 archivos CSS
    │   ├── theme.css               # Design tokens globales
    │   ├── Login.css
    │   ├── Registro.css
    │   ├── Principal.css
    │   ├── MenuLateral.css
    │   ├── Header.css
    │   ├── Layout.css
    │   ├── Usuarios.css
    │   ├── Solicitudes.css
    │   ├── Servicios.css
    │   ├── Perfil.css
    │   ├── Historial.css
    │   ├── Añadir.css
    │   └── Carnes.css
    │
    ├── utils/
    │   └── errorHandler.js         # Manejadores globales de errores
    │
    └── Img/                        # 14 recursos de imagen
```

---

## 5. Base de Datos

### 5.1 Tablas principales

| Tabla | Descripción | Registros clave |
|---|---|---|
| `usuarios` | Perfiles, credenciales, rol, estado del carné | id (UUID), numero_cc, correo, rol, estado_carne, ficha_id |
| `equipos` | Inventario de equipos con categoría y estado | id, numero, categoria_id, estado, marca, modelo, serial |
| `categorias_equipos` | Categorías de equipos | id, nombre, icono, descripcion, activa |
| `prestamos` | Solicitudes y préstamos de equipos | id, usuario_id, equipo_id, estado, fechas |
| `noticias` | Noticias institucionales | id, titulo, descripcion, publicado, creado_por |
| `notificaciones` | Alertas para usuarios | id, usuario_id, tipo, titulo, leida |
| `fichas` | Fichas de formación SENA | id, codigo_ficha, nombre_programa, cupos_maximos |
| `solicitudes_eventos` | Solicitudes de eventos | id, usuario_id, nombre_evento, lugar, fecha |
| `solicitudes_salones` | Solicitudes de salones | id, usuario_id, salon, fecha_uso, motivo |

### 5.2 Diagrama de relaciones

```
fichas (1) ──────────── (N) usuarios
                           │
                           ├── (N) prestamos ──── (1) equipos
                           │                           │
                           ├── (N) noticias            └── (1) categorias_equipos
                           │
                           ├── (N) notificaciones
                           │
                           ├── (N) solicitudes_eventos
                           │
                           └── (N) solicitudes_salones
```

### 5.3 Tabla `usuarios` — Campos principales

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Clave primaria, vinculada a `auth.users` |
| `numero_cc` | VARCHAR | Documento de identidad (único) |
| `correo` | TEXT | Email (único, usado para auth) |
| `rol` | TEXT | `aprendiz`, `funcionario`, `contratista`, `instructor`, `admin` |
| `estado_carne` | TEXT | `activo`, `bloqueado`, `prestamo`, `vencido` |
| `ficha_id` | INTEGER | FK → fichas |
| `activo` | BOOLEAN | Estado de la cuenta |
| `foto_url` | TEXT | URL de la foto |
| `centro_formacion` | TEXT | Centro SENA |
| `regional` | TEXT | Regional SENA |
| `rh` | VARCHAR | Tipo de sangre |
| `eps` | TEXT | EPS afiliada |
| `condicion_medica` | TEXT | Condiciones médicas |
| `contacto_emergencia_nombre` | TEXT | Contacto de emergencia |
| `contacto_emergencia_telefono` | TEXT | Teléfono de emergencia |
| `perfil_profesional` | TEXT | Descripción profesional |
| `carnet_trasero_completado` | BOOLEAN | Indica si completó el reverso del carné |
| `fecha_vencimiento_carne` | DATE | Fecha de vencimiento del carné |

### 5.4 Tabla `prestamos` — Campos principales

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER | Clave primaria |
| `usuario_id` | UUID | FK → usuarios |
| `equipo_id` | INTEGER | FK → equipos |
| `estado` | TEXT | `pendiente`, `aceptado`, `rechazado`, `devuelto` |
| `fecha_solicitud` | TIMESTAMP | Fecha de la solicitud |
| `fecha_aceptacion` | TIMESTAMP | Fecha de aceptación |
| `fecha_devolucion` | TIMESTAMP | Fecha de devolución |
| `fecha_devolucion_esperada` | DATE | Fecha esperada de devolución |
| `gestionado_por` | UUID | FK → usuarios (admin que procesó) |
| `motivo_rechazo` | TEXT | Motivo del rechazo |
| `observaciones` | TEXT | Observaciones adicionales |

### 5.5 Tabla `equipos` — Campos principales

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER | Clave primaria |
| `numero` | INTEGER | Número de identificación del equipo |
| `categoria_id` | INTEGER | FK → categorias_equipos |
| `marca` | TEXT | Marca del equipo |
| `modelo` | TEXT | Modelo del equipo |
| `serial` | TEXT | Número de serial (único) |
| `estado` | TEXT | `disponible`, `no_disponible`, `ocupado` |
| `activo` | BOOLEAN | Estado del equipo |
| `imagen_url` | TEXT | URL de imagen del equipo |
| `caracteristicas` | JSONB | Características adicionales |

---

## 6. Triggers de Base de Datos

Los triggers son el corazón de la lógica de negocio automatizada. Se ejecutan a nivel de base de datos, garantizando consistencia independientemente del cliente (web o móvil).

### 6.1 `trg_validar_solicitud_prestamo` (BEFORE INSERT en `prestamos`)

**Propósito:** Prevenir solicitudes duplicadas y validar disponibilidad del equipo.

```
Al INSERTAR una solicitud:
  1. Verificar que el equipo exista y esté activo
  2. Verificar que el equipo esté 'disponible'
  3. Verificar que NO exista otra solicitud 'pendiente' o 'aceptada' para ese equipo
  4. Si todo pasa → marcar equipo como 'ocupado'
  5. Si algo falla → RAISE EXCEPTION (rechaza el INSERT)
```

**Previene:**
- Dos usuarios solicitan el mismo equipo simultáneamente
- Solicitar un equipo no disponible o inactivo

### 6.2 `trg_prestamo_aceptado` (BEFORE UPDATE en `prestamos`)

**Propósito:** Gestionar estados del carné y equipos al aceptar/rechazar/devolver préstamos.

```
Al ACEPTAR (pendiente → aceptado):
  1. Verificar estado_carne del usuario:
     - 'vencido'   → ERROR: "carné vencido, debe renovarlo"
     - 'bloqueado' → ERROR: "carné bloqueado, contactar admin"
     - 'prestamo'  → ERROR: "ya tiene un préstamo activo"
     - 'activo'    → OK, continuar
  2. Verificar que no haya otra solicitud YA aceptada del mismo equipo
  3. Cambiar estado_carne del usuario a 'bloqueado'
  4. Asegurar equipo como 'ocupado'
  5. Registrar fecha_aceptacion

Al RECHAZAR (pendiente → rechazado):
  1. Verificar si hay OTRAS solicitudes 'pendiente' para ese equipo
  2. Si NO hay → liberar equipo ('disponible')
  3. Si SÍ hay → equipo sigue 'ocupado'

Al DEVOLVER (aceptado → devuelto):
  1. Cambiar estado_carne del usuario a 'activo'
  2. Liberar equipo ('disponible')
  3. Registrar fecha_devolucion
```

### 6.3 `trg_notif_prestamo` (AFTER UPDATE en `prestamos`)

**Propósito:** Enviar notificaciones automáticas al usuario sobre su préstamo.

```
Al aceptar → Notificación: "Préstamo aprobado ✓"
Al rechazar → Notificación: "Préstamo rechazado" + motivo
```

### 6.4 `trg_notif_carne` (AFTER UPDATE en `usuarios`)

**Propósito:** Notificar al usuario cuando su carné es bloqueado.

```
Si estado_carne cambia a 'bloqueado' → Notificación: "Carné bloqueado"
```

### 6.5 `trg_notif_perfil` (AFTER UPDATE en `usuarios`)

**Propósito:** Notificar al usuario cuando edita su perfil.

```
Solo si cambian campos de perfil real (nombre, celular, foto, etc.)
NO se dispara cuando cambia estado_carne (evita spam)
```

### 6.6 `trg_cupo_ficha` (BEFORE INSERT/UPDATE en `usuarios`)

**Propósito:** Limitar la cantidad de aprendices por ficha de formación.

```
Si rol = 'aprendiz' y ficha_id existe:
  1. Obtener cupos_maximos de la ficha
  2. Contar aprendices activos en esa ficha
  3. Si inscritos >= cupos → RAISE EXCEPTION
```

### 6.7 Triggers de notificación para eventos y salones

| Trigger | Tabla | Propósito |
|---|---|---|
| `trg_notif_evento` | solicitudes_eventos | Notifica aprobación/rechazo de eventos |
| `trg_notif_salon` | solicitudes_salones | Notifica aprobación/rechazo de salones |

### 6.8 Triggers de `updated_at`

| Trigger | Tabla | Propósito |
|---|---|---|
| `trg_usuarios_updated_at` | usuarios | Actualiza `updated_at` automáticamente |
| `trg_equipos_updated_at` | equipos | Actualiza `updated_at` automáticamente |
| `trg_noticias_updated_at` | noticias | Actualiza `updated_at` automáticamente |
| `trg_prestamos_updated_at` | prestamos | Actualiza `updated_at` automáticamente |
| `trg_eventos_updated_at` | solicitudes_eventos | Actualiza `updated_at` automáticamente |
| `trg_salones_updated_at` | solicitudes_salones | Actualiza `updated_at` automáticamente |

---

## 7. Sistema de Autenticación

### 7.1 Flujo de Login

```
1. Usuario ingresa documento + contraseña
2. authService.loginConDocumento():
   a. RPC get_user_by_documento(documento) → busca usuario
   b. Verifica: existe, activo, rol permitido, tiene email
   c. supabase.auth.signInWithPassword(email, password)
   d. Retorna: session, user, perfil (nombre, rol, estado_carne)
3. Login.jsx guarda rol en localStorage
4. Redirección según rol:
   - instructor/contratista → /Carnes
   - funcionario/admin → /Principal
   - aprendiz → bloqueado con error
```

### 7.2 Roles y Permisos

| Rol | Acceso | Descripción |
|---|---|---|
| `admin` | Completo | Gestión total del sistema |
| `funcionario` | Completo | Gestión del sistema (sin administración de roles) |
| `instructor` | Limitado | Solo visualización de carnés (`/Carnes`) |
| `contratista` | Limitado | Solo visualización de carnés (`/Carnes`) |
| `aprendiz` | **Bloqueado** | No puede acceder al sistema |

### 7.3 Persistencia de Sesión

- **Token JWT:** Gestionado automáticamente por Supabase Auth
- **Refresh automático:** Supabase renueva tokens expirados
- **localStorage:** Almacena `user_rol` y `user_nombre` para redirección rápida
- **onAuthStateChange:** Listener que reacciona a login/logout en tiempo real

---

## 8. Rutas y Protección por Roles

### 8.1 Mapa de Rutas

| Ruta | Componente | Protección | Roles |
|---|---|---|---|
| `/` | Login | Pública | Todos |
| `/Registro` | Registro | Pública | Todos |
| `/Carnes` | Carnes | Por rol | `instructor`, `contratista` |
| `/Principal` | Principal | Por rol | `funcionario`, `admin` |
| `/Usuarios` | Usuarios | Por rol | `funcionario`, `admin` |
| `/Solicitudes` | Solicitudes | Por rol | `funcionario`, `admin` |
| `/Servicios` | Servicios | Por rol | `funcionario`, `admin` |
| `/Perfil` | Perfil | Por rol | `funcionario`, `admin` |
| `/Historial` | Historial | Por rol | `funcionario`, `admin` |
| `/Añadir` | Añadir | Por rol | `funcionario`, `admin` |
| `/Categorias` | Categorias | Por rol | `funcionario`, `admin` |

### 8.2 Guards de Ruta

- **`ProtectedRoute`:** Verifica autenticación básica (user existe)
- **`ProtectedRouteByRole`:** Verifica autenticación + rol en `allowedRoles`
- **`ErrorBoundary`:** Captura errores de renderizado en rutas protegidas

### 8.3 Doble capa de protección

1. **Login:** Redirige según rol inmediatamente después del login
2. **Rutas:** Guards validan rol antes de renderizar cada componente

---

## 9. Componentes del Frontend

### 9.1 Autenticación

| Componente | Líneas | Descripción |
|---|---|---|
| `Login.jsx` | 264 | Formulario de login con documento/contraseña, toggle de visibilidad, validaciones, redirección por rol |
| `Registro.jsx` | 110 | Formulario de registro con campos básicos |

### 9.2 Layout y Navegación

| Componente | Líneas | Descripción |
|---|---|---|
| `Layout.jsx` | 67 | Wrapper responsive: detecta móvil/tablet/desktop, gestiona sidebar overlay y modo colapsado |
| `Menu.jsx` | 49 | Sidebar con logo SENA, enlaces de navegación, iconos, estado colapsado |
| `Header.jsx` | 132 | Barra superior con toggle sidebar, nombre de usuario, notificaciones, botón logout |

### 9.3 Dashboard y Gestión

| Componente | Líneas | Descripción |
|---|---|---|
| `Principal.jsx` | 198 | Dashboard con 4 tarjetas de estadísticas, gráfica de área (tendencia de préstamos) |
| `Usuarios.jsx` | 928 | CRUD completo: tabla con búsqueda/filtros, modales para crear/editar/activar/eliminar usuarios |
| `Solicitudes.jsx` | 289 | Gestión de préstamos: aprobar/rechazar con motivo, filtros por categoría y estado |
| `Servicios.jsx` | 822 | Gestión dual: noticias (CRUD) + equipos (CRUD) con modales y filtros |
| `Perfil.jsx` | 874 | Perfil de usuario + carné digital (frente/reverso), edición, bloqueo con código, carga de foto |
| `Historial.jsx` | 688 | Historial de préstamos con filtros, gráficas (barras + pastel), exportación a PDF |
| `Añadir.jsx` | 229 | Vista de préstamos activos, botón de devolución rápida |
| `Categorias.jsx` | 403 | CRUD de categorías de equipos con validación de uso |
| `Carnes.jsx` | 192 | Visualizador de carnés digitales para instructores y contratistas |

### 9.4 Componentes de Infraestructura

| Componente | Líneas | Descripción |
|---|---|---|
| `ProtectedRoute.jsx` | 26 | Guard básico: redirige a `/` si no hay sesión |
| `ProtectedRouteByRole.jsx` | 30 | Guard por rol: redirige si rol no está en `allowedRoles` |
| `ErrorBoundary.jsx` | 67 | Clase React: captura errores de render, muestra fallback con botón de reintento |

---

## 10. Servicios (Capa de API)

### 10.1 authService.js

| Función | Descripción |
|---|---|
| `loginConDocumento(doc, pwd)` | Busca usuario por documento (RPC), valida estado/rol, autentica con Supabase Auth |
| `registrarUsuario(data)` | Crea usuario en Auth + inserta perfil en `usuarios` |
| `obtenerSesionActual()` | Obtiene sesión actual de Supabase |
| `cerrarSesion()` | Cierra sesión y limpia localStorage |
| `obtenerPerfilUsuario(id)` | Obtiene perfil con join a `fichas` |
| `actualizarPerfilUsuario(id, updates)` | Actualiza campos permitidos del perfil |

### 10.2 userService.js

| Función | Descripción |
|---|---|
| `getUsuarios()` | Lista todos los usuarios con fichas |
| `getUsuarioById(id)` | Obtiene un usuario específico |
| `createUsuario(data)` | Crea usuario en Auth + perfil completo |
| `updateUsuario(id, updates)` | Actualiza campos permitidos |
| `deleteUsuario(id)` | Elimina usuario |
| `getRolesDisponibles()` | Obtiene roles únicos disponibles |
| `getAllUsuariosConFichas()` | Usuarios ordenados por apellido (para Carnes) |

### 10.3 equipoService.js

| Función | Descripción |
|---|---|
| `getEquipos()` | Lista equipos con categorías |
| `getEquiposByCategoria(id)` | Equipos filtrados por categoría |
| `getEquiposDisponibles()` | Solo equipos disponibles y activos |
| `getEquipoById(id)` | Equipo específico |
| `createEquipo(data)` | Crea nuevo equipo |
| `updateEquipo(id, updates)` | Actualiza campos permitidos |
| `deleteEquipo(id)` | Elimina (bloquea si tiene préstamos activos) |
| `getCategoriasEquipos()` | Categorías activas |
| `createCategoria(data)` | Crea categoría |
| `updateCategoria(id, updates)` | Actualiza categoría |
| `deleteCategoria(id)` | Elimina (bloquea si tiene equipos asociados) |

### 10.4 prestamoService.js

| Función | Descripción |
|---|---|
| `getPrestamos()` | Lista todos los préstamos con joins |
| `aprobarPrestamo(id, adminId)` | Aprueba préstamo (valida carné + equipo) |
| `rechazarPrestamo(id, motivo, adminId)` | Rechaza con motivo |
| `devolverEquipo(id, adminId)` | Marca como devuelto |
| `crearSolicitudPrestamo(userId, equipoId)` | Crea solicitud (valida carné + disponibilidad) |
| `getSolicitudesPorUsuario(userId)` | Préstamos de un usuario |

### 10.5 Otros Servicios

| Servicio | Funciones principales |
|---|---|
| `noticiaService.js` | CRUD de noticias, publicadas, por ID |
| `fichaService.js` | CRUD de fichas, activas, por ID |
| `notificacionService.js` | Listar, marcar leída, marcar todas, crear, eliminar |
| `estadisticaService.js` | Conteos dashboard, estadísticas por categoría |
| `historialService.js` | Historial con filtros (usuario, estado, fecha) |
| `errorService.js` | Clasificación de errores, mensajes en español, logging |
| `utils.js` | `formatearNombreCompleto()` |

---

## 11. Manejo de Errores

### Tres capas de protección

| Capa | Archivo | Qué captura |
|---|---|---|
| **Global** | `utils/errorHandler.js` | `window.onerror` + `unhandledrejection` con debounce de 5s |
| **React** | `Components/ErrorBoundary.jsx` | Errores de renderizado con fallback UI |
| **API** | `services/errorService.js` | Clasificación en 6 tipos con mensajes en español |

### Tipos de Error

| Tipo | Código | Mensaje al usuario |
|---|---|---|
| `NETWORK_ERROR` | Fallo de conexión | "No se pudo conectar al servidor. Verifica tu conexión a internet." |
| `AUTH_ERROR` | 401/403 | "Tu sesión ha expirado o no tienes permisos. Inicia sesión nuevamente." |
| `VALIDATION_ERROR` | 422 | "Los datos ingresados no son válidos. Verifica la información." |
| `NOT_FOUND_ERROR` | 404 | "El recurso solicitado no fue encontrado." |
| `SERVER_ERROR` | 5xx | "Error interno del servidor. Intenta de nuevo más tarde." |
| `UNKNOWN_ERROR` | Otros | "Ocurrió un error inesperado. Intenta de nuevo." |

---

## 12. Flujo de Préstamos de Equipos

### Diagrama de flujo completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE PRÉSTAMO                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SOLICITAR                                                   │
│     Usuario selecciona equipo disponible                        │
│     ↓                                                           │
│     crearSolicitudPrestamo() valida:                            │
│       - estado_carne del usuario (activo ✅)                    │
│       - equipo disponible y sin otra solicitud pendiente        │
│     ↓                                                           │
│     Trigger trg_validar_solicitud_prestamo:                     │
│       - Verifica equipo 'disponible' y 'activo'                 │
│       - Verifica sin otra solicitud 'pendiente'/'aceptada'       │
│       - Marca equipo = 'ocupado'                                │
│     ↓                                                           │
│     INSERT prestamos (estado = 'pendiente')                     │
│                                                                  │
│  2. APROBAR                                                     │
│     Admin revisa solicitud                                      │
│     ↓                                                           │
│     aprobarPrestamo() valida:                                   │
│       - estado_carne = 'activo' (UI)                            │
│     ↓                                                           │
│     Trigger trg_prestamo_aceptado:                              │
│       - Valida estado_carne (DB)                                │
│       - Valida sin otra aceptada del mismo equipo               │
│       - estado_carne → 'bloqueado'                              │
│       - equipo → 'ocupado'                                      │
│       - fecha_aceptacion = NOW()                                │
│     ↓                                                           │
│     Trigger trg_notif_prestamo:                                 │
│       - Notificación al usuario: "Préstamo aprobado ✓"          │
│     ↓                                                           │
│     Trigger trg_notif_carne:                                    │
│       - Notificación: "Carné bloqueado"                         │
│                                                                  │
│  3. DEVOLVER                                                    │
│     Admin procesa devolución                                    │
│     ↓                                                           │
│     devolverEquipo() actualiza:                                 │
│       - estado = 'devuelto'                                     │
│     ↓                                                           │
│     Trigger trg_prestamo_aceptado:                              │
│       - estado_carne → 'activo'                                 │
│       - equipo → 'disponible'                                   │
│       - fecha_devolucion = NOW()                                │
│                                                                  │
│  4. RECHAZAR (alternativa al paso 2)                            │
│     Admin rechaza con motivo                                    │
│     ↓                                                           │
│     Trigger trg_prestamo_aceptado:                              │
│       - Verifica otras solicitudes pendientes del equipo        │
│       - Si NO hay → equipo → 'disponible'                       │
│       - Si SÍ hay → equipo sigue 'ocupado'                      │
│     ↓                                                           │
│     Trigger trg_notif_prestamo:                                 │
│       - Notificación: "Préstamo rechazado" + motivo             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Prevención de Race Conditions

| Escenario | Mecanismo de prevención |
|---|---|
| Dos usuarios solicitan el mismo equipo | `trg_validar_solicitud_prestamo` (BEFORE INSERT) verifica atomicamente |
| Dos admins aceptan la misma solicitud | `trg_prestamo_aceptado` verifica sin otra aceptada del mismo equipo |
| Equipo liberado prematuramente al rechazar | Trigger verifica otras solicitudes pendientes antes de liberar |

---

## 13. Estados del Carné Digital

| Estado | Descripción | Cuándo se asigna | Consecuencias |
|---|---|---|---|
| `activo` | Carné operativo | Registro inicial, devolución de equipo | Puede solicitar préstamos |
| `bloqueado` | Carné inhabilitado | Al aceptar un préstamo, bloqueo manual | No puede solicitar préstamos |
| `prestamo` | Carné en uso | (Estado transitorio, ahora se usa `bloqueado`) | No puede solicitar préstamos |
| `vencido` | Carné expirado | Fecha de vencimiento pasada | No puede solicitar préstamos |

### Transiciones de estado

```
activo ──[aceptar préstamo]──→ bloqueado
bloqueado ──[devolver equipo]──→ activo
activo ──[bloqueo manual]──→ bloqueado
bloqueado ──[desbloqueo manual]──→ activo
activo ──[vencimiento]──→ vencido
```

---

## 14. Estilos y Recursos

### 14.1 Sistema de Diseño (`theme.css`)

El archivo `theme.css` define un sistema completo de design tokens:

| Categoría | Variables | Ejemplo |
|---|---|---|
| **Colores primarios** | `--color-primary`, `--color-primary-dark`, `--color-primary-light` | Verde SENA `#007832` |
| **Colores de estado** | `--color-success`, `--color-warning`, `--color-error`, `--color-info` | Verde, amarillo, rojo, azul |
| **Espaciado** | `--space-1` a `--space-12` | Escala de 4px |
| **Tipografía** | `--font-family`, `--font-size-*`, `--font-weight-*` | Calibri, tamaños escalados |
| **Radios** | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full` | 4px a 9999px |
| **Sombras** | `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` | 4 niveles de elevación |
| **Z-Index** | `--z-dropdown`, `--z-sticky`, `--z-overlay`, `--z-modal` | Capas de superposición |
| **Transiciones** | `--transition-fast`, `--transition-normal`, `--transition-slow` | 150ms, 300ms, 500ms |

### 14.2 Recursos de Imagen

| Archivo | Uso |
|---|---|
| `logoSena.png` | Logo institucional en sidebar |
| `PersonaCenicard.png` | Ilustración en Login y Registro |
| `Fondo.jpg` | Fondo de Login |
| `FondoRegistro.jpg` | Fondo de Registro |
| `FondoTarjeta.jpeg` | Fondo del carné digital |
| `Principal.png` | Ilustración del dashboard |
| `Perfil.jpg` | Foto de perfil por defecto |
| `Carnet.png`, `Renta.png`, `Prestamos.png`, `Grafica.png`, `Notificaciones.png`, `Mas.png` | Iconos de la interfaz |

---

## 15. Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:5173)
npm run dev

# Compilar para producción
npm run build

# Vista previa del build
npm run preview

# Ejecutar linter
npm run lint
```

---

## 16. Despliegue

### 16.1 Build de Producción

```bash
npm run build
# Genera archivos optimizados en dist/
```

### 16.2 Opciones de Despliegue

| Plataforma | Configuración |
|---|---|
| **Vercel** | `vercel` (CLI), variables de entorno en panel |
| **Netlify** | Build: `npm run build`, Publish: `dist` |
| **Nginx** | `try_files $uri $uri/ /index.html;` + SSL con Let's Encrypt |

### 16.3 Variables de Entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anon |

### 16.4 Verificación Post-Despliegue

1. Acceder a la URL del sistema
2. Verificar login con credenciales de prueba
3. Verificar que todas las rutas cargan correctamente
4. Verificar conexión con Supabase
5. Verificar generación de PDF
6. Verificar responsive en móvil

---

**Fin del documento.**

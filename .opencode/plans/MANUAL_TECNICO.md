# MANUAL TÉCNICO DEL SISTEMA

## Portada

| Campo | Valor |
|---|---|
| **Entidad** | SENA — Servicio Nacional de Aprendizaje |
| **Nombre del sistema** | CeniCard — Sistema de Carné Digital |
| **Tipo de documento** | Manual Técnico |
| **Versión** | 1.0.0 |
| **Fecha** | Mayo 2026 |
| **Autor** | [Nombre del desarrollador] |

---

## TABLA DE CONTENIDO

1. [Introducción](#1-introducción)
2. [Objetivo](#2-objetivo)
3. [Alcance](#3-alcance)
4. [Arquitectura del sistema](#4-arquitectura-del-sistema)
5. [Tecnologías utilizadas](#5-tecnologías-utilizadas)
6. [Requisitos técnicos](#6-requisitos-técnicos)
7. [Instalación del sistema](#7-instalación-del-sistema)
8. [Base de datos](#8-base-de-datos)
9. [Diagramas UML](#9-diagramas-uml)
10. [Estructura del proyecto](#10-estructura-del-proyecto)
11. [Seguridad](#11-seguridad)
12. [Despliegue](#12-despliegue)
13. [Mantenimiento](#13-mantenimiento)
14. [Control de cambios](#14-control-de-cambios)

---

## 1. Introducción

CeniCard es un sistema web de gestión de carné digital diseñado para el SENA (Servicio Nacional de Aprendizaje). El sistema permite la administración centralizada de carnés digitales, gestión de usuarios por roles, control de préstamos de equipos, generación de noticias institucionales y reportes en formato PDF.

Este documento técnico describe la estructura interna, arquitectura, tecnologías, base de datos, seguridad y procedimientos de instalación y mantenimiento del sistema, con el fin de facilitar su comprensión, soporte y evolución por parte del equipo técnico.

---

## 2. Objetivo

Documentar técnicamente el sistema CeniCard para facilitar:

- **Instalación:** Configuración del entorno de desarrollo y producción.
- **Configuración:** Conexión con Supabase, variables de entorno y parámetros del sistema.
- **Soporte:** Diagnóstico y resolución de incidencias técnicas.
- **Mantenimiento:** Actualizaciones, correcciones y mejoras del sistema.
- **Escalabilidad:** Crecimiento del sistema en funcionalidades y carga de usuarios.

---

## 3. Alcance

Este manual cubre los siguientes aspectos técnicos del sistema:

- Arquitectura cliente-servidor y componentes del sistema.
- Stack tecnológico completo (frontend, backend, base de datos).
- Requisitos técnicos de servidor y cliente.
- Procedimiento de instalación y configuración.
- Modelo de base de datos en Supabase (PostgreSQL).
- Estructura de carpetas y organización del código fuente.
- Mecanismos de seguridad: autenticación, autorización por roles, validaciones.
- Proceso de despliegue en producción.
- Estrategias de mantenimiento preventivo y correctivo.

---

## 4. Arquitectura del sistema

El sistema CeniCard sigue una arquitectura **SPA (Single Page Application)** con separación clara entre cliente y servicios en la nube:

### 4.1 Cliente (Frontend)
- Aplicación React 19 ejecutada en el navegador del usuario.
- Renderizado del lado del cliente con enrutamiento dinámico vía React Router DOM.
- Comunicación directa con Supabase mediante el SDK oficial `@supabase/supabase-js`.
- Estado local gestionado con React Hooks (`useState`, `useEffect`) y React Context para autenticación.

### 4.2 Backend / Servicios (Supabase)
- **Base de datos:** PostgreSQL gestionado por Supabase.
- **Autenticación:** Supabase Auth con email/password.
- **API:** Supabase expone endpoints RESTful y funciones RPC para operaciones de negocio.
- **Políticas RLS:** Row Level Security para control de acceso a nivel de fila.

### 4.3 Base de datos
- PostgreSQL alojado en la infraestructura de Supabase.
- Tablas principales: `usuarios`, `equipos`, `categorias_equipos`, `prestamos`, `noticias`, `notificaciones`, `fichas`, `estadisticas`.
- Relaciones mediante foreign keys y vistas con joins para datos enriquecidos.

### 4.4 Diagrama de arquitectura

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
│  └──────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

---

## 5. Tecnologías utilizadas

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| React | 19.2.0 | Framework principal de UI |
| Vite | 7.3.1 | Build tool y dev server |
| React Router DOM | 7.13.0 | Enrutamiento del lado del cliente |
| SweetAlert2 | 11.26.20 | Notificaciones y diálogos modales |
| Recharts | 3.8.0 | Gráficas estadísticas (barras, pastel) |
| jsPDF | 4.2.1 | Generación de reportes PDF |
| jsPDF-autotable | 5.0.8 | Tablas dentro de PDF |
| html2canvas | 1.4.1 | Captura de componentes como imagen |
| React Icons | 5.6.0 | Biblioteca de iconos |

### Backend / Infraestructura

| Tecnología | Propósito |
|---|---|
| Supabase | Backend-as-a-Service (BaaS) |
| PostgreSQL | Base de datos relacional |
| Supabase Auth | Autenticación de usuarios |
| Supabase Storage | Almacenamiento de archivos (fotos) |
| Row Level Security (RLS) | Políticas de seguridad a nivel de fila |

### Desarrollo

| Tecnología | Propósito |
|---|---|
| ESLint | Linting y calidad de código |
| JavaScript (ES Modules) | Lenguaje principal |
| CSS Variables | Sistema de diseño con tokens |

---

## 6. Requisitos técnicos

### Servidor (Supabase)

| Requisito | Detalle |
|---|---|
| Plataforma | Supabase Cloud (plan gratuito o superior) |
| Base de datos | PostgreSQL 15+ |
| Autenticación | Supabase Auth habilitado (email/password) |
| Storage | Bucket configurado para fotos de usuarios |
| RLS | Políticas de seguridad configuradas por tabla |

### Cliente (Navegador del usuario)

| Requisito | Detalle |
|---|---|
| Navegador | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| JavaScript | Habilitado |
| Resolución mínima | 1024x768 (desktop), 375x667 (móvil) |
| Conexión | Internet estable (HTTPS) |

### Entorno de desarrollo

| Requisito | Detalle |
|---|---|
| Node.js | 18.x o superior |
| npm | 9.x o superior |
| Editor de código | VS Code recomendado |
| Git | Control de versiones |
| Sistema operativo | Windows 10/11, macOS, Linux |

---

## 7. Instalación del sistema

### 7.1 Prerrequisitos

1. Tener Node.js 18+ instalado (verificar con `node -v`).
2. Tener npm instalado (verificar con `npm -v`).
3. Tener una cuenta y proyecto activo en Supabase.

### 7.2 Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd CeniCardWeb2
```

### 7.3 Instalar dependencias

```bash
npm install
```

### 7.4 Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto con las credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

> **Nota:** Estas variables se utilizan en `src/supabaseClient.js` para inicializar el cliente de Supabase.

### 7.5 Configurar la base de datos en Supabase

1. Acceder al panel de Supabase → SQL Editor.
2. Ejecutar el script de creación de tablas (ver sección 8).
3. Configurar las políticas RLS para cada tabla.
4. Habilitar Supabase Auth con provider email/password.
5. Crear un bucket de Storage para las fotos de usuarios.

### 7.6 Ejecutar en modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### 7.7 Compilar para producción

```bash
npm run build
```

Los archivos compilados se generan en la carpeta `dist/`.

### 7.8 Vista previa de producción

```bash
npm run preview
```

---

## 8. Base de datos

### 8.1 Modelo relacional

El sistema utiliza las siguientes tablas principales en PostgreSQL:

| Tabla | Descripción |
|---|---|
| `usuarios` | Datos personales, credenciales, rol, estado del carné |
| `equipos` | Inventario de equipos con categoría, estado, serial |
| `categorias_equipos` | Categorías de equipos (portátiles, herramientas, etc.) |
| `prestamos` | Solicitudes y préstamos de equipos con estados |
| `noticias` | Noticias institucionales publicadas |
| `notificaciones` | Notificaciones push para usuarios |
| `fichas` | Fichas de formación del SENA |
| `estadisticas` | Datos para dashboard y reportes |

### 8.2 Diagrama de relaciones

```
usuarios (1) ──── (N) prestamos
usuarios (1) ──── (N) noticias
usuarios (1) ──── (N) notificaciones

categorias_equipos (1) ──── (N) equipos

equipos (1) ──── (N) prestamos

fichas (1) ──── (N) usuarios
```

### 8.3 Diccionario de datos — Tabla `usuarios`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | UUID | NO | Identificador único |
| `primer_nombre` | VARCHAR(50) | NO | Primer nombre |
| `segundo_nombre` | VARCHAR(50) | SÍ | Segundo nombre |
| `primer_apellido` | VARCHAR(50) | NO | Primer apellido |
| `segundo_apellido` | VARCHAR(50) | SÍ | Segundo apellido |
| `numero_cc` | VARCHAR(20) | NO | Número de documento de identidad |
| `correo` | VARCHAR(100) | NO | Correo electrónico (usado para auth) |
| `celular` | VARCHAR(15) | SÍ | Número de celular |
| `rol` | VARCHAR(20) | NO | Rol: admin, funcionario, instructor, contratista, aprendiz |
| `estado_carne` | VARCHAR(20) | NO | Estado del carné: activo, bloqueado, prestamo, vencido |
| `centro_formacion` | VARCHAR(100) | SÍ | Centro de formación SENA |
| `regional` | VARCHAR(50) | SÍ | Regional SENA |
| `rh` | VARCHAR(5) | SÍ | Tipo de sangre |
| `eps` | VARCHAR(50) | SÍ | EPS afiliada |
| `foto_url` | TEXT | SÍ | URL de la foto del usuario |
| `created_at` | TIMESTAMP | NO | Fecha de creación |

### 8.4 Diccionario de datos — Tabla `equipos`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | UUID | NO | Identificador único |
| `numero` | INTEGER | NO | Número de equipo |
| `categoria_id` | UUID | NO | FK → categorias_equipos |
| `marca` | VARCHAR(50) | SÍ | Marca del equipo |
| `modelo` | VARCHAR(50) | SÍ | Modelo del equipo |
| `serial` | VARCHAR(50) | SÍ | Número de serial |
| `descripcion` | TEXT | SÍ | Descripción del equipo |
| `estado` | VARCHAR(20) | NO | disponible, no_disponible, ocupado |
| `created_at` | TIMESTAMP | NO | Fecha de creación |

### 8.5 Diccionario de datos — Tabla `prestamos`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | UUID | NO | Identificador único |
| `usuario_id` | UUID | NO | FK → usuarios |
| `equipo_id` | UUID | NO | FK → equipos |
| `estado` | VARCHAR(20) | NO | pendiente, aceptado, devuelto, rechazado |
| `fecha_solicitud` | TIMESTAMP | NO | Fecha de la solicitud |
| `fecha_aceptacion` | TIMESTAMP | SÍ | Fecha de aceptación |
| `fecha_devolucion` | TIMESTAMP | SÍ | Fecha de devolución |
| `motivo_rechazo` | TEXT | SÍ | Motivo del rechazo |
| `admin_id` | UUID | SÍ | FK → usuarios (admin que procesó) |
| `created_at` | TIMESTAMP | NO | Fecha de creación |

### 8.6 Diccionario de datos — Tabla `categorias_equipos`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | UUID | NO | Identificador único |
| `nombre` | VARCHAR(50) | NO | Nombre de la categoría |
| `icono` | VARCHAR(10) | SÍ | Emoji/icono representativo |
| `descripcion` | TEXT | SÍ | Descripción de la categoría |
| `activa` | BOOLEAN | NO | Estado de la categoría |
| `created_at` | TIMESTAMP | NO | Fecha de creación |

### 8.7 Diccionario de datos — Tabla `noticias`

| Campo | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | UUID | NO | Identificador único |
| `titulo` | VARCHAR(200) | NO | Título de la noticia |
| `descripcion` | TEXT | NO | Contenido de la noticia |
| `imagen_url` | TEXT | SÍ | URL de imagen destacada |
| `creado_por` | UUID | NO | FK → usuarios |
| `publicado` | BOOLEAN | NO | Estado de publicación |
| `created_at` | TIMESTAMP | NO | Fecha de creación |

---

## 9. Diagramas UML

### 9.1 Diagrama de casos de uso

```
┌─────────────────────────────────────────────────────┐
│                    SISTEMA CENICARD                  │
│                                                      │
│   ┌─────────────────┐                                │
│   │   Aprendiz       │── (bloqueado del sistema)     │
│   └─────────────────┘                                │
│                                                      │
│   ┌─────────────────┐    ┌──────────────────────┐   │
│   │ Instructor       │───>│ Ver carné digital     │   │
│   │ Contratista      │    │ Ver información       │   │
│   └─────────────────┘    └──────────────────────┘   │
│                                                      │
│   ┌─────────────────┐    ┌──────────────────────┐   │
│   │ Funcionario      │    │ Gestionar usuarios    │   │
│   │ Admin            │───>│ Gestionar equipos     │   │
│   └─────────────────┘    │ Gestionar categorías  │   │
│                          │ Gestionar noticias    │   │
│                          │ Aprobar/rechazar      │   │
│                          │   préstamos           │   │
│                          │ Liberar equipos       │   │
│                          │ Ver historial         │   │
│                          │ Generar reporte PDF   │   │
│                          │ Gestionar perfil      │   │
│                          │ Bloquear/desbloquear  │   │
│                          │   carné               │   │
│                          └──────────────────────┘   │
│                                                      │
│   ┌─────────────────┐    ┌──────────────────────┐   │
│   │ Todos los roles  │───>│ Iniciar sesión        │   │
│   │ (excepto apren.) │    │ Cerrar sesión         │   │
│   └─────────────────┘    │ Registrarse           │   │
│                          │ Ver estadísticas      │   │
│                          │ Recibir notificaciones│   │
│                          └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 9.2 Diagrama de clases (Componentes principales)

```
┌──────────────────────────────┐
│       AuthProvider           │
├──────────────────────────────┤
│ - user: object               │
│ - rol: string                │
│ - loading: boolean           │
├──────────────────────────────┤
│ + login()                    │
│ + logout()                   │
│ + getSession()               │
│ + onAuthStateChange()        │
└──────────────┬───────────────┘
               │
               │ useAuth()
               ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│   Login     │  │ProtectedRoute│  │ProtectedRoute│
│             │  │              │  │   ByRole     │
├─────────────┤  ├──────────────┤  ├──────────────┤
│ + handleSubmit│ │ + children  │  │ + children   │
│ + navigate  │  │ + redirect  │  │ + allowedRoles│
└─────────────┘  └──────────────┘  └──────────────┘

┌──────────────────────────────┐
│       Layout                 │
├──────────────────────────────┤
│ - sidebarOpen: boolean       │
├──────────────────────────────┤
│ + toggleSidebar()            │
│ + render(children)           │
└──────────────┬───────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────────┐
│ Header │ │  Menu  │ │  Content   │
│        │ │Lateral │ │  (children)│
└────────┘ └────────┘ └────────────┘

┌──────────────────────────────┐
│       ErrorBoundary          │
├──────────────────────────────┤
│ - hasError: boolean          │
│ - error: object              │
├──────────────────────────────┤
│ + getDerivedStateFromError() │
│ + componentDidCatch()        │
│ + handleRetry()              │
└──────────────────────────────┘
```

### 9.3 Diagrama de secuencia — Flujo de Login

```
Usuario         Login.jsx        authService        Supabase
  │                │                  │                 │
  │──Ingresa doc──>│                  │                 │
  │  y contraseña  │                  │                 │
  │                │                  │                 │
  │──Click Login──>│                  │                 │
  │                │──select usuario──>│                 │
  │                │  por numero_cc   │                 │
  │                │                  │──Query SQL──────>│
  │                │                  │<──User data──────│
  │                │<─────────────────│                 │
  │                │                  │                 │
  │                │──signInWithPwd──>│                 │
  │                │                  │──Auth request───>│
  │                │                  │<──Session────────│
  │                │<─────────────────│                 │
  │                │                  │                 │
  │                │──localStorage────│                 │
  │                │  user_rol,       │                 │
  │                │  user_nombre     │                 │
  │                │                  │                 │
  │                │──navigate()──────│                 │
  │                │  según rol       │                 │
  │<──Redirigido───│                  │                 │
```

### 9.4 Diagrama de secuencia — Aprobar Préstamo

```
Admin        Solicitudes.jsx    prestamoService    Supabase
  │                │                  │                 │
  │──Click        │                  │                 │
  │  Aprobar─────>│                  │                 │
  │                │                  │                 │
  │──Confirmar    │                  │                 │
  │  en Swal─────>│                  │                 │
  │                │──aprobarPrestamo>│                 │
  │                │  (id, admin_id)  │                 │
  │                │                  │──RPC call──────>│
  │                │                  │  update estado  │
  │                │                  │  a "aceptado"   │
  │                │                  │<──OK────────────│
  │                │<─────────────────│                 │
  │                │                  │                 │
  │                │──cargarDatos()──>│                 │
  │                │                  │──Query─────────>│
  │                │                  │<──Data──────────│
  │                │<─────────────────│                 │
  │                │                  │                 │
  │<──Swal "Éxito"─│                  │                 │
```

---

## 10. Estructura del proyecto

```
CeniCardWeb2/
│
├── .git/                           # Repositorio Git
├── .gitignore                      # Archivos ignorados por Git
├── index.html                      # Punto de entrada HTML
├── package.json                    # Dependencias y scripts
├── package-lock.json               # Lock de dependencias
├── eslint.config.js                # Configuración de ESLint
├── vite.config.js                  # Configuración de Vite
├── README.md                       # Documentación del proyecto
│
├── public/
│   └── favicon.ico                 # Icono del sitio
│
├── dist/                           # Build de producción (generado)
│
└── src/
    ├── main.jsx                    # Punto de entrada de React
    ├── App.jsx                     # Configuración de rutas
    ├── supabaseClient.js           # Cliente de Supabase
    │
    ├── Components/                 # Componentes React (17 archivos)
    │   ├── Login.jsx               # Página de inicio de sesión
    │   ├── Registro.jsx            # Página de registro
    │   ├── Principal.jsx           # Dashboard principal con estadísticas
    │   ├── Menu.jsx                # Menú lateral de navegación
    │   ├── Header.jsx              # Barra superior con info del usuario
    │   ├── Layout.jsx              # Layout wrapper (sidebar + header + content)
    │   ├── Usuarios.jsx            # CRUD de usuarios y gestión de carné
    │   ├── Solicitudes.jsx         # Aprobación/rechazo de préstamos
    │   ├── Servicios.jsx           # Gestión de noticias y equipos
    │   ├── Perfil.jsx              # Perfil de usuario y carné
    │   ├── Historial.jsx           # Historial de préstamos + reporte PDF
    │   ├── Añadir.jsx              # Gestión de equipos entregados
    │   ├── Categorias.jsx          # CRUD de categorías de equipos
    │   ├── Carnes.jsx              # Visualizador de carné digital
    │   ├── ProtectedRoute.jsx      # Guard de autenticación
    │   ├── ProtectedRouteByRole.jsx# Guard de autenticación por rol
    │   └── ErrorBoundary.jsx       # Error boundary de React
    │
    ├── Context/                    # Contexto de React
    │   ├── AuthContext.js          # Creación del contexto de auth
    │   └── AuthProvider.jsx        # Provider con estado de autenticación
    │
    ├── services/                   # Capa de servicios/API (12 archivos)
    │   ├── authService.js          # Login, registro, sesión, perfil
    │   ├── userService.js          # CRUD de usuarios
    │   ├── equipoService.js        # CRUD de equipos y categorías
    │   ├── prestamoService.js      # Gestión de préstamos
    │   ├── noticiaService.js       # CRUD de noticias
    │   ├── notificacionService.js  # Gestión de notificaciones
    │   ├── estadisticaService.js   # Estadísticas del dashboard
    │   ├── historialService.js     # Historial de préstamos
    │   ├── fichaService.js         # CRUD de fichas de formación
    │   ├── errorService.js         # Clasificación y manejo de errores
    │   ├── utils.js                # Utilidades generales
    │   └── index.js                # Barrel export
    │
    ├── Style/                      # Hojas de estilo CSS (14 archivos)
    │   ├── theme.css               # Design tokens y variables CSS
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
    ├── utils/                      # Utilidades
    │   └── errorHandler.js         # Manejadores globales de errores
    │
    └── Img/                        # Recursos de imagen (14 archivos)
```

---

## 11. Seguridad

### 11.1 Autenticación

- **Mecanismo:** Supabase Auth con email y contraseña.
- **Flujo:** El usuario ingresa número de documento y contraseña → se busca el correo asociado → se autentica con Supabase Auth.
- **Sesión:** Token JWT gestionado automáticamente por Supabase con refresh automático.
- **Persistencia:** Sesión almacenada en localStorage del navegador.
- **Logout:** Limpieza de localStorage + `supabase.auth.signOut()`.

### 11.2 Autorización por roles

| Rol | Acceso |
|---|---|
| `admin` | Acceso completo a todas las rutas y funcionalidades |
| `funcionario` | Acceso completo a rutas de gestión (sin administración de roles) |
| `instructor` | Acceso a `/Carnes` — visualización de carné digital |
| `contratista` | Acceso a `/Carnes` — visualización de carné digital |
| `aprendiz` | **Bloqueado** — no puede acceder al sistema |

- **Implementación:** Doble capa de protección:
  1. Redirección basada en rol después del login (`Login.jsx`).
  2. Guards de ruta (`ProtectedRouteByRole.jsx`) que validan el rol antes de renderizar.

### 11.3 Validaciones

| Nivel | Validación |
|---|---|
| **Frontend — formulario** | Campos requeridos, longitud mínima de contraseña (6 caracteres), formato de email |
| **Frontend — servicio** | Allowlist de campos permitidos en actualizaciones (`camposPermitidos`) |
| **Base de datos** | Constraints de NOT NULL, UNIQUE, FOREIGN KEY, CHECK |
| **Supabase RLS** | Políticas de Row Level Security por tabla |

### 11.4 Protección de datos

- **Contraseñas:** Hasheadas automáticamente por Supabase Auth (bcrypt).
- **Tokens JWT:** Firmados digitalmente, expiración configurable.
- **Variables de entorno:** Credenciales de Supabase en `.env` (no commitear).
- **HTTPS:** Obligatorio en producción.
- **CORS:** Configurado en Supabase para dominios autorizados.

### 11.5 Manejo de errores

- **Capa 1 — Global:** `window.onerror` + `unhandledrejection` con debounce de 5 segundos.
- **Capa 2 — ErrorBoundary:** Captura errores de renderizado de React con fallback UI.
- **Capa 3 — API:** Clasificación de errores en 6 tipos con mensajes en español para el usuario.

---

## 12. Despliegue

### 12.1 Preparación del build

```bash
npm run build
```

Esto genera los archivos optimizados en la carpeta `dist/`.

### 12.2 Opciones de despliegue

#### Opción A: Vercel (Recomendado)

1. Instalar Vercel CLI: `npm i -g vercel`
2. Ejecutar: `vercel`
3. Seguir las instrucciones del asistente.
4. Configurar variables de entorno en el panel de Vercel.

#### Opción B: Netlify

1. Conectar el repositorio de GitHub a Netlify.
2. Configurar build command: `npm run build`
3. Configurar publish directory: `dist`
4. Agregar variables de entorno en el panel de Netlify.

#### Opción C: Servidor propio (Nginx)

1. Copiar el contenido de `dist/` al directorio del servidor.
2. Configurar Nginx para SPA:

```nginx
server {
    listen 80;
    server_name cenicard.tudominio.com;
    root /var/www/cenicard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. Configurar SSL con Let's Encrypt:

```bash
sudo certbot --nginx -d cenicard.tudominio.com
```

### 12.3 Variables de entorno en producción

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública anon de Supabase |

### 12.4 Verificación post-despliegue

1. Acceder a la URL del sistema.
2. Verificar login con credenciales de prueba.
3. Verificar que todas las rutas cargan correctamente.
4. Verificar conexión con Supabase (datos se muestran).
5. Verificar generación de PDF.
6. Verificar responsive en móvil.

---

## 13. Mantenimiento

### 13.1 Mantenimiento preventivo

| Actividad | Frecuencia | Descripción |
|---|---|---|
| Actualizar dependencias | Mensual | `npm update` y verificar compatibilidad |
| Revisar logs de Supabase | Semanal | Detectar errores de base de datos o auth |
| Verificar backups | Semanal | Confirmar que los backups automáticos de Supabase funcionan |
| Revisar rendimiento | Mensual | Monitorear tiempos de respuesta de consultas |
| Actualizar documentación | Según cambios | Mantener este manual actualizado |

### 13.2 Mantenimiento correctivo

| Situación | Acción |
|---|---|
| Error en producción | Revisar logs de Supabase → identificar causa → corregir código → deploy |
| Caída de Supabase | Verificar status.supabase.com → reportar si es outage global |
| Sesiones expiradas | Verificar configuración de token expiry en Supabase |
| Error de CORS | Verificar allowed origins en configuración de Supabase |
| Datos inconsistentes | Ejecutar scripts de corrección en SQL Editor de Supabase |

### 13.3 Procedimiento de actualización

1. Crear rama de feature/fix: `git checkout -b fix/nombre-del-issue`
2. Realizar cambios y probar localmente: `npm run dev`
3. Ejecutar lint: `npm run lint`
4. Compilar: `npm run build`
5. Commit y push: `git commit -m "fix: descripción"`
6. Crear Pull Request y revisar.
7. Merge a main y deploy automático.

### 13.4 Monitoreo

| Aspecto | Herramienta |
|---|---|
| Logs de errores | Consola del navegador + logs de Supabase |
| Rendimiento | Supabase Dashboard → Database → Metrics |
| Autenticación | Supabase Dashboard → Auth → Users |
| Uso de base de datos | Supabase Dashboard → Database → Tables |
| Almacenamiento | Supabase Dashboard → Storage |

---

## 14. Control de cambios

| Versión | Fecha | Autor | Descripción del cambio |
|---|---|---|---|
| 1.0.0 | Mayo 2026 | [Autor] | Versión inicial del manual técnico |
| | | | |
| | | | |
| | | | |

---

**Fin del documento.**

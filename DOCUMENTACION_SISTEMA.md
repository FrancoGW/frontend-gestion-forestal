# Documentación del Sistema de Gestión Forestal

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura Técnica](#arquitectura-técnica)
3. [Roles y Permisos](#roles-y-permisos)
4. [Funcionalidades por Rol](#funcionalidades-por-rol)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Tecnologías Utilizadas](#tecnologías-utilizadas)
7. [APIs y Endpoints](#apis-y-endpoints)
8. [Flujos de Trabajo Principales](#flujos-de-trabajo-principales)
9. [Mantenimiento y Tickets](#mantenimiento-y-tickets)

---

## 📖 Descripción General

Sistema web de gestión forestal desarrollado con **Next.js 14** que permite la administración completa de órdenes de trabajo, avances, proveedores, supervisores y actividades forestales. El sistema está diseñado para gestionar operaciones forestales complejas con múltiples roles de usuario y flujos de trabajo especializados.

### Características Principales
- ✅ Gestión de órdenes de trabajo forestales
- ✅ Seguimiento de avances de trabajo
- ✅ Administración de proveedores y supervisores
- ✅ Sistema de roles y permisos
- ✅ Reportes y estadísticas
- ✅ Gestión de actividades sin órdenes
- ✅ Dashboard personalizado por rol

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

#### Frontend
- **Framework**: Next.js 14.2.16 (App Router)
- **Lenguaje**: TypeScript 5
- **UI Components**: Radix UI + shadcn/ui
- **Estilos**: Tailwind CSS 3.4.17
- **Estado**: React Query (TanStack Query)
- **Formularios**: React Hook Form + Zod
- **HTTP Client**: Axios con retry logic
- **Gráficos**: Recharts
- **Exportación**: jsPDF, xlsx

#### Backend (Externo)
- **URL Base**: `https://backend-gestion-forestal.vercel.app`
- **Comunicación**: REST API
- **Autenticación**: Session-based (sessionStorage)

### Estructura de Carpetas

```
frontend-gestion-forestal/
├── app/                    # Next.js App Router
│   ├── admin/              # Panel de administración
│   ├── supervisor/         # Panel de supervisor
│   ├── jda/                # Panel de Jefe de Área
│   ├── proveedor/          # Panel de proveedor
│   ├── login/              # Página de login
│   └── api/                # API routes (Next.js)
├── components/             # Componentes React reutilizables
│   ├── ui/                 # Componentes UI base (shadcn)
│   ├── admin-sidebar.tsx
│   ├── supervisor/
│   ├── jda/
│   └── provider/
├── hooks/                  # Custom React hooks
├── lib/                    # Utilidades y configuraciones
│   ├── api-client.ts       # Cliente API principal
│   └── react-query.tsx    # Configuración React Query
├── types/                  # Definiciones TypeScript
├── utils/                  # Funciones utilitarias
└── public/                 # Archivos estáticos
```

---

## 👥 Roles y Permisos

El sistema cuenta con **4 roles principales**:

### 1. **Admin** (Administrador)
- **Acceso**: `/admin`
- **Permisos**: Acceso completo al sistema
- **Descripción**: Control total sobre todas las funcionalidades del sistema

### 2. **Supervisor**
- **Acceso**: `/supervisor`
- **Permisos**: Gestión de proveedores asignados, supervisión de avances
- **Descripción**: Supervisa el trabajo de proveedores asignados

### 3. **JDA** (Jefe de Área)
- **Acceso**: `/jda`
- **Permisos**: Vista ampliada de supervisores y avances de su área
- **Descripción**: Gestiona múltiples supervisores y tiene visión estratégica

### 4. **Provider** (Proveedor)
- **Acceso**: `/proveedor`
- **Permisos**: Gestión de sus propias órdenes y avances
- **Descripción**: Registra avances de trabajo y gestiona órdenes asignadas

### Sistema de Autenticación

- **Método**: SessionStorage + Backend API
- **Fallback**: Usuarios de emergencia cuando el backend no está disponible
- **Middleware**: Protección de rutas a nivel de Next.js
- **Componente**: `ProtectedRoute` para verificación de roles

---

## 🎯 Funcionalidades por Rol

### 🔴 ADMINISTRADOR (`/admin`)

#### Dashboard Principal
- Vista general de órdenes pendientes, aprobadas y finalizadas
- Estadísticas del mes actual
- Métricas de hectáreas procesadas
- Lista de órdenes recientes

#### Gestión de Usuarios (`/admin/usuarios`)
- Crear, editar y eliminar usuarios
- Asignar roles (admin, supervisor, provider, jda)
- Activar/desactivar usuarios
- Gestionar información de contacto

#### Gestión de Supervisores (`/admin/supervisores`)
- CRUD completo de supervisores
- Asignación de proveedores a supervisores
- Gestión de información de contacto

#### Órdenes de Trabajo (`/admin/ordenes`)
- Ver todas las órdenes del sistema
- Crear nuevas órdenes de trabajo
- Editar órdenes existentes
- Aprobar/rechazar órdenes
- Ver detalles completos de órdenes
- Filtrar por estado, proveedor, fecha, etc.

#### Avances (`/admin/avances`)
- Ver todos los avances registrados
- Filtrar por proveedor, supervisor, fecha
- Ver avances por proveedor específico
- Exportar datos a Excel

#### Empresas / Proveedores (`/admin/empresas`)
- CRUD completo de empresas/proveedores
- Gestión de información empresarial
- Asignación de supervisores

#### Propietarios (`/admin/propietarios`)
- Gestión de propietarios de campos
- Información de contacto y ubicación

#### Configuración del Sistema (Menú "Otros")

**Actividades** (`/admin/actividades`)
- Definir tipos de actividades forestales
- Configurar parámetros de actividades

**Sub-Actividades** (`/admin/sub-actividades`)
- Gestión de sub-actividades
- Relación con actividades principales

**Plantillas** (`/admin/plantillas`)
- Crear plantillas de órdenes de trabajo
- Reutilización de configuraciones

**Cuadrillas** (`/admin/cuadrillas`)
- Gestión de cuadrillas de trabajo
- Asignación de trabajadores

**Zonas** (`/admin/zonas`)
- Definición de zonas geográficas
- Organización territorial

**Campos** (`/admin/campos`)
- Gestión de campos/predios
- Información geográfica

**Tipos de Uso** (`/admin/tipos-uso`)
- Clasificación de tipos de uso de suelo

**Especies** (`/admin/especies`)
- Catálogo de especies forestales
- Características y propiedades

**Viveros** (`/admin/viveros`)
- Gestión de viveros
- Clones y especies asociadas
- Estadísticas de producción

**Aspectos Ambientales** (`/admin/ambientales`)
- Registro de consideraciones ambientales

**Insumos** (`/admin/insumos`)
- Catálogo de insumos forestales
- Gestión de productos químicos y materiales

**Malezas Productos** (`/admin/malezas-productos`)
- Gestión de productos para control de malezas

**Vecinos** (`/admin/vecinos`)
- Registro de vecinos de campos
- Información de contacto

**Estadísticas** (`/admin/estadisticas`)
- Reportes y análisis del sistema
- Gráficos y métricas

---

### 🟣 SUPERVISOR (`/supervisor`)

#### Dashboard (`/supervisor`)
- Vista de avances de proveedores asignados
- Filtros por fecha, proveedor, orden, rodal, actividad
- Tabla detallada de avances con información completa
- Exportación a Excel
- Estadísticas de avances
- Estados de supervisión (pendiente, aprobado, rechazado)

#### Mis Proveedores (`/supervisor/proveedores`)
- Lista de proveedores asignados
- Información de contacto
- Estadísticas por proveedor

#### Órdenes de Trabajo (`/supervisor/ordenes`)
- Ver órdenes de proveedores asignados
- Detalles de órdenes
- Filtros y búsqueda

#### Informes de Avances (`/supervisor/informes`)
- Reportes de avances
- Análisis de progreso
- Exportación de datos

---

### 🟢 JEFE DE ÁREA - JDA (`/jda`)

#### Dashboard (`/jda`)
- Vista ampliada de todos los supervisores del área
- Avances de todos los proveedores bajo supervisión
- Filtros avanzados (fecha, proveedor, supervisor, rodal, orden, actividad, estado)
- Tabla consolidada de avances
- Exportación a Excel
- Estadísticas agregadas

#### Mis Supervisores (`/jda/supervisores`)
- Lista de supervisores bajo su gestión
- Información de contacto
- Métricas por supervisor

#### Órdenes de Trabajo (`/jda/ordenes`)
- Vista de todas las órdenes del área
- Filtros y búsqueda avanzada

#### Informes de Avances (`/jda/informes`)
- Reportes consolidados del área
- Análisis estratégico
- Exportación de datos

---

### 🟡 PROVEEDOR (`/proveedor`)

#### Inicio (`/proveedor`)
- Dashboard básico
- Acceso rápido a funcionalidades principales

#### Mis Órdenes (`/proveedor/ordenes`)
- Lista de órdenes asignadas
- Estados: pendiente, aprobado, finalizado
- Filtros por estado y fecha
- Ver detalles de órdenes
- Información de rodales y actividades

#### Sin Órdenes (`/proveedor/sin-ordenes`)
- **Funcionalidad especial**: Registrar actividades sin orden de trabajo asociada
- **Actividades disponibles**:
  - **Quema Controlada Protección**: Registro de quemas controladas
  - **Mantenimiento Alambrado**: Reparación y mantenimiento de alambrados
  - **Mantenimiento de cortafuego**: Mantenimiento de cortafuegos
- Formularios específicos por tipo de actividad
- Registro de cuadrillas, fechas, ubicaciones
- Gestión de vecinos (para quemas controladas)
- Historial de avances recientes

#### Avances (`/proveedor/avances`)
- **Registro de avances de trabajo**:
  - Crear nuevos avances
  - Editar avances existentes
  - Eliminar avances (con confirmación)
- Filtros por fecha, orden, actividad
- Búsqueda de avances
- Paginación de resultados
- Información detallada:
  - Fecha y jornada
  - Cuadrilla asignada
  - Hectáreas trabajadas
  - Especies, viveros, clones (para plantaciones)
  - Observaciones
  - Estado de supervisión
- Resolución de nombres de especies, viveros y clones
- Validaciones de formulario

#### Mi Perfil (`/proveedor/perfil`)
- Información del proveedor
- Datos de contacto
- CUIT y teléfono
- Edición de perfil

#### Reportes (`/proveedor/reportes`)
- Generación de reportes propios
- Filtros por fecha y tipo
- Estadísticas de órdenes
- Exportación de datos

---

## 🔧 Estructura del Proyecto

### Componentes Principales

#### Sidebars (Navegación)
- `components/admin-sidebar.tsx`: Navegación del admin con menú colapsable "Otros"
- `components/supervisor/supervisor-sidebar.tsx`: Navegación del supervisor
- `components/jda/jda-sidebar.tsx`: Navegación del JDA
- `components/provider/provider-sidebar.tsx`: Navegación del proveedor

#### Componentes de UI Reutilizables
- `components/ui/`: Componentes base de shadcn/ui (Button, Card, Dialog, Table, etc.)
- `components/admin-collection-page.tsx`: Página genérica para CRUD de colecciones
- `components/admin-data-table.tsx`: Tabla de datos con paginación y filtros
- `components/work-order-card.tsx`: Tarjeta de orden de trabajo
- `components/provider/work-progress-form.tsx`: Formulario de avance de trabajo
- `components/provider/work-progress-table.tsx`: Tabla de avances

#### Hooks Personalizados

**Autenticación**
- `hooks/use-auth.ts`: Manejo de autenticación y sesión

**Datos**
- `hooks/use-work-orders.ts`: Gestión de órdenes de trabajo
- `hooks/use-work-progress.ts`: Gestión de avances
- `hooks/use-provider-orders.ts`: Órdenes del proveedor
- `hooks/use-provider-work-data.ts`: Datos de trabajo del proveedor
- `hooks/use-supervisor-data.ts`: Datos del supervisor
- `hooks/use-jda-data.ts`: Datos del JDA
- `hooks/use-providers.ts`: Gestión de proveedores
- `hooks/use-supervisors.ts`: Gestión de supervisores
- `hooks/use-cuadrillas.ts`: Gestión de cuadrillas
- `hooks/use-activities.ts`: Actividades forestales
- `hooks/use-viveros.ts`: Gestión de viveros
- `hooks/use-vecinos.ts`: Gestión de vecinos

**Otros**
- `hooks/use-admin-collection.ts`: Hook genérico para CRUD de colecciones
- `hooks/use-toast.ts`: Notificaciones toast
- `hooks/use-mobile.tsx`: Detección de dispositivos móviles
- `hooks/useFrontendVersion.ts`: Control de versiones del frontend

### Cliente API

**`lib/api-client.ts`**: Cliente centralizado para comunicación con el backend

**Endpoints principales**:
- `/api/ordenesTrabajoAPI`: Órdenes de trabajo
- `/api/avancesAPI`: Avances de trabajo
- `/api/proveedoresAPI`: Proveedores
- `/api/supervisoresAPI`: Supervisores
- `/api/usuariosAdminAPI`: Usuarios
- `/api/cuadrillasAPI`: Cuadrillas
- `/api/actividadesAPI`: Actividades
- `/api/viverosAPI`: Viveros
- `/api/vecinosAPI`: Vecinos
- Y más...

**Características**:
- Retry logic con axios-retry
- Timeout de 30 segundos
- Interceptores para logging
- Manejo de errores centralizado

### Tipos TypeScript

- `types/work-order.ts`: Tipos de órdenes de trabajo
- `types/AvanceExtendido.ts`: Tipos de avances extendidos
- `types/activity.ts`: Tipos de actividades
- `types/cuadrilla.ts`: Tipos de cuadrillas
- `types/provider-work-data.ts`: Datos de trabajo del proveedor

---

## 🛠️ Tecnologías Utilizadas

### Dependencias Principales

```json
{
  "next": "14.2.16",
  "react": "^18",
  "typescript": "^5",
  "tailwindcss": "^3.4.17",
  "@tanstack/react-query": "latest",
  "axios": "latest",
  "axios-retry": "latest",
  "react-hook-form": "^7.54.1",
  "zod": "^3.24.1",
  "recharts": "latest",
  "jspdf": "^3.0.1",
  "xlsx": "latest"
}
```

### Componentes UI (Radix UI)
- Dialog, Dropdown, Select, Table, Tabs, Toast, etc.
- Sistema de diseño basado en shadcn/ui

---

## 🔌 APIs y Endpoints

### Backend Base URL
```
https://backend-gestion-forestal.vercel.app
```

### Endpoints Principales

#### Órdenes de Trabajo
- `GET /api/ordenesTrabajoAPI`: Listar órdenes (con paginación y filtros)
- `GET /api/ordenesTrabajoAPI/:id`: Obtener orden por ID
- `POST /api/ordenesTrabajoAPI`: Crear orden
- `PUT /api/ordenesTrabajoAPI/:id`: Actualizar orden
- `DELETE /api/ordenesTrabajoAPI/:id`: Eliminar orden

#### Avances
- `GET /api/avancesAPI`: Listar avances
- `GET /api/avancesAPI/:id`: Obtener avance por ID
- `POST /api/avancesAPI`: Crear avance
- `PUT /api/avancesAPI/:id`: Actualizar avance
- `DELETE /api/avancesAPI/:id`: Eliminar avance

#### Proveedores
- `GET /api/proveedoresAPI`: Listar proveedores
- `POST /api/proveedoresAPI`: Crear proveedor
- `PUT /api/proveedoresAPI/:id`: Actualizar proveedor

#### Autenticación
- `POST /api/usuariosAdminAPI/login`: Login de usuario

---

## 🔄 Flujos de Trabajo Principales

### 1. Flujo de Orden de Trabajo

```
Admin crea orden → Asigna a proveedor → Proveedor ve orden → 
Proveedor registra avances → Supervisor supervisa → 
JDA revisa → Admin aprueba/finaliza
```

### 2. Flujo de Avance de Trabajo

```
Proveedor registra avance → Sistema valida datos → 
Avance queda en "pendiente" → Supervisor revisa → 
Supervisor aprueba/rechaza → Estado actualizado
```

### 3. Flujo de Actividad Sin Orden

```
Proveedor selecciona actividad sin orden → Completa formulario específico → 
Registra datos (fecha, cuadrilla, ubicación, etc.) → 
Sistema guarda avance → Aparece en historial
```

### 4. Flujo de Autenticación

```
Usuario ingresa credenciales → Sistema valida con backend → 
Si falla, intenta usuarios de emergencia → 
Guarda sesión en sessionStorage → 
Redirige según rol → Protege rutas con middleware
```

---

## 🎫 Mantenimiento y Tickets

### Áreas de Mantenimiento Identificadas

#### 🔴 Crítico

1. **Autenticación y Seguridad**
   - Implementar cookies de sesión en lugar de sessionStorage
   - Mejorar middleware de Next.js para verificación de sesión
   - Implementar refresh tokens
   - Agregar CSRF protection

2. **Manejo de Errores**
   - Mejorar manejo de errores de red
   - Implementar retry logic más robusto
   - Agregar fallbacks cuando el backend no está disponible
   - Mejorar mensajes de error para usuarios

3. **Performance**
   - Optimizar queries de React Query
   - Implementar paginación en todas las listas grandes
   - Lazy loading de componentes
   - Optimización de imágenes

#### 🟡 Importante

4. **Validaciones**
   - Validaciones más estrictas en formularios
   - Validación de datos en tiempo real
   - Mensajes de error más descriptivos

5. **Testing**
   - Agregar tests unitarios
   - Tests de integración
   - Tests E2E con Playwright/Cypress

6. **Documentación de Código**
   - Comentar funciones complejas
   - Documentar props de componentes
   - Agregar JSDoc donde sea necesario

#### 🟢 Mejoras

7. **UX/UI**
   - Mejorar feedback visual en acciones
   - Agregar animaciones de transición
   - Mejorar responsive design
   - Agregar modo oscuro

8. **Funcionalidades**
   - Notificaciones en tiempo real
   - Exportación a PDF mejorada
   - Filtros avanzados en más secciones
   - Búsqueda global

9. **Monitoreo**
   - Integrar logging service (Sentry, LogRocket)
   - Analytics de uso
   - Métricas de performance

### Tickets Sugeridos

#### Ticket 1: Mejora de Autenticación
**Prioridad**: Alta
**Descripción**: Migrar de sessionStorage a cookies seguras para autenticación
**Tareas**:
- Implementar cookies httpOnly
- Actualizar middleware de Next.js
- Migrar lógica de autenticación
- Testing de seguridad

#### Ticket 2: Sistema de Notificaciones
**Prioridad**: Media
**Descripción**: Implementar sistema de notificaciones para avances y órdenes
**Tareas**:
- Diseñar sistema de notificaciones
- Integrar con backend
- UI de notificaciones
- Preferencias de usuario

#### Ticket 3: Optimización de Performance
**Prioridad**: Media
**Descripción**: Mejorar tiempos de carga y rendimiento general
**Tareas**:
- Análisis de performance
- Optimización de queries
- Implementar paginación
- Code splitting

#### Ticket 4: Testing y Calidad
**Prioridad**: Alta
**Descripción**: Implementar suite de tests completa
**Tareas**:
- Configurar Jest/Vitest
- Tests unitarios de hooks
- Tests de componentes
- Tests E2E

#### Ticket 5: Documentación Técnica
**Prioridad**: Baja
**Descripción**: Mejorar documentación interna del código
**Tareas**:
- Comentar funciones complejas
- Documentar APIs
- Guías de desarrollo
- README mejorado

---

## 📝 Notas Adicionales

### Usuarios de Emergencia
El sistema incluye usuarios de emergencia para cuando el backend no está disponible:
- `admin@sistema.com` / `admin` (Admin)
- `alejandro@sistema.com` / `123` (JDA)
- `stefan@sistema.com` / `999` (JDA)
- `cecilia.pizzini@supervisor.com` / `123` (Supervisor)
- `contacto@kauffmann.com` / `123` (Provider)
- `contacto@logistica.com` / `123` (Provider)

### Variables de Entorno
El sistema utiliza variables de entorno para configuración. Verificar archivo `.env.local` o `.env` para:
- `NEXT_PUBLIC_API_URL`: URL del backend
- Otras configuraciones necesarias

### Versión del Frontend
El sistema incluye control de versiones del frontend mediante `useFrontendVersion.ts` y `FrontendVersionEffect.tsx`.

---

## 📞 Contacto y Soporte

Para consultas sobre el sistema, mantenimiento o nuevas funcionalidades, contactar al equipo de desarrollo.

---

**Última actualización**: Diciembre 2024
**Versión del documento**: 1.0


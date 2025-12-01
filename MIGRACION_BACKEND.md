# Migración del Backend al Frontend - Resumen

## ✅ Completado

### 1. Configuración de MongoDB
- ✅ Creado `lib/mongodb.ts` con conexión optimizada para Next.js (serverless-safe)
- ✅ Función `getDB()` para obtener la base de datos
- ✅ Conexión en caché para mejor rendimiento

### 2. Dependencias
- ✅ Agregado `mongodb` al `package.json`
- ✅ Dependencias necesarias del backend ya están presentes (axios, etc.)

### 3. Rutas API Migradas

#### Rutas Administrativas (completadas automáticamente)
Todas las colecciones administrativas tienen rutas CRUD completas:
- ✅ `/api/zonas`
- ✅ `/api/propietarios`
- ✅ `/api/campos`
- ✅ `/api/empresas`
- ✅ `/api/actividades`
- ✅ `/api/usuarios`
- ✅ `/api/tiposUso`
- ✅ `/api/especies`
- ✅ `/api/ambientales`
- ✅ `/api/insumos`
- ✅ `/api/cuadrillas`
- ✅ `/api/vecinos`

#### Rutas Principales
- ✅ `/api/ordenesTrabajoAPI` - GET, POST
- ✅ `/api/ordenesTrabajoAPI/[id]` - GET, PUT, DELETE
- ✅ `/api/cron/etl` - GET (cron job para sincronización de datos)

### 4. Cron Job ETL
- ✅ Migrado a `/app/api/cron/etl/route.ts`
- ✅ Configurado en `vercel.json` para ejecutarse diariamente a las 8 AM
- ✅ Procesa datos administrativos, órdenes de trabajo y protección

### 5. Configuración Vercel
- ✅ Creado `vercel.json` con configuración del cron job

### 6. Cliente API
- ✅ Actualizado para usar rutas locales por defecto
- ✅ Soporta variable de entorno `NEXT_PUBLIC_API_URL` para usar backend externo si es necesario

## ⚠️ Pendiente - Rutas que Requieren Lógica Específica

Estas rutas necesitan ser migradas manualmente desde el backend porque tienen lógica compleja:

### 1. Avances de Trabajo (`/api/avancesTrabajos`)
- ❌ GET `/api/avancesTrabajos` - Listar todos
- ❌ GET `/api/avancesTrabajos/[id]` - Obtener por ID
- ❌ POST `/api/avancesTrabajos` - Crear (lógica compleja de validación)
- ❌ PUT `/api/avancesTrabajos/[id]` - Actualizar (actualiza estado de órdenes)
- ❌ DELETE `/api/avancesTrabajos/[id]` - Eliminar (actualiza estado de órdenes)
- ❌ GET `/api/avancesTrabajos/orden/[ordenTrabajoId]` - Por orden
- ❌ GET `/api/avancesTrabajos/proveedor/[proveedorId]` - Por proveedor
- ❌ GET `/api/avancesTrabajos/cuadrilla/[cuadrillaId]` - Por cuadrilla
- ❌ GET `/api/avancesTrabajos/fecha/[inicio]/[fin]` - Por rango de fechas

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 403-880

### 2. Viveros (`/api/viveros`)
- ❌ Todas las rutas de viveros con sistema de clones

**Ubicación en backend**: 
- Routes: `backend-gestion-forestal/src/routes/viveroRoutes.ts`
- Controller: `backend-gestion-forestal/src/controllers/viveroController.ts`
- Models: `backend-gestion-forestal/src/models/vivero.ts`

### 3. Plantillas (`/api/plantillas`)
- ❌ GET, POST, PUT, DELETE con inicialización de datos

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 882-1045

### 4. Clones (`/api/clones`)
- ❌ CRUD completo

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 1047-1139

### 5. Productos de Malezas (`/api/malezasProductos`)
- ❌ CRUD completo con validaciones complejas

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 1144-1466

### 6. Supervisores (`/api/supervisores`)
- ❌ GET `/api/supervisores`
- ❌ GET `/api/supervisores/[nombre]/proveedores`
- ❌ GET `/api/supervisores/[id]/proveedores`

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 1468-1936

### 7. Jefes de Área (`/api/jefes_de_area`)
- ❌ CRUD completo
- ❌ GET `/api/jefes_de_area/[nombre]/supervisores`
- ❌ GET `/api/jefes_de_area/[id]/supervisores`

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 1491-1897

### 8. Usuarios Admin (`/api/usuarios_admin`)
- ❌ CRUD completo
- ❌ POST `/api/usuarios_admin/login` - Autenticación
- ❌ GET `/api/usuarios_admin/rol/[rol]` - Por rol

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 1938-2421

### 9. Reportes (`/api/reportes`)
- ❌ GET `/api/reportes/ordenesPorZona`
- ❌ GET `/api/reportes/ordenesPorEstado`

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 331-373

### 10. Cuadrillas Especiales
- ❌ GET `/api/cuadrillas/por-proveedor/[proveedorId]`
- ❌ GET `/api/cuadrillas/activas`

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 375-401

### 11. Órdenes de Trabajo - Rutas Adicionales
- ❌ PATCH `/api/ordenesTrabajoAPI/[id]/estado` - Actualizar solo estado

**Ubicación en backend**: `backend-gestion-forestal/src/api.ts` líneas 291-312

## 📝 Notas Importantes

### Variables de Entorno Necesarias

Asegúrate de tener estas variables en `.env.local`:

```env
MONGODB_URI=tu_connection_string
DB_NAME=gestion_forestal
ADMIN_API_URL=https://gis.fasa.ibc.ar/ordenes/json-tablas-adm
WORK_ORDERS_API_URL=https://gis.fasa.ibc.ar/api/ordenes/listar
WORK_ORDERS_API_KEY=tu_api_key
WORK_ORDERS_FROM_DATE=2020-01-01
PROTECTION_API=https://gis.fasa.ibc.ar/proteccion/json
CRON_SECRET=tu_secret_para_cron (opcional)
```

### Helper para Rutas Generales

Se creó `lib/api-helpers.ts` con la función `handleAdminCollectionRoute()` que maneja automáticamente:
- GET (listar todos)
- GET con [id] (obtener uno)
- POST (crear)
- PUT con [id] (actualizar)
- DELETE con [id] (eliminar)

### Próximos Pasos

1. **Migrar rutas complejas manualmente**: Empezar con avancesTrabajos ya que es la más crítica
2. **Probar todas las rutas**: Verificar que funcionen correctamente
3. **Actualizar documentación**: Actualizar DOCUMENTACION_SISTEMA.md con las nuevas rutas
4. **Configurar variables de entorno**: En Vercel, agregar todas las variables necesarias
5. **Probar cron job**: Verificar que el ETL se ejecute correctamente

## 🔧 Utilidades Creadas

- `lib/mongodb.ts`: Conexión a MongoDB optimizada para serverless
- `lib/api-helpers.ts`: Helper para rutas CRUD genéricas
- `scripts/generate-admin-routes.js`: Script para generar rutas administrativas automáticamente



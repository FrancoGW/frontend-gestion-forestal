# Variables de Entorno - Vercel Frontend

Esta es la lista completa de todas las variables de entorno que necesitas configurar en Vercel para el proyecto frontend unificado.

## ✅ Variables OBLIGATORIAS

### 1. **MONGODB_URI** (OBLIGATORIA)
- **Descripción**: Connection string de MongoDB Atlas
- **Ejemplo**: `mongodb+srv://admin:password@cluster.mongodb.net/`
- **Uso**: Conexión a la base de datos para todas las operaciones
- **Nota**: La misma que tienes en el backend

### 2. **DB_NAME** (OPCIONAL, pero recomendada)
- **Descripción**: Nombre de la base de datos
- **Valor por defecto**: `gestion_forestal`
- **Ejemplo**: `gestion_forestal`
- **Uso**: Especifica qué base de datos usar dentro del cluster
- **Nota**: La misma que tienes en el backend

## ✅ Variables para el ETL (Cron Job)

### 3. **ADMIN_API_URL** (OBLIGATORIA)
- **Descripción**: URL de la API administrativa externa
- **Ejemplo**: `https://gis.fasa.ibc.ar/ordenes/json-tablas-adm`
- **Uso**: Obtener datos administrativos en el proceso ETL
- **Valor por defecto**: Tiene un fallback, pero es mejor configurarlo

### 4. **WORK_ORDERS_API_URL** (OBLIGATORIA)
- **Descripción**: URL de la API de órdenes de trabajo
- **Ejemplo**: `https://gis.fasa.ibc.ar/api/ordenes/listar`
- **Uso**: Obtener órdenes de trabajo en el proceso ETL
- **Valor por defecto**: Tiene un fallback, pero es mejor configurarlo

### 5. **WORK_ORDERS_API_KEY** (OBLIGATORIA)
- **Descripción**: API Key para autenticarse con WORK_ORDERS_API_URL
- **Ejemplo**: `c3kvEUZ3yqzjU7ePcqesLUOZfaijujtRbl1tswiscXY7XxcU2LuZtvlB9I0oAq2g`
- **Uso**: Header de autenticación para la API de órdenes
- **Valor por defecto**: Tiene un fallback, pero NO es seguro usarlo en producción

### 6. **WORK_ORDERS_FROM_DATE** (OPCIONAL)
- **Descripción**: Fecha desde la cual obtener órdenes de trabajo
- **Ejemplo**: `2020-01-01`
- **Valor por defecto**: `2020-01-01`
- **Uso**: Filtro de fecha para el ETL

### 7. **PROTECTION_API** (OBLIGATORIA)
- **Descripción**: URL de la API de protección
- **Ejemplo**: `https://gis.fasa.ibc.ar/proteccion/json`
- **Uso**: Obtener datos de protección en el proceso ETL
- **Valor por defecto**: Tiene un fallback, pero es mejor configurarlo

## ✅ Variables Opcionales

### 8. **CRON_SECRET** (RECOMENDADA)
- **Descripción**: Secret para proteger el endpoint del cron job ETL
- **Ejemplo**: Una cadena aleatoria segura (ej: `sk_live_abc123xyz...`)
- **Uso**: Autenticación Bearer token para el endpoint `/api/cron/etl`
- **Nota**: Sin esto, cualquiera puede ejecutar tu ETL. Muy recomendada en producción.

### 9. **NEXT_PUBLIC_API_URL** (OPCIONAL)
- **Descripción**: URL del backend externo (si aún lo usas)
- **Ejemplo**: `https://backend-gestion-forestal.vercel.app`
- **Uso**: Solo si quieres usar un backend externo en lugar de las rutas locales
- **Nota**: Si está vacía o no existe, el sistema usa rutas locales (`/api/*`)

---

## 📋 Resumen Rápido para Vercel

Copia estas variables a tu proyecto en Vercel:

```env
# OBLIGATORIAS
MONGODB_URI=mongodb+srv://admin:admin@cluste...
DB_NAME=gestion_forestal
ADMIN_API_URL=https://gis.fasa.ibc.ar/ordenes/json-tablas-adm
WORK_ORDERS_API_URL=https://gis.fasa.ibc.ar/api/ordenes/listar
WORK_ORDERS_API_KEY=c3kvEUZ3yqzjU7ePcqesLUOZfaijujtRbl...
PROTECTION_API=https://gis.fasa.ibc.ar/proteccion/json

# OPCIONALES (pero recomendadas)
WORK_ORDERS_FROM_DATE=2020-01-01
CRON_SECRET=tu_secret_seguro_aqui
NEXT_PUBLIC_API_URL=
```

---

## 🔐 Configuración en Vercel

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega todas las variables listadas arriba
4. Selecciona los ambientes: **Production**, **Preview**, y **Development**
5. Guarda los cambios

---

## ⚠️ Notas Importantes

1. **MONGODB_URI**: Debe ser la MISMA que usas en el backend, ya que ambos comparten la misma base de datos.

2. **CRON_SECRET**: 
   - Crea un valor aleatorio y seguro
   - Vercel lo inyectará automáticamente en el header `Authorization: Bearer {CRON_SECRET}` cuando ejecute el cron job
   - Si no lo configuras, el ETL seguirá funcionando pero será público

3. **Variables con valores por defecto**: Aunque tienen fallbacks, es mejor configurarlas explícitamente para evitar problemas.

4. **NEXT_PUBLIC_API_URL**: 
   - Si la dejas vacía o no la configuras, el sistema usará las rutas API locales integradas
   - Solo configúrala si necesitas apuntar a un backend externo

---

## ✅ Checklist

- [ ] MONGODB_URI configurada
- [ ] DB_NAME configurada (o usando el default)
- [ ] ADMIN_API_URL configurada
- [ ] WORK_ORDERS_API_URL configurada
- [ ] WORK_ORDERS_API_KEY configurada
- [ ] PROTECTION_API configurada
- [ ] WORK_ORDERS_FROM_DATE configurada (opcional)
- [ ] CRON_SECRET configurada (recomendada)
- [ ] NEXT_PUBLIC_API_URL configurada (opcional, solo si necesitas backend externo)

---

## 🔄 Sincronización con Backend

Todas estas variables (excepto `NEXT_PUBLIC_API_URL` y `CRON_SECRET`) son las mismas que tienes en el backend. Puedes copiarlas directamente desde tu proyecto backend en Vercel.



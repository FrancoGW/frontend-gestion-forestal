import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/mongodb"
import axios from "axios"

const ADMIN_API_URL = process.env.ADMIN_API_URL || "https://gis.fasa.ibc.ar/ordenes/json-tablas-adm"
const WORK_ORDERS_API_KEY =
  process.env.WORK_ORDERS_API_KEY || "c3kvEUZ3yqzjU7ePcqesLUOZfaijujtRbl1tswiscXY7XxcU2LuZtvlB9I0oAq2g"

export async function POST(_request: NextRequest) {
  try {
    // 1. Obtener datos de Usuarios GIS
    const response = await axios.get(ADMIN_API_URL, {
      headers: {
        "x-api-key": WORK_ORDERS_API_KEY,
      },
    })

    const gisData = response.data
    const gisUsuarios = gisData.usuarios || [] // Supervisores
    const gisEmpresas = gisData.empresas || [] // Proveedores

    // 2. Conectar a MongoDB
    const db = await getDB()
    const collection = db.collection("usuarios_admin")

    let procesados = 0
    let actualizados = 0
    let nuevos = 0
    let errores = 0

    // 3. Sincronizar supervisores desde GIS "usuarios"
    for (const gisUser of gisUsuarios) {
      try {
        const gisId = gisUser.id || gisUser._id || gisUser.idusuario || gisUser.cod_usuario
        const gisNombre = gisUser.nombre || gisUser.usuario || gisUser.nombre_completo || "Sin nombre"

        if (!gisId) {
          console.warn("⚠️ Usuario GIS sin ID, saltando:", gisNombre)
          errores++
          continue
        }

        // Verificar si existe en nuestro sistema
        const existe = await collection.findOne({ _id: Number(gisId) })

        // Preparar documento para sincronizar
        const documento = {
          _id: Number(gisId),
          nombre: gisNombre,
          apellido: gisUser.apellido || "",
          rol: "supervisor" as const,
          // Mantener campos existentes si ya existe, o valores por defecto
          email: existe?.email || "",
          password: existe?.password || "", // Mantener contraseña si existe
          telefono: existe?.telefono || "",
          activo: existe?.activo !== undefined ? existe.activo : true,
          fechaCreacion: existe?.fechaCreacion || new Date().toISOString(),
          // Marcar como sincronizado desde GIS
          sincronizadoDesdeGIS: true,
          ultimaSincronizacion: new Date(),
        }

        // Actualizar o insertar
        await collection.updateOne(
          { _id: Number(gisId) },
          { $set: documento },
          { upsert: true }
        )

        if (existe) {
          actualizados++
        } else {
          nuevos++
        }
        procesados++
      } catch (error: any) {
        console.error(`❌ Error al procesar supervisor GIS:`, error.message)
        errores++
      }
    }

    // 4. Sincronizar proveedores desde GIS "empresas"
    for (const gisEmpresa of gisEmpresas) {
      try {
        const gisId =
          gisEmpresa.id ||
          gisEmpresa._id ||
          gisEmpresa.idempresa ||
          gisEmpresa.cod_empres ||
          gisEmpresa.codigo
        const gisNombre = gisEmpresa.empresa || gisEmpresa.nombre || gisEmpresa.razon_social || "Sin nombre"

        if (!gisId) {
          console.warn("⚠️ Empresa GIS sin ID, saltando:", gisNombre)
          errores++
          continue
        }

        // Verificar si existe en nuestro sistema
        const existe = await collection.findOne({ _id: Number(gisId) })

        // Preparar documento para sincronizar
        const documento = {
          _id: Number(gisId),
          nombre: gisNombre,
          apellido: "",
          rol: "provider" as const,
          // Mantener campos existentes si ya existe, o valores por defecto
          email: existe?.email || "",
          password: existe?.password || "", // Mantener contraseña si existe
          telefono: existe?.telefono || gisEmpresa.telefono || "",
          cuit: existe?.cuit || gisEmpresa.cuit || "",
          activo: existe?.activo !== undefined ? existe.activo : true,
          fechaCreacion: existe?.fechaCreacion || new Date().toISOString(),
          // Marcar como sincronizado desde GIS
          sincronizadoDesdeGIS: true,
          ultimaSincronizacion: new Date(),
        }

        // Actualizar o insertar
        await collection.updateOne(
          { _id: Number(gisId) },
          { $set: documento },
          { upsert: true }
        )

        if (existe) {
          actualizados++
        } else {
          nuevos++
        }
        procesados++
      } catch (error: any) {
        console.error(`❌ Error al procesar empresa GIS:`, error.message)
        errores++
      }
    }

    return NextResponse.json({
      success: true,
      message: "Sincronización completada",
      resumen: {
        procesados,
        nuevos,
        actualizados,
        errores,
      },
    })
  } catch (error: any) {
    console.error("❌ Error en sincronización de usuarios:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al sincronizar usuarios",
        error: error.message,
      },
      { status: 500 }
    )
  }
}


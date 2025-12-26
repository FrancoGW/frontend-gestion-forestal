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
    const gisUsuarios = gisData.usuarios || []

    if (!Array.isArray(gisUsuarios) || gisUsuarios.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No se encontraron usuarios en los datos GIS",
      })
    }

    // 2. Conectar a MongoDB
    const db = await getDB()
    const collection = db.collection("supervisores")

    let procesados = 0
    let actualizados = 0
    let nuevos = 0
    let errores = 0

    // 3. Sincronizar cada usuario del GIS
    for (const gisUser of gisUsuarios) {
      try {
        // Extraer ID y nombre del GIS
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
          // Mantener campos existentes si ya existe, o valores por defecto
          email: existe?.email || "",
          telefono: existe?.telefono || "",
          activo: existe?.activo !== undefined ? existe.activo : true,
          // Campos adicionales del GIS si existen
          ...(gisUser.apellido && { apellido: gisUser.apellido }),
          ...(gisUser.rol && { rol: gisUser.rol }),
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
        console.error(`❌ Error al procesar usuario GIS:`, error.message)
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
    console.error("❌ Error en sincronización de supervisores:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al sincronizar supervisores",
        error: error.message,
      },
      { status: 500 }
    )
  }
}



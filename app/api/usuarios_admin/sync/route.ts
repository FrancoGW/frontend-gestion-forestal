import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/mongodb"
import axios from "axios"

const ADMIN_API_URL = process.env.ADMIN_API_URL || "https://gis.fasa.ibc.ar/ordenes/json-tablas-adm"
const WORK_ORDERS_API_KEY =
  process.env.WORK_ORDERS_API_KEY || "c3kvEUZ3yqzjU7ePcqesLUOZfaijujtRbl1tswiscXY7XxcU2LuZtvlB9I0oAq2g"

/**
 * IDs prefijados para evitar colisiones: la API GIS usa el mismo número para
 * empresas (proveedores) y usuarios (supervisores). Ej: idempresa 14 = LOGISTICA S.R.L.
 * y _id 14 = Marcelo Gasparri (supervisor). Usamos "supervisor_X" y "provider_X".
 */
const ID_SUPERVISOR = (gisId: number) => `supervisor_${gisId}`
const ID_PROVIDER = (gisId: number) => `provider_${gisId}`

export async function POST(_request: NextRequest) {
  try {
    // 1. Obtener datos de la API GIS
    const response = await axios.get(ADMIN_API_URL, {
      headers: {
        "x-api-key": WORK_ORDERS_API_KEY,
      },
    })

    const gisData = response.data
    const gisUsuarios = gisData.usuarios || [] // Supervisores en GIS
    const gisEmpresas = gisData.empresas || [] // Proveedores (empresas) en GIS

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
        const gisIdRaw = gisUser.id ?? gisUser._id ?? gisUser.idusuario ?? gisUser.cod_usuario
        const gisId = Number(gisIdRaw)
        const gisNombre = gisUser.nombre || gisUser.usuario || gisUser.nombre_completo || "Sin nombre"

        if (!gisIdRaw || isNaN(gisId)) {
          console.warn("⚠️ Usuario GIS sin ID válido, saltando:", gisNombre)
          errores++
          continue
        }

        const idDoc = ID_SUPERVISOR(gisId)

        // Verificar si existe (prefijado, gisSupervisorId, o legacy _id numérico)
        const existe = await collection.findOne({
          $or: [
            { _id: idDoc },
            { gisSupervisorId: gisId, rol: "supervisor" },
            { _id: gisId, rol: "supervisor" },
          ],
        })

        const documento = {
          _id: idDoc,
          nombre: gisNombre,
          apellido: gisUser.apellido || "",
          rol: "supervisor" as const,
          gisSupervisorId: gisId,
          email: existe?.email || "",
          password: existe?.password || "",
          telefono: existe?.telefono || "",
          activo: existe?.activo !== undefined ? existe.activo : true,
          fechaCreacion: existe?.fechaCreacion || new Date().toISOString(),
          sincronizadoDesdeGIS: true,
          ultimaSincronizacion: new Date(),
        }

        // Si existía con _id legacy numérico, no sobrescribir; crear con nuevo _id
        if (existe && typeof existe._id === "number") {
          await collection.updateOne(
            { _id: existe._id },
            {
              $set: {
                gisSupervisorId: gisId,
                nombre: gisNombre,
                sincronizadoDesdeGIS: true,
                ultimaSincronizacion: new Date(),
              },
            }
          )
          actualizados++
        } else {
          await collection.updateOne(
            { _id: idDoc },
            { $set: documento },
            { upsert: true }
          )
          if (existe) actualizados++
          else nuevos++
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
        const gisIdRaw =
          gisEmpresa.id ??
          gisEmpresa._id ??
          gisEmpresa.idempresa ??
          gisEmpresa.cod_empres ??
          gisEmpresa.codigo
        const gisId = Number(gisIdRaw)
        const gisNombre =
          gisEmpresa.empresa || gisEmpresa.nombre || gisEmpresa.razon_social || "Sin nombre"

        if (!gisIdRaw || isNaN(gisId)) {
          console.warn("⚠️ Empresa GIS sin ID válido, saltando:", gisNombre)
          errores++
          continue
        }

        const idDoc = ID_PROVIDER(gisId)

        const existe = await collection.findOne({
          $or: [
            { _id: idDoc },
            { idempresa: gisId, rol: "provider" },
            { _id: gisId, rol: "provider" },
          ],
        })

        const documento = {
          _id: idDoc,
          nombre: gisNombre,
          apellido: "",
          rol: "provider" as const,
          idempresa: gisId,
          email: existe?.email || "",
          password: existe?.password || "",
          telefono: existe?.telefono || gisEmpresa.telefono || "",
          cuit: existe?.cuit || gisEmpresa.cuit || "",
          activo: existe?.activo !== undefined ? existe.activo : true,
          fechaCreacion: existe?.fechaCreacion || new Date().toISOString(),
          sincronizadoDesdeGIS: true,
          ultimaSincronizacion: new Date(),
        }

        if (existe && typeof existe._id === "number") {
          await collection.updateOne(
            { _id: existe._id },
            {
              $set: {
                idempresa: gisId,
                nombre: gisNombre,
                sincronizadoDesdeGIS: true,
                ultimaSincronizacion: new Date(),
              },
            }
          )
          actualizados++
        } else {
          await collection.updateOne(
            { _id: idDoc },
            { $set: documento },
            { upsert: true }
          )
          if (existe) actualizados++
          else nuevos++
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



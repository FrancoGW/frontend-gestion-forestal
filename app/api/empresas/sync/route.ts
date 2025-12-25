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
    const gisEmpresas = gisData.empresas || []

    if (!Array.isArray(gisEmpresas) || gisEmpresas.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No se encontraron empresas en los datos GIS",
      })
    }

    // 2. Conectar a MongoDB
    const db = await getDB()
    const collection = db.collection("empresas")

    let procesados = 0
    let actualizados = 0
    let nuevos = 0
    let errores = 0

    // 3. Sincronizar cada empresa del GIS
    for (const gisEmpresa of gisEmpresas) {
      try {
        // Extraer ID y nombre del GIS
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
        const existe = await collection.findOne({
          $or: [
            { _id: Number(gisId) },
            { idempresa: Number(gisId) },
            { cod_empres: Number(gisId) },
          ],
        })

        // Determinar el ID a usar
        let idFinal = Number(gisId)
        if (existe && existe._id) {
          idFinal = typeof existe._id === "number" ? existe._id : Number(gisId)
        }

        // Preparar documento para sincronizar
        const documento: any = {
          _id: idFinal,
          empresa: gisNombre,
          nombre: gisNombre,
          // Mantener campos existentes si ya existe, o valores por defecto
          cuit: existe?.cuit || "",
          telefono: existe?.telefono || "",
          email: existe?.email || "",
          rubros: existe?.rubros || "",
          activo: existe?.activo !== undefined ? existe.activo : true,
          // IDs alternativos para compatibilidad
          idempresa: Number(gisId),
          cod_empres: Number(gisId),
          // Campos adicionales del GIS si existen
          ...(gisEmpresa.razon_social && { razon_social: gisEmpresa.razon_social }),
          // Marcar como sincronizado desde GIS
          sincronizadoDesdeGIS: true,
          ultimaSincronizacion: new Date(),
        }

        // Actualizar o insertar
        await collection.updateOne(
          { _id: idFinal },
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
    console.error("❌ Error en sincronización de empresas:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al sincronizar empresas",
        error: error.message,
      },
      { status: 500 }
    )
  }
}


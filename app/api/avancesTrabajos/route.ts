import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDB } from "@/lib/mongodb"

const COLLECTION_NAME = "avancesTrabajos"

// GET /api/avancesTrabajos
export async function GET(request: NextRequest) {
  try {
    const db = await getDB()
    const collection = db.collection(COLLECTION_NAME)

    const { searchParams } = new URL(request.url)

    const query: Record<string, any> = {}

    // Filtros opcionales por querystring (compatibles con el backend original)
    const ordenTrabajoId = searchParams.get("ordenTrabajoId")
    if (ordenTrabajoId) {
      const num = Number(ordenTrabajoId)
      query.ordenTrabajoId = Number.isNaN(num) ? ordenTrabajoId : num
    }

    const proveedorId = searchParams.get("proveedorId")
    if (proveedorId) {
      const num = Number(proveedorId)
      query.proveedorId = Number.isNaN(num) ? proveedorId : num
    }

    const cuadrillaId = searchParams.get("cuadrillaId")
    if (cuadrillaId) {
      query.cuadrillaId = cuadrillaId
    }

    const cursor = collection.find(query).sort({ fecha: -1 })
    const items = await cursor.toArray()

    return NextResponse.json(items)
  } catch (error: any) {
    console.error("❌ Error en GET /api/avancesTrabajos:", error)
    return NextResponse.json(
      { error: "Error al obtener avances de trabajo", message: error.message },
      { status: 500 },
    )
  }
}

// POST /api/avancesTrabajos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body) {
      return NextResponse.json({ error: "Cuerpo de la solicitud vacío" }, { status: 400 })
    }

    // Validaciones mínimas para no romper el frontend
    if (!body.fecha) {
      return NextResponse.json({ error: "El campo 'fecha' es obligatorio" }, { status: 400 })
    }

    if (!body.proveedorId) {
      return NextResponse.json({ error: "El campo 'proveedorId' es obligatorio" }, { status: 400 })
    }

    const db = await getDB()
    const collection = db.collection(COLLECTION_NAME)

    const now = new Date()

    const doc = {
      ...body,
      fechaRegistro: body.fechaRegistro || now.toISOString(),
      createdAt: body.createdAt || now.toISOString(),
      updatedAt: body.updatedAt || now.toISOString(),
    }

    const result = await collection.insertOne(doc)
    const created = await collection.findOne({ _id: result.insertedId })

    return NextResponse.json(created, { status: 201 })
  } catch (error: any) {
    console.error("❌ Error en POST /api/avancesTrabajos:", error)
    return NextResponse.json(
      { error: "Error al crear avance de trabajo", message: error.message },
      { status: 500 },
    )
  }
}










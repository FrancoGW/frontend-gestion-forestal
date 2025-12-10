import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDB } from "@/lib/mongodb"

const COLLECTION_NAME = "avancesTrabajos"

function parseId(id: string): ObjectId | string | number {
  if (id.length === 24 && ObjectId.isValid(id)) {
    return new ObjectId(id)
  }

  const asNumber = Number(id)
  if (!Number.isNaN(asNumber)) {
    return asNumber
  }

  return id
}

// GET /api/avancesTrabajos/[id]
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDB()
    const collection = db.collection(COLLECTION_NAME)
    const queryId = parseId(params.id)

    const item = await collection.findOne({ _id: queryId })

    if (!item) {
      return NextResponse.json({ error: "Avance no encontrado" }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error: any) {
    console.error("❌ Error en GET /api/avancesTrabajos/[id]:", error)
    return NextResponse.json(
      { error: "Error al obtener avance de trabajo", message: error.message },
      { status: 500 },
    )
  }
}

// PUT /api/avancesTrabajos/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const db = await getDB()
    const collection = db.collection(COLLECTION_NAME)
    const queryId = parseId(params.id)

    const updateDoc = {
      ...body,
      updatedAt: new Date().toISOString(),
    }

    const result = await collection.updateOne({ _id: queryId }, { $set: updateDoc })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Avance no encontrado" }, { status: 404 })
    }

    const updated = await collection.findOne({ _id: queryId })
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("❌ Error en PUT /api/avancesTrabajos/[id]:", error)
    return NextResponse.json(
      { error: "Error al actualizar avance de trabajo", message: error.message },
      { status: 500 },
    )
  }
}

// DELETE /api/avancesTrabajos/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // El frontend envía proveedorId en el cuerpo, pero aquí solo lo registramos por ahora
    let proveedorId: any = null
    try {
      const body = await request.json()
      proveedorId = body?.proveedorId ?? null
    } catch {
      // Si no hay cuerpo no es un error crítico
    }

    const db = await getDB()
    const collection = db.collection(COLLECTION_NAME)
    const queryId = parseId(params.id)

    const result = await collection.deleteOne({ _id: queryId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Avance no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      mensaje: "Avance eliminado correctamente",
      _id: queryId,
      proveedorId,
    })
  } catch (error: any) {
    console.error("❌ Error en DELETE /api/avancesTrabajos/[id]:", error)
    return NextResponse.json(
      { error: "Error al eliminar avance de trabajo", message: error.message },
      { status: 500 },
    )
  }
}





import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/mongodb"

const COLLECTION = "jefes_de_area"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id, 10)
    if (Number.isNaN(idNum)) {
      return NextResponse.json(
        { error: "ID de jefe de área inválido" },
        { status: 400 }
      )
    }

    const db = await getDB()
    const jefeDeArea = await db.collection(COLLECTION).findOne({ _id: idNum })

    if (!jefeDeArea) {
      return NextResponse.json(
        { error: "Jefe de área no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(jefeDeArea)
  } catch (error) {
    console.error("Error al obtener jefe de área:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id, 10)
    if (Number.isNaN(idNum)) {
      return NextResponse.json(
        { error: "ID de jefe de área inválido" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const {
      nombre,
      apellido,
      email,
      password,
      telefono,
      activo,
      supervisoresAsignados,
    } = body

    const db = await getDB()
    const existente = await db.collection(COLLECTION).findOne({ _id: idNum })
    if (!existente) {
      return NextResponse.json(
        { error: "Jefe de área no encontrado" },
        { status: 404 }
      )
    }

    const update: Record<string, unknown> = {
      ultimaActualizacion: new Date().toISOString(),
    }
    if (nombre !== undefined) update.nombre = nombre
    if (apellido !== undefined) update.apellido = apellido
    if (email !== undefined) update.email = email
    if (password !== undefined) update.password = password
    if (telefono !== undefined) update.telefono = telefono
    if (activo !== undefined) update.activo = Boolean(activo)
    if (Array.isArray(supervisoresAsignados)) update.supervisoresAsignados = supervisoresAsignados

    await db.collection(COLLECTION).updateOne(
      { _id: idNum },
      { $set: update }
    )

    const actualizado = await db.collection(COLLECTION).findOne({ _id: idNum })
    return NextResponse.json(actualizado)
  } catch (error) {
    console.error("Error al actualizar jefe de área:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

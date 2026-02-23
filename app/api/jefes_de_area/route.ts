import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/mongodb"

const COLLECTION = "jefes_de_area"

/**
 * GET /api/jefes_de_area
 * - Sin query: lista todos los jefes de área.
 * - ?email=xxx: devuelve el JDA con ese email (para login/resolución sin hardcodear IDs).
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDB()
    const email = request.nextUrl.searchParams.get("email")?.trim()?.toLowerCase()

    if (email) {
      const jda = await db.collection(COLLECTION).findOne({
        email: email,
        activo: { $ne: false },
      })
      if (!jda) {
        return NextResponse.json(
          { error: "Jefe de área no encontrado para ese email" },
          { status: 404 }
        )
      }
      return NextResponse.json(jda)
    }

    const list = await db
      .collection(COLLECTION)
      .find({})
      .sort({ _id: 1 })
      .toArray()
    return NextResponse.json({ data: list })
  } catch (error) {
    console.error("Error al listar jefes de área:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/jefes_de_area
 * Crea un nuevo jefe de área. _id puede venir en el body o se autogenera numéricamente.
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDB()
    const body = await request.json().catch(() => ({}))
    const {
      _id: idBody,
      nombre,
      apellido,
      email,
      password,
      telefono,
      activo = true,
      supervisoresAsignados = [],
    } = body

    if (!nombre || !email) {
      return NextResponse.json(
        { error: "nombre y email son requeridos" },
        { status: 400 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const existente = await db.collection(COLLECTION).findOne({
      email: normalizedEmail,
    })
    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un jefe de área con ese email" },
        { status: 409 }
      )
    }

    let idFinal: number
    if (idBody !== undefined && Number.isInteger(Number(idBody))) {
      idFinal = Number(idBody)
      const yaExiste = await db.collection(COLLECTION).findOne({ _id: idFinal })
      if (yaExiste) {
        return NextResponse.json(
          { error: "Ya existe un jefe de área con ese _id" },
          { status: 409 }
        )
      }
    } else {
      const ultimo = await db
        .collection(COLLECTION)
        .find()
        .sort({ _id: -1 })
        .limit(1)
        .toArray()
      idFinal =
        ultimo.length > 0 && typeof ultimo[0]._id === "number"
          ? (ultimo[0]._id as number) + 1
          : 1
    }

    const ahora = new Date().toISOString()
    const doc = {
      _id: idFinal,
      nombre: String(nombre).trim(),
      apellido: apellido != null ? String(apellido).trim() : "",
      email: normalizedEmail,
      password: password != null ? String(password) : "",
      telefono: telefono != null ? String(telefono).trim() : "",
      activo: Boolean(activo),
      supervisoresAsignados: Array.isArray(supervisoresAsignados)
        ? supervisoresAsignados
        : [],
      fechaCreacion: ahora,
      ultimaActualizacion: ahora,
    }

    await db.collection(COLLECTION).insertOne(doc)
    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error("Error al crear jefe de área:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

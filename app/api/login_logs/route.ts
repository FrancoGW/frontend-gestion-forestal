import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/mongodb"

const COLLECTION = "login_logs"

/**
 * GET /api/login_logs?emails=email1,email2,...
 * Devuelve los registros de inicio de sesión para los emails indicados, ordenados por fecha descendente.
 * Usado por el panel subgerente para ver cuándo entraron los jefes de área.
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDB()
    const emailsParam = request.nextUrl.searchParams.get("emails")?.trim()
    if (!emailsParam) {
      return NextResponse.json(
        { success: false, message: "Query 'emails' es requerido (emails separados por coma)" },
        { status: 400 }
      )
    }
    const emails = emailsParam
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    if (emails.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    const logs = await db
      .collection(COLLECTION)
      .find({ email: { $in: emails } })
      .sort({ fecha: -1 })
      .toArray()

    return NextResponse.json({ success: true, data: logs })
  } catch (error: any) {
    console.error("Error al obtener login_logs:", error)
    return NextResponse.json(
      { success: false, message: "Error al obtener registros de acceso", error: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/mongodb"

const COLLECTION_NAME = "supervisores"

// GET /api/supervisores
export async function GET(_request: NextRequest) {
  try {
    const db = await getDB()
    const collection = db.collection(COLLECTION_NAME)

    const supervisores = await collection.find().toArray()

    return NextResponse.json({
      success: true,
      data: supervisores,
    })
  } catch (error: any) {
    console.error("❌ Error en GET /api/supervisores:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener supervisores",
        error: error.message,
      },
      { status: 500 },
    )
  }
}



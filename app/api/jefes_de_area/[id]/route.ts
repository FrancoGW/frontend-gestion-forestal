import { NextRequest, NextResponse } from "next/server"

// Datos mock de jefes de área
const jefesDeArea = [
  {
    "_id": 1234,
    "nombre": "Alejandro",
    "email": "alejandro@sistema.com",
    "telefono": "+54 11 3333-3333",
    "activo": true,
    "supervisoresAsignados": [
      {
        "supervisorId": 42,
        "nombre": "Luis Arriola",
        "fechaAsignacion": "2024-01-15T00:00:00.000Z"
      },
      {
        "supervisorId": 69,
        "nombre": "Fabio Cancian.",
        "fechaAsignacion": "2024-01-15T00:00:00.000Z"
      },
      {
        "supervisorId": 47,
        "nombre": "Gonzalo Álvarez",
        "fechaAsignacion": "2024-01-20T00:00:00.000Z"
      }
    ],
    "fechaCreacion": "2024-01-15T00:00:00.000Z",
    "ultimaActualizacion": "2024-07-04T00:00:00.000Z"
  },
  {
    "_id": 34,
    "nombre": "Carlos",
    "apellido": "Stefan",
    "email": "stefan@sistema.com",
    "password": "999",
    "activo": true,
    "supervisoresAsignados": [
      {
        "nombre": "Cecilia Pizzini",
        "fechaAsignacion": "2024-01-15T00:00:00.000Z",
        "supervisorId": 44
      },
      {
        "nombre": "Diego Nonino",
        "fechaAsignacion": "2024-01-20T00:00:00.000Z",
        "supervisorId": 56
      },
      {
        "nombre": "Ulises Cosoli",
        "fechaAsignacion": "2024-02-01T00:00:00.000Z",
        "supervisorId": 43
      }
    ],
    "fechaCreacion": "2024-01-01T00:00:00.000Z",
    "ultimaActualizacion": "2024-07-04T00:00:00.000Z"
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    // Buscar el jefe de área por ID
    const jefeDeArea = jefesDeArea.find(jda => jda._id === id)
    
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
/**
 * Seed de jefes de área en MongoDB.
 * Carga .env y inserta los JDAs iniciales en la colección jefes_de_area (solo si no existen).
 * Uso: node scripts/seed-jefes-de-area.js
 */

const fs = require("fs")
const path = require("path")
const { MongoClient } = require("mongodb")

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envFile = fs.readFileSync(filePath, "utf8")
    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith("#")) {
        const match = trimmed.match(/^([^#=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim().replace(/^["']|["']$/g, "")
          if (!process.env[key]) process.env[key] = value
        }
      }
    })
  }
}

const rootDir = path.join(__dirname, "..")
loadEnvFile(path.join(rootDir, ".env.local"))
loadEnvFile(path.join(rootDir, ".env"))

const MONGODB_URI = process.env.MONGODB_URI || ""
const DB_NAME = process.env.DB_NAME || "gestion_forestal"
const COLLECTION = "jefes_de_area"

const JDAS_INICIALES = [
  {
    _id: 1234,
    nombre: "Alejandro",
    apellido: "",
    email: "alejandro@sistema.com",
    password: "",
    telefono: "+54 11 3333-3333",
    activo: true,
    supervisoresAsignados: [
      { supervisorId: 42, nombre: "Luis Arriola", fechaAsignacion: "2024-01-15T00:00:00.000Z" },
      { supervisorId: 69, nombre: "Fabio Cancian.", fechaAsignacion: "2024-01-15T00:00:00.000Z" },
      { supervisorId: 47, nombre: "Gonzalo Álvarez", fechaAsignacion: "2024-01-20T00:00:00.000Z" },
    ],
    fechaCreacion: "2024-01-15T00:00:00.000Z",
    ultimaActualizacion: "2024-07-04T00:00:00.000Z",
  },
  {
    _id: 34,
    nombre: "Carlos",
    apellido: "Stefan",
    email: "stefan@sistema.com",
    password: "999",
    telefono: "",
    activo: true,
    supervisoresAsignados: [
      { nombre: "Cecilia Pizzini", fechaAsignacion: "2024-01-15T00:00:00.000Z", supervisorId: 44 },
      { nombre: "Diego Nonino", fechaAsignacion: "2024-01-20T00:00:00.000Z", supervisorId: 56 },
      { nombre: "Ulises Cosoli", fechaAsignacion: "2024-02-01T00:00:00.000Z", supervisorId: 43 },
    ],
    fechaCreacion: "2024-01-01T00:00:00.000Z",
    ultimaActualizacion: "2024-07-04T00:00:00.000Z",
  },
  {
    _id: 44,
    nombre: "Cecilia",
    apellido: "Pizzini",
    email: "cecilia.pizzini@supervisor.com",
    password: "999",
    telefono: "",
    activo: true,
    supervisoresAsignados: [
      { nombre: "Ulises Cosoli", fechaAsignacion: "2024-02-01T00:00:00.000Z", supervisorId: 43 },
      { nombre: "Diego Nonino", fechaAsignacion: "2024-01-20T00:00:00.000Z", supervisorId: 56 },
      { nombre: "Marcelo Pascua", fechaAsignacion: "2024-02-01T00:00:00.000Z", supervisorId: 76 },
    ],
    fechaCreacion: "2024-01-01T00:00:00.000Z",
    ultimaActualizacion: "2026-02-20T00:00:00.000Z",
  },
]

async function main() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI no está configurado. Revisá .env o .env.local")
    process.exit(1)
  }

  let client
  try {
    console.log("🔌 Conectando a MongoDB...")
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    const db = client.db(DB_NAME)
    const col = db.collection(COLLECTION)

    let insertados = 0
    let omitidos = 0
    for (const jda of JDAS_INICIALES) {
      const existe = await col.findOne({ _id: jda._id })
      if (existe) {
        console.log(`   ⏭️  JDA _id=${jda._id} (${jda.email}) ya existe, se omite`)
        omitidos++
        continue
      }
      await col.insertOne(jda)
      console.log(`   ✅ Insertado JDA _id=${jda._id} – ${jda.nombre} (${jda.email})`)
      insertados++
    }

    console.log("\n🎉 Seed finalizado.")
    console.log(`   Insertados: ${insertados}`)
    console.log(`   Omitidos (ya existían): ${omitidos}`)
  } catch (err) {
    console.error("❌ Error:", err.message)
    process.exit(1)
  } finally {
    if (client) {
      await client.close()
      console.log("🔌 Desconectado de MongoDB")
    }
  }
}

main()

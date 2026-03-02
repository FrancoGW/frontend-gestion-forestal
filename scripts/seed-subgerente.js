/**
 * Seed de usuarios con rol "subgerente" en MongoDB (colección usuarios_admin).
 * No hardcodea usuarios en la app: los carga desde data/subgerentes.json o desde variables de entorno.
 *
 * Uso:
 *   node scripts/seed-subgerente.js
 *
 * Opción 1: Archivo data/subgerentes.json (array de objetos con nombre, apellido, email, password, activo, telefono?)
 * Opción 2: Variables de entorno (un solo usuario):
 *   SUBGERENTE_EMAIL, SUBGERENTE_PASSWORD, SUBGERENTE_NOMBRE, SUBGERENTE_APELLIDO
 */

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envFile = fs.readFileSync(filePath, "utf8");
    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const match = trimmed.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = value;
        }
      }
    });
  }
}

const rootDir = path.join(__dirname, "..");
loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env"));

const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = process.env.DB_NAME || "gestion_forestal";
const COLLECTION = "usuarios_admin";

const ROL = "subgerente";

function getSubgerentesToSeed() {
  const jsonPath = path.join(rootDir, "data", "subgerentes.json");
  if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, "utf8");
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        return data.map((u) => ({
          nombre: String(u.nombre || "").trim(),
          apellido: String(u.apellido || "").trim(),
          email: String(u.email || "").toLowerCase().trim(),
          password: String(u.password || ""),
          activo: u.activo !== false,
          telefono: u.telefono ? String(u.telefono).trim() : null,
          cuit: u.cuit ? String(u.cuit).trim() : null,
        }));
      }
    } catch (e) {
      console.warn("⚠️ No se pudo leer data/subgerentes.json:", e.message);
    }
  }

  const email = process.env.SUBGERENTE_EMAIL;
  const password = process.env.SUBGERENTE_PASSWORD;
  const nombre = process.env.SUBGERENTE_NOMBRE || "Subgerente";
  const apellido = process.env.SUBGERENTE_APELLIDO || "";

  if (email && password) {
    return [
      {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.toLowerCase().trim(),
        password,
        activo: true,
        telefono: null,
        cuit: null,
      },
    ];
  }

  console.warn("⚠️ No se encontró data/subgerentes.json ni SUBGERENTE_EMAIL/SUBGERENTE_PASSWORD. Usando un único usuario por defecto (cambiar en data/subgerentes.json).");
  return [
    {
      nombre: "Subgerente",
      apellido: "Sistema",
      email: "subgerente@sistema.com",
      password: "subgerente123",
      activo: true,
      telefono: null,
      cuit: null,
    },
  ];
}

async function main() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI no está configurado. Revisá .env o .env.local");
    process.exit(1);
  }

  const toSeed = getSubgerentesToSeed();
  if (toSeed.length === 0) {
    console.error("❌ No hay usuarios subgerente para cargar.");
    process.exit(1);
  }

  let client;
  try {
    console.log("🔌 Conectando a MongoDB...");
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    let insertados = 0;
    let omitidos = 0;
    for (const u of toSeed) {
      if (!u.email || u.email.indexOf("@") === -1) {
        console.warn(`   ⏭️  Omitiendo usuario sin email válido: ${u.nombre}`);
        continue;
      }
      if (!u.password || u.password.length < 4) {
        console.warn(`   ⏭️  Omitiendo ${u.email}: contraseña debe tener al menos 4 caracteres`);
        continue;
      }

      const existe = await col.findOne({ email: u.email });
      if (existe) {
        const actualizado = await col.findOneAndUpdate(
          { email: u.email },
          {
            $set: {
              nombre: u.nombre,
              apellido: u.apellido,
              password: u.password,
              rol: ROL,
              activo: u.activo,
              telefono: u.telefono,
              cuit: u.cuit,
              fechaActualizacion: new Date(),
            },
          },
          { returnDocument: "after" }
        );
        if (actualizado?.rol !== ROL) {
          console.log(`   ✅ Actualizado a rol subgerente: ${u.email}`);
        } else {
          console.log(`   ⏭️  Usuario ya existe (subgerente): ${u.email}`);
        }
        omitidos++;
        continue;
      }

      const doc = {
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        password: u.password,
        rol: ROL,
        activo: u.activo,
        telefono: u.telefono,
        cuit: u.cuit,
        fechaCreacion: new Date(),
      };
      await col.insertOne(doc);
      console.log(`   ✅ Insertado subgerente: ${u.email} (${u.nombre} ${u.apellido})`);
      insertados++;
    }

    console.log("\n🎉 Seed de subgerentes finalizado.");
    console.log(`   Insertados: ${insertados}`);
    console.log(`   Ya existían / actualizados: ${omitidos}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("🔌 Desconectado de MongoDB");
    }
  }
}

main();

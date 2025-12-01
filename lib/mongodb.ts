import { MongoClient, Db } from 'mongodb';

const uri: string = process.env.MONGODB_URI || '';
const dbName: string = process.env.DB_NAME || 'gestion_forestal';

// Para entornos serverless, usar un objeto global para el caché
declare global {
  var _mongoClient: MongoClient | undefined;
  var _mongoDb: Db | undefined;
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Verificar variable de entorno
  if (!uri) {
    throw new Error('MONGODB_URI no está configurada. Por favor agrega MONGODB_URI en las variables de entorno de Vercel.');
  }

  // En desarrollo, usar caché global para evitar múltiples conexiones
  if (process.env.NODE_ENV === 'development') {
    if (global._mongoClient && global._mongoDb) {
      return { client: global._mongoClient, db: global._mongoDb };
    }
  }

  // En producción o si no hay caché global, usar variables locales
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 0, // En serverless, no mantener conexiones mínimas
    });

    await client.connect();
    const db = client.db(dbName);

    // Guardar en caché
    cachedClient = client;
    cachedDb = db;

    // En desarrollo, también guardar en global
    if (process.env.NODE_ENV === 'development') {
      global._mongoClient = client;
      global._mongoDb = db;
    }

    console.log('✅ Conectado a MongoDB exitosamente');
    return { client, db };
  } catch (error: any) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.error('URI:', uri ? `${uri.substring(0, 20)}...` : 'NO CONFIGURADA');
    throw new Error(`Error al conectar a MongoDB: ${error.message}`);
  }
}

export async function getDB(): Promise<Db> {
  try {
    const { db } = await connectToDatabase();
    return db;
  } catch (error: any) {
    console.error('Error en getDB():', error);
    throw error;
  }
}


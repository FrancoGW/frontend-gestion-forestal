/**
 * Script para sincronizar manualmente las órdenes de trabajo desde la API externa
 * Uso: node scripts/sync-ordenes.js
 */

// Cargar variables de entorno desde .env.local o .env si existen
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envFile = fs.readFileSync(filePath, 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

const rootDir = path.join(__dirname, '..');
// Cargar .env.local primero (tiene prioridad), luego .env
loadEnvFile(path.join(rootDir, '.env.local'));
loadEnvFile(path.join(rootDir, '.env'));

const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuración desde variables de entorno o valores por defecto
const MONGODB_URI = process.env.MONGODB_URI || '';
const WORK_ORDERS_API_URL = process.env.WORK_ORDERS_API_URL || 'https://gis.fasa.ibc.ar/api/ordenes/listar';
const WORK_ORDERS_API_KEY = process.env.WORK_ORDERS_API_KEY || 'c3kvEUZ3yqzjU7ePcqesLUOZfaijujtRbl1tswiscXY7XxcU2LuZtvlB9I0oAq2g';
const WORK_ORDERS_FROM_DATE = process.env.WORK_ORDERS_FROM_DATE || '2020-01-01';

async function obtenerOrdenesDeTrabajoAPI() {
  try {
    console.log(`\n📡 Obteniendo órdenes desde: ${WORK_ORDERS_FROM_DATE}`);
    console.log(`🔗 URL: ${WORK_ORDERS_API_URL}`);
    
    const response = await axios.get(WORK_ORDERS_API_URL, {
      headers: {
        'x-api-key': WORK_ORDERS_API_KEY,
      },
      params: {
        from: WORK_ORDERS_FROM_DATE,
      },
      timeout: 60000, // 60 segundos de timeout
    });
    
    let ordenes = response.data;
    
    if (ordenes && typeof ordenes === 'object' && !Array.isArray(ordenes)) {
      if (ordenes.data && Array.isArray(ordenes.data)) {
        ordenes = ordenes.data;
      } else if (ordenes.ordenes && Array.isArray(ordenes.ordenes)) {
        ordenes = ordenes.ordenes;
      } else if (ordenes.results && Array.isArray(ordenes.results)) {
        ordenes = ordenes.results;
      }
    }
    
    if (!Array.isArray(ordenes)) {
      console.error('❌ La respuesta no es un array');
      console.error('Respuesta recibida:', JSON.stringify(ordenes, null, 2).substring(0, 500));
      return [];
    }
    
    console.log(`✅ Total de órdenes recibidas: ${ordenes.length}`);
    return ordenes;
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error HTTP ${error.response.status}: ${error.response.statusText}`);
      console.error('Respuesta:', JSON.stringify(error.response.data, null, 2).substring(0, 500));
    } else if (error.request) {
      console.error('❌ No se recibió respuesta del servidor');
      console.error('Request:', error.request);
    } else {
      console.error('❌ Error:', error.message);
    }
    throw error;
  }
}

async function procesarOrdenesDeTrabajoAPI(db, ordenes) {
  try {
    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      console.log('⚠️  No hay órdenes para procesar');
      return;
    }
    
    const coleccion = db.collection('ordenesTrabajoAPI');
    // El índice _id ya es único por defecto en MongoDB, no necesitamos crearlo
    
    let procesadas = 0;
    let actualizadas = 0;
    let nuevas = 0;
    let errores = 0;
    
    console.log(`\n💾 Procesando ${ordenes.length} órdenes...`);
    
    for (const orden of ordenes) {
      try {
        if (!orden._id) {
          console.warn(`⚠️  Orden sin _id, saltando:`, JSON.stringify(orden).substring(0, 100));
          errores++;
          continue;
        }
        
        // Verificar si existe
        const existe = await coleccion.findOne({ _id: orden._id });
        
        await coleccion.updateOne(
          { _id: orden._id },
          { $set: orden },
          { upsert: true }
        );
        
        if (existe) {
          actualizadas++;
        } else {
          nuevas++;
        }
        procesadas++;
        
        // Mostrar progreso cada 100 órdenes
        if (procesadas % 100 === 0) {
          process.stdout.write(`\r   Procesadas: ${procesadas}/${ordenes.length}...`);
        }
      } catch (error) {
        console.error(`\n❌ Error al procesar orden ${orden._id}:`, error.message);
        errores++;
      }
    }
    
    console.log(`\n\n✅ Resumen:`);
    console.log(`   📊 Total procesadas: ${procesadas}`);
    console.log(`   🆕 Nuevas: ${nuevas}`);
    console.log(`   🔄 Actualizadas: ${actualizadas}`);
    if (errores > 0) {
      console.log(`   ❌ Errores: ${errores}`);
    }
  } catch (error) {
    console.error('❌ Error al procesar órdenes de trabajo:', error);
    throw error;
  }
}

async function main() {
  if (!MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI no está configurado');
    console.error('   Configúralo como variable de entorno o en un archivo .env.local');
    process.exit(1);
  }
  
  let client;
  try {
    console.log('🔌 Conectando a MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db();
    
    // Obtener órdenes
    const ordenes = await obtenerOrdenesDeTrabajoAPI();
    
    // Procesar órdenes
    await procesarOrdenesDeTrabajoAPI(db, ordenes);
    
    console.log('\n🎉 Sincronización completada exitosamente');
    
  } catch (error) {
    console.error('\n❌ Error en la sincronización:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Desconectado de MongoDB');
    }
  }
}

// Ejecutar
main();


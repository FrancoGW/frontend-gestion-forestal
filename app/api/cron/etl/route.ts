import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getDB } from '@/lib/mongodb';

// Configuración desde variables de entorno
const ADMIN_API_URL = process.env.ADMIN_API_URL || 'https://gis.fasa.ibc.ar/ordenes/json-tablas-adm';
const WORK_ORDERS_API_URL = process.env.WORK_ORDERS_API_URL || 'https://gis.fasa.ibc.ar/api/ordenes/listar';
const WORK_ORDERS_API_KEY = process.env.WORK_ORDERS_API_KEY || 'c3kvEUZ3yqzjU7ePcqesLUOZfaijujtRbl1tswiscXY7XxcU2LuZtvlB9I0oAq2g';
const WORK_ORDERS_FROM_DATE = process.env.WORK_ORDERS_FROM_DATE || '2020-01-01';
const PROTECTION_API_URL = process.env.PROTECTION_API || 'https://gis.fasa.ibc.ar/proteccion/json';

async function obtenerDatosAdministrativos() {
  try {
    const response = await axios.get(ADMIN_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error al obtener datos administrativos:', error);
    throw error;
  }
}

async function obtenerOrdenesDeTrabajoAPI() {
  try {
    console.log(`Obteniendo órdenes desde: ${WORK_ORDERS_FROM_DATE}`);
    const response = await axios.get(WORK_ORDERS_API_URL, {
      headers: {
        'x-api-key': WORK_ORDERS_API_KEY,
      },
      params: {
        from: WORK_ORDERS_FROM_DATE,
      },
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
      console.error('La respuesta no es un array');
      return [];
    }
    
    console.log(`Total de órdenes recibidas: ${ordenes.length}`);
    return ordenes;
  } catch (error: any) {
    console.error('Error al obtener órdenes de trabajo:', error.message);
    throw error;
  }
}

async function obtenerDatosProteccion() {
  try {
    const response = await axios.get(PROTECTION_API_URL);
    return response.data;
  } catch (error) {
    console.error('Error al obtener datos de protección:', error);
    throw error;
  }
}

interface DocumentoBase {
  [key: string]: any;
}

async function procesarDatosAdministrativos(db: any, datosAdmin: any) {
  const colecciones = [
    { nombre: 'zonas', datos: datosAdmin.zonas || [], idField: '_id' },
    { nombre: 'propietarios', datos: datosAdmin.propietarios || [], idField: '_id' },
    { nombre: 'campos', datos: datosAdmin.campos || [], idField: 'idcampo' },
    { nombre: 'empresas', datos: datosAdmin.empresas || [], idField: 'idempresa' },
    { nombre: 'actividades', datos: datosAdmin.actividades || [], idField: '_id' },
    { nombre: 'usuarios', datos: datosAdmin.usuarios || [], idField: '_id' },
    { nombre: 'tiposUso', datos: datosAdmin.tiposUso || [], idField: 'idtipouso' },
    { nombre: 'especies', datos: datosAdmin.especies || [], idField: '_id' },
    { nombre: 'ambientales', datos: datosAdmin.ambientales || [], idField: '_id' },
    { nombre: 'insumos', datos: datosAdmin.insumos || [], idField: '_id' },
  ];
  
  for (const coleccion of colecciones) {
    try {
      const documentosMapeados = coleccion.datos.map((item: DocumentoBase) => {
        const documento = { ...item };
        if (coleccion.idField !== '_id') {
          documento._id = item[coleccion.idField];
          delete documento[coleccion.idField];
        }
        return documento;
      });

      const operaciones = documentosMapeados.map((doc: DocumentoBase) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true
        }
      }));

      if (operaciones.length > 0) {
        await db.collection(coleccion.nombre).bulkWrite(operaciones);
      }
    } catch (error) {
      console.error(`Error al procesar ${coleccion.nombre}:`, error);
    }
  }
}

async function procesarOrdenesDeTrabajoAPI(db: any, ordenes: any[]) {
  try {
    if (!Array.isArray(ordenes) || ordenes.length === 0) {
      return;
    }
    
    const coleccion = db.collection('ordenesTrabajoAPI');
    await coleccion.createIndex({ _id: 1 }, { unique: true });
    
    let procesadas = 0;
    let errores = 0;
    
    for (const orden of ordenes) {
      try {
        if (!orden._id) {
          errores++;
          continue;
        }
        
        await coleccion.updateOne(
          { _id: orden._id },
          { $set: orden },
          { upsert: true }
        );
        procesadas++;
      } catch (error: any) {
        console.error(`Error al procesar orden ${orden._id}:`, error.message);
        errores++;
      }
    }
    
    console.log(`Órdenes procesadas: ${procesadas}, Errores: ${errores}`);
  } catch (error) {
    console.error('Error al procesar órdenes de trabajo:', error);
  }
}

async function procesarDatosProteccion(db: any, datos: any[]) {
  try {
    const coleccion = db.collection('proteccion');
    
    const operaciones = datos.map((doc: any) => ({
      updateOne: {
        filter: { _id: doc.id },
        update: { $set: doc },
        upsert: true
      }
    }));

    if (operaciones.length > 0) {
      await coleccion.bulkWrite(operaciones);
    }
  } catch (error) {
    console.error('Error al procesar datos de protección:', error);
  }
}

export async function GET(request: NextRequest) {
  // Solo permitir solicitudes GET
  try {
    // Verificar cron secret si se proporciona
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    // Conectar a MongoDB
    const db = await getDB();
    
    // Obtener datos de las APIs
    const [datosAdmin, ordenesTrabajoAPI, datosProteccion] = await Promise.all([
      obtenerDatosAdministrativos(),
      obtenerOrdenesDeTrabajoAPI(),
      obtenerDatosProteccion()
    ]);
    
    // Procesar los datos
    await procesarDatosAdministrativos(db, datosAdmin);
    await procesarOrdenesDeTrabajoAPI(db, ordenesTrabajoAPI);
    await procesarDatosProteccion(db, datosProteccion);
    
    return NextResponse.json({ 
      success: true, 
      mensaje: 'Proceso ETL completado con éxito' 
    });
  } catch (error: any) {
    console.error('Error en cron job ETL:', error);
    return NextResponse.json(
      { error: 'Proceso ETL falló', details: error.message },
      { status: 500 }
    );
  }
}



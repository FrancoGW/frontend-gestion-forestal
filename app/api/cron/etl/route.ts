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
    console.log(`Obteniendo datos administrativos desde: ${ADMIN_API_URL}`);
    const response = await axios.get(ADMIN_API_URL, {
      headers: {
        'x-api-key': WORK_ORDERS_API_KEY,
      },
      timeout: 30000, // 30 segundos de timeout
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response 
      ? `Status ${error.response.status}: ${error.response.statusText} - ${error.response.data?.message || error.message}`
      : error.message;
    console.error('Error al obtener datos administrativos:', errorMessage);
    console.error('URL:', ADMIN_API_URL);
    throw new Error(errorMessage);
  }
}

async function obtenerOrdenesDeTrabajoAPI() {
  try {
    console.log(`Obteniendo órdenes desde: ${WORK_ORDERS_FROM_DATE}`);
    console.log(`URL: ${WORK_ORDERS_API_URL}`);
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
      console.error('La respuesta no es un array');
      return [];
    }
    
    console.log(`Total de órdenes recibidas: ${ordenes.length}`);
    return ordenes;
  } catch (error: any) {
    const errorMessage = error.response 
      ? `Status ${error.response.status}: ${error.response.statusText} - ${error.response.data?.message || error.message}`
      : error.message;
    console.error('Error al obtener órdenes de trabajo:', errorMessage);
    console.error('URL:', WORK_ORDERS_API_URL);
    console.error('From date:', WORK_ORDERS_FROM_DATE);
    throw new Error(errorMessage);
  }
}

async function obtenerDatosProteccion() {
  try {
    console.log(`Obteniendo datos de protección desde: ${PROTECTION_API_URL}`);
    const response = await axios.get(PROTECTION_API_URL, {
      headers: {
        'x-api-key': WORK_ORDERS_API_KEY,
      },
      timeout: 30000, // 30 segundos de timeout
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response 
      ? `Status ${error.response.status}: ${error.response.statusText} - ${error.response.data?.message || error.message}`
      : error.message;
    console.error('Error al obtener datos de protección:', errorMessage);
    console.error('URL:', PROTECTION_API_URL);
    throw new Error(errorMessage);
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
      console.log('No hay órdenes para procesar');
      return;
    }
    
    const coleccion = db.collection('ordenesTrabajoAPI');
    // El índice _id ya es único por defecto en MongoDB, no necesitamos crearlo
    
    let procesadas = 0;
    let nuevas = 0;
    let actualizadas = 0;
    let errores = 0;
    
    console.log(`Procesando ${ordenes.length} órdenes...`);
    
    for (const orden of ordenes) {
      try {
        if (!orden._id) {
          console.warn(`Orden sin _id, saltando:`, JSON.stringify(orden).substring(0, 100));
          errores++;
          continue;
        }
        
        // Verificar si existe antes de actualizar
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
          console.log(`Procesadas: ${procesadas}/${ordenes.length}...`);
        }
      } catch (error: any) {
        console.error(`Error al procesar orden ${orden._id}:`, error.message);
        errores++;
      }
    }
    
    console.log(`Órdenes procesadas: ${procesadas} (Nuevas: ${nuevas}, Actualizadas: ${actualizadas}, Errores: ${errores})`);
  } catch (error: any) {
    console.error('Error al procesar órdenes de trabajo:', error.message);
    throw error;
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
    
    // Ejecutar cada parte del ETL independientemente para que no falle todo si una parte falla
    const resultados: any = {
      datosAdministrativos: { exito: false, error: null },
      ordenesTrabajo: { exito: false, error: null, cantidad: 0 },
      datosProteccion: { exito: false, error: null }
    };
    
    // Procesar datos administrativos
    try {
      const datosAdmin = await obtenerDatosAdministrativos();
      await procesarDatosAdministrativos(db, datosAdmin);
      resultados.datosAdministrativos.exito = true;
    } catch (error: any) {
      resultados.datosAdministrativos.error = error.message;
      console.error('Error en datos administrativos:', error);
    }
    
    // Procesar órdenes de trabajo
    try {
      const ordenesTrabajoAPI = await obtenerOrdenesDeTrabajoAPI();
      await procesarOrdenesDeTrabajoAPI(db, ordenesTrabajoAPI);
      resultados.ordenesTrabajo.exito = true;
      resultados.ordenesTrabajo.cantidad = Array.isArray(ordenesTrabajoAPI) ? ordenesTrabajoAPI.length : 0;
    } catch (error: any) {
      resultados.ordenesTrabajo.error = error.message;
      console.error('Error en órdenes de trabajo:', error);
    }
    
    // Procesar datos de protección
    try {
      const datosProteccion = await obtenerDatosProteccion();
      await procesarDatosProteccion(db, datosProteccion);
      resultados.datosProteccion.exito = true;
    } catch (error: any) {
      resultados.datosProteccion.error = error.message;
      console.error('Error en datos de protección:', error);
    }
    
    // Determinar si hubo al menos un éxito
    const algunExito = resultados.datosAdministrativos.exito || 
                       resultados.ordenesTrabajo.exito || 
                       resultados.datosProteccion.exito;
    
    return NextResponse.json({ 
      success: algunExito,
      mensaje: algunExito ? 'Proceso ETL completado (algunas partes pueden haber fallado)' : 'Proceso ETL falló completamente',
      resultados
    });
  } catch (error: any) {
    console.error('Error en cron job ETL:', error);
    return NextResponse.json(
      { error: 'Proceso ETL falló', details: error.message },
      { status: 500 }
    );
  }
}



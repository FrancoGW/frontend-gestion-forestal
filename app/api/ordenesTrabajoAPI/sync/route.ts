import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getDB } from '@/lib/mongodb';

const WORK_ORDERS_API_URL = process.env.WORK_ORDERS_API_URL || 'https://gis.fasa.ibc.ar/api/ordenes/listar';
// Key obligatoria: env o la del curl (header x-api-key)
const GIS_API_KEY = (process.env.WORK_ORDERS_API_KEY && process.env.WORK_ORDERS_API_KEY.trim()) || 'c3kvEUZ3yqzjU7ePcqesLUOZfaijujtRbl1tswiscXY7XxcU2LuZtvlB9I0oAq2g';
const DEFAULT_FROM = '2025-01-12';

async function fetchOrdenesFromGIS(from: string) {
  const url = `${WORK_ORDERS_API_URL}?from=${encodeURIComponent(from)}`;
  const response = await axios.get(url, {
    headers: {
      'x-api-key': GIS_API_KEY,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; ForestalSync/1.0)',
    },
    timeout: 120000,
    validateStatus: () => true,
  });
  if (response.status !== 200) {
    const body = response.data;
    if (response.status >= 500) {
      console.error('GIS API 5xx – body:', typeof body === 'object' ? JSON.stringify(body) : body);
    }
    const msg = body?.message || body?.error || body?.detail || response.statusText || `HTTP ${response.status}`;
    throw new Error(`El servidor GIS respondió con error (${response.status}). Probalo de nuevo en unos minutos o revisá con el equipo de GIS. Detalle: ${msg}`);
  }
  let ordenes = response.data;
  if (ordenes && typeof ordenes === 'object' && !Array.isArray(ordenes)) {
    if (ordenes.data && Array.isArray(ordenes.data)) ordenes = ordenes.data;
    else if (ordenes.ordenes && Array.isArray(ordenes.ordenes)) ordenes = ordenes.ordenes;
    else if (ordenes.results && Array.isArray(ordenes.results)) ordenes = ordenes.results;
  }
  return Array.isArray(ordenes) ? ordenes : [];
}

async function procesarOrdenes(db: any, ordenes: any[]) {
  const coleccion = db.collection('ordenesTrabajoAPI');
  let procesadas = 0;
  let nuevas = 0;
  let actualizadas = 0;
  let errores = 0;
  for (const orden of ordenes) {
    try {
      if (!orden._id) {
        errores++;
        continue;
      }
      const existe = await coleccion.findOne({ _id: orden._id });
      await coleccion.updateOne({ _id: orden._id }, { $set: orden }, { upsert: true });
      if (existe) actualizadas++;
      else nuevas++;
      procesadas++;
    } catch (_) {
      errores++;
    }
  }
  return { procesadas, nuevas, actualizadas, errores };
}

export async function GET(request: NextRequest) {
  try {
    const from = request.nextUrl.searchParams.get('from') || DEFAULT_FROM;
    const ordenes = await fetchOrdenesFromGIS(from);
    const db = await getDB();
    const { procesadas, nuevas, actualizadas, errores } = await procesarOrdenes(db, ordenes);
    return NextResponse.json({
      success: true,
      mensaje: `Sincronizadas ${procesadas} órdenes desde GIS (from=${from})`,
      cantidad: procesadas,
      nuevas,
      actualizadas,
      errores,
    });
  } catch (error: any) {
    console.error('Error en sync órdenes GIS:', error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al sincronizar órdenes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

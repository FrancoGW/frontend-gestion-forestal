import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getDB } from '@/lib/mongodb';

const WORK_ORDERS_API_URL = process.env.WORK_ORDERS_API_URL || 'https://gis.fasa.ibc.ar/api/ordenes/listar';
// Key obligatoria: env o la del curl (header x-api-key)
const GIS_API_KEY = (process.env.WORK_ORDERS_API_KEY && process.env.WORK_ORDERS_API_KEY.trim()) || 'c3kvEUZ3yqzjU7ePcqesLUOZfaijujtRbl1tswiscXY7XxcU2LuZtvlB9I0oAq2g';
const DEFAULT_FROM = '2025-01-12';
const FORCE_FROM = process.env.WORK_ORDERS_FROM_DATE || '2020-01-01';

async function fetchOrdenesFromGIS(from: string, sessionCookie?: string | null) {
  const url = `${WORK_ORDERS_API_URL}?from=${encodeURIComponent(from)}`;
  const headers: Record<string, string> = {
    'x-api-key': GIS_API_KEY,
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (compatible; ForestalSync/1.0)',
  };
  if (sessionCookie?.trim()) {
    headers['Cookie'] = `PHPSESSID=${sessionCookie.trim()}`;
  }
  const response = await axios.get(url, {
    headers,
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

  const sinId = ordenes.filter(o => o._id == null).length;

  const operations = ordenes
    .filter(o => o._id != null)
    .map(orden => {
      const { _id, ...resto } = orden;
      return {
        updateOne: {
          filter: { _id },
          update: { $set: resto },
          upsert: true,
        },
      };
    });

  if (operations.length === 0) {
    return { procesadas: 0, nuevas: 0, actualizadas: 0, errores: sinId };
  }

  const result = await coleccion.bulkWrite(operations, { ordered: false });

  return {
    procesadas: result.upsertedCount + result.matchedCount,
    nuevas: result.upsertedCount,
    actualizadas: result.matchedCount,
    errores: sinId + (result.writeErrors?.length ?? 0),
  };
}

export async function GET(request: NextRequest) {
  try {
    const force = request.nextUrl.searchParams.get('force') === '1' || request.nextUrl.searchParams.get('force') === 'true';
    const from = force ? FORCE_FROM : (request.nextUrl.searchParams.get('from') || DEFAULT_FROM);
    const sessionCookie = request.nextUrl.searchParams.get('session') ?? request.headers.get('x-gis-session');
    const ordenes = await fetchOrdenesFromGIS(from, sessionCookie);
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
  try {
    const body = await request.json().catch(() => ({}));
    const force = body.force === true || body.force === '1' || request.nextUrl.searchParams.get('force') === '1';
    const from = force ? FORCE_FROM : (body.from ?? request.nextUrl.searchParams.get('from') ?? DEFAULT_FROM);
    const sessionCookie = body.session ?? request.headers.get('x-gis-session') ?? request.nextUrl.searchParams.get('session');
    const ordenes = await fetchOrdenesFromGIS(from, sessionCookie);
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

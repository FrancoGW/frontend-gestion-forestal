import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    const searchParams = request.nextUrl.searchParams;
    
    const query: any = {};
    
    // Opciones de filtro
    if (searchParams.get('estado')) query.estado = parseInt(searchParams.get('estado')!);
    if (searchParams.get('cod_zona')) query.cod_zona = parseInt(searchParams.get('cod_zona')!);
    if (searchParams.get('cod_campo')) query.cod_campo = parseInt(searchParams.get('cod_campo')!);
    if (searchParams.get('cod_empres')) query.cod_empres = parseInt(searchParams.get('cod_empres')!);
    if (searchParams.get('supervisor_id')) query.supervisor_id = parseInt(searchParams.get('supervisor_id')!);
    
    // Rango de fechas
    if (searchParams.get('fechaDesde') && searchParams.get('fechaHasta')) {
      query.fecha = {
        $gte: searchParams.get('fechaDesde')!,
        $lte: searchParams.get('fechaHasta')!
      };
    } else if (searchParams.get('fechaDesde')) {
      query.fecha = { $gte: searchParams.get('fechaDesde')! };
    } else if (searchParams.get('fechaHasta')) {
      query.fecha = { $lte: searchParams.get('fechaHasta')! };
    }
    
    // Paginación
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const limite = parseInt(searchParams.get('limite') || '20');
    const salto = (pagina - 1) * limite;
    
    // Ejecutar consulta con paginación
    const ordenes = await db.collection('ordenesTrabajoAPI')
      .find(query)
      .sort({ fecha: -1 })
      .skip(salto)
      .limit(limite)
      .toArray();
    
    // Obtener el total para info de paginación
    const total = await db.collection('ordenesTrabajoAPI').countDocuments(query);
    
    return NextResponse.json({
      ordenes,
      paginacion: {
        total,
        pagina,
        limite,
        paginas: Math.ceil(total / limite)
      }
    });
  } catch (error: any) {
    console.error('Error al obtener órdenes de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes de trabajo' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const nuevaOrden = await request.json();
    
    // Generar un ID secuencial si no se proporciona
    if (!nuevaOrden._id) {
      const ultimaOrden = await db.collection('ordenesTrabajoAPI')
        .find()
        .sort({ _id: -1 })
        .limit(1)
        .toArray();
      if (ultimaOrden.length > 0 && typeof ultimaOrden[0]._id === 'number') {
        nuevaOrden._id = ultimaOrden[0]._id + 1;
      } else {
        nuevaOrden._id = 1;
      }
    }
    
    await db.collection('ordenesTrabajoAPI').insertOne(nuevaOrden);
    
    return NextResponse.json(
      { mensaje: 'Orden de trabajo creada', id: nuevaOrden._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al crear orden de trabajo' },
      { status: 500 }
    );
  }
}


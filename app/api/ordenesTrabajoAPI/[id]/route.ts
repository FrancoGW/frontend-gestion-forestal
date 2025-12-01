import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    const id = Number(params.id);
    const orden = await db.collection('ordenesTrabajoAPI').findOne({ _id: id as any });
    
    if (!orden) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(orden);
  } catch (error: any) {
    console.error('Error al obtener orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al obtener orden de trabajo' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    const id = Number(params.id);
    const actualizaciones = await request.json();
    delete actualizaciones._id;
    
    const result = await db.collection('ordenesTrabajoAPI').updateOne(
      { _id: id as any },
      { $set: actualizaciones }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ mensaje: 'Orden de trabajo actualizada' });
  } catch (error: any) {
    console.error('Error al actualizar orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden de trabajo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    const id = Number(params.id);
    const result = await db.collection('ordenesTrabajoAPI').deleteOne({ _id: id as any });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ mensaje: 'Orden de trabajo eliminada' });
  } catch (error: any) {
    console.error('Error al eliminar orden de trabajo:', error);
    return NextResponse.json(
      { error: 'Error al eliminar orden de trabajo' },
      { status: 500 }
    );
  }
}


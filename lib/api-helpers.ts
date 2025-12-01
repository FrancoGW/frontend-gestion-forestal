import { NextRequest, NextResponse } from 'next/server';
import { getDB } from './mongodb';
import { ObjectId } from 'mongodb';

/**
 * Helper para crear rutas genéricas CRUD para colecciones administrativas
 */
export async function handleAdminCollectionRoute(
  collectionName: string,
  request: NextRequest,
  id?: string
) {
  try {
    const db = await getDB();
    const method = request.method;

    // GET - Listar todos
    if (method === 'GET' && !id) {
      const items = await db.collection(collectionName).find().toArray();
      return NextResponse.json(items);
    }

    // GET - Obtener por ID
    if (method === 'GET' && id) {
      let queryId: any = id;
      
      // Intentar como ObjectId si tiene 24 caracteres
      if (id.length === 24 && ObjectId.isValid(id)) {
        queryId = new ObjectId(id);
      } else if (!isNaN(Number(id))) {
        queryId = Number(id);
      }

      const item = await db.collection(collectionName).findOne({ _id: queryId });
      
      if (!item) {
        return NextResponse.json(
          { error: `Elemento de ${collectionName} no encontrado` },
          { status: 404 }
        );
      }
      
      return NextResponse.json(item);
    }

    // POST - Crear
    if (method === 'POST') {
      const body = await request.json();
      const result = await db.collection(collectionName).insertOne(body);
      const documentoCreado = await db.collection(collectionName).findOne({ _id: result.insertedId });
      
      return NextResponse.json(documentoCreado, { status: 201 });
    }

    // PUT - Actualizar
    if (method === 'PUT' && id) {
      const body = await request.json();
      let queryId: any = id;
      
      if (id.length === 24 && ObjectId.isValid(id)) {
        queryId = new ObjectId(id);
      } else if (!isNaN(Number(id))) {
        queryId = Number(id);
      }

      const result = await db.collection(collectionName).updateOne(
        { _id: queryId },
        { $set: body }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: `Elemento de ${collectionName} no encontrado` },
          { status: 404 }
        );
      }
      
      const documentoActualizado = await db.collection(collectionName).findOne({ _id: queryId });
      return NextResponse.json(documentoActualizado);
    }

    // DELETE - Eliminar
    if (method === 'DELETE' && id) {
      let queryId: any = id;
      
      if (id.length === 24 && ObjectId.isValid(id)) {
        queryId = new ObjectId(id);
      } else if (!isNaN(Number(id))) {
        queryId = Number(id);
      }

      const result = await db.collection(collectionName).deleteOne({ _id: queryId });
      
      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: `Elemento de ${collectionName} no encontrado` },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        mensaje: `Elemento de ${collectionName} eliminado correctamente`,
        _id: queryId 
      });
    }

    return NextResponse.json(
      { error: 'Método no permitido' },
      { status: 405 }
    );
  } catch (error: any) {
    console.error(`Error en ${collectionName}:`, error);
    return NextResponse.json(
      { error: `Error al procesar ${collectionName}` },
      { status: 500 }
    );
  }
}



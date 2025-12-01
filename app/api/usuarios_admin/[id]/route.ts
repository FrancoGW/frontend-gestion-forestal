import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDB();
    const id = params.id;

    // Validar que el ID sea un ObjectId válido
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'ID de usuario inválido' 
        },
        { status: 400 }
      );
    }

    const objectId = new ObjectId(id);
    const usuario = await db.collection('usuarios_admin').findOne({ _id: objectId });
    
    if (!usuario) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Usuario no encontrado' 
        },
        { status: 404 }
      );
    }
    
    // No devolver la contraseña
    const { password, ...usuarioSinPassword } = usuario;
    return NextResponse.json({
      success: true,
      data: usuarioSinPassword
    });
  } catch (error: any) {
    console.error('Error al obtener usuario admin:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener usuario admin',
        error: error.message
      },
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
    const id = params.id;

    // Validar que el ID sea un ObjectId válido
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID de usuario inválido'
        },
        { status: 400 }
      );
    }

    const objectId = new ObjectId(id);
    const {
      nombre,
      apellido,
      email,
      password,
      rol,
      cuit,
      telefono,
      activo
    } = await request.json();

    // Verificar que el usuario existe
    const usuarioExistente = await db.collection('usuarios_admin').findOne({ _id: objectId });
    if (!usuarioExistente) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado'
        },
        { status: 404 }
      );
    }

    // Validaciones
    if (nombre !== undefined) {
      if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            message: 'El nombre debe tener al menos 2 caracteres'
          },
          { status: 400 }
        );
      }
    }

    if (apellido !== undefined) {
      if (!apellido || typeof apellido !== 'string' || apellido.trim().length < 2) {
        return NextResponse.json(
          {
            success: false,
            message: 'El apellido debe tener al menos 2 caracteres'
          },
          { status: 400 }
        );
      }
    }

    if (email !== undefined) {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json(
          {
            success: false,
            message: 'El email debe ser válido'
          },
          { status: 400 }
        );
      }

      // Verificar que el email sea único (excluyendo el usuario actual)
      const usuarioConMismoEmail = await db.collection('usuarios_admin').findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: objectId },
        activo: true 
      });

      if (usuarioConMismoEmail) {
        return NextResponse.json(
          {
            success: false,
            message: 'Ya existe otro usuario con ese email'
          },
          { status: 400 }
        );
      }
    }

    if (password !== undefined) {
      if (!password || typeof password !== 'string' || password.length < 4) {
        return NextResponse.json(
          {
            success: false,
            message: 'La contraseña debe tener al menos 4 caracteres'
          },
          { status: 400 }
        );
      }
    }

    if (rol !== undefined) {
      if (!['admin', 'supervisor', 'provider'].includes(rol)) {
        return NextResponse.json(
          {
            success: false,
            message: 'El rol debe ser: admin, supervisor, o provider'
          },
          { status: 400 }
        );
      }
    }

    // Preparar la actualización
    const actualizacion: any = {
      fechaActualizacion: new Date()
    };

    if (nombre !== undefined) actualizacion.nombre = nombre.trim();
    if (apellido !== undefined) actualizacion.apellido = apellido.trim();
    if (email !== undefined) actualizacion.email = email.toLowerCase().trim();
    if (password !== undefined) actualizacion.password = password;
    if (rol !== undefined) actualizacion.rol = rol;
    if (cuit !== undefined) actualizacion.cuit = cuit ? cuit.trim() : null;
    if (telefono !== undefined) actualizacion.telefono = telefono ? telefono.trim() : null;
    if (activo !== undefined) actualizacion.activo = Boolean(activo);

    const result = await db.collection('usuarios_admin').updateOne(
      { _id: objectId },
      { $set: actualizacion }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado'
        },
        { status: 404 }
      );
    }

    // Obtener el usuario actualizado
    const usuarioActualizado = await db.collection('usuarios_admin').findOne({ _id: objectId });
    const { password: _, ...usuarioSinPassword } = usuarioActualizado as any;

    return NextResponse.json({
      success: true,
      message: 'Usuario admin actualizado exitosamente',
      data: usuarioSinPassword
    });
  } catch (error: any) {
    console.error('Error al actualizar usuario admin:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al actualizar usuario admin',
        error: error.message
      },
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
    const id = params.id;

    // Validar que el ID sea un ObjectId válido
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID de usuario inválido'
        },
        { status: 400 }
      );
    }

    const objectId = new ObjectId(id);

    // Verificar que el usuario existe
    const usuarioExistente = await db.collection('usuarios_admin').findOne({ _id: objectId });
    if (!usuarioExistente) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado'
        },
        { status: 404 }
      );
    }

    // Verificar que no se elimine el último usuario admin
    if ((usuarioExistente as any).rol === 'admin') {
      const adminsActivos = await db.collection('usuarios_admin').countDocuments({
        rol: 'admin',
        activo: true
      });

      if (adminsActivos <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: 'No se puede eliminar el último usuario administrador'
          },
          { status: 400 }
        );
      }
    }

    // Soft delete - marcar como inactivo
    const result = await db.collection('usuarios_admin').updateOne(
      { _id: objectId },
      { 
        $set: { 
          activo: false,
          fechaActualizacion: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario admin eliminado exitosamente',
      data: { id: objectId }
    });
  } catch (error: any) {
    console.error('Error al eliminar usuario admin:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al eliminar usuario admin',
        error: error.message
      },
      { status: 500 }
    );
  }
}


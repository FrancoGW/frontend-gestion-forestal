import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    const usuarios = await db.collection('usuarios_admin')
      .find({ activo: true })
      .sort({ nombre: 1 })
      .toArray();
    
    // No devolver las contraseñas en la respuesta
    const usuariosSinPassword = usuarios.map((usuario: any) => {
      const { password, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword;
    });
    
    return NextResponse.json({
      success: true,
      data: usuariosSinPassword
    });
  } catch (error: any) {
    console.error('Error al obtener usuarios admin:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener usuarios admin',
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const {
      nombre,
      apellido,
      email,
      password,
      rol,
      cuit,
      telefono,
      activo = true
    } = await request.json();

    // Validaciones
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'El nombre es requerido y debe tener al menos 2 caracteres'
        },
        { status: 400 }
      );
    }

    if (!apellido || typeof apellido !== 'string' || apellido.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'El apellido es requerido y debe tener al menos 2 caracteres'
        },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          message: 'El email es requerido y debe ser válido'
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json(
        {
          success: false,
          message: 'La contraseña es requerida y debe tener al menos 4 caracteres'
        },
        { status: 400 }
      );
    }

    if (!rol || !['admin', 'supervisor', 'provider'].includes(rol)) {
      return NextResponse.json(
        {
          success: false,
          message: 'El rol es requerido y debe ser: admin, supervisor, o provider'
        },
        { status: 400 }
      );
    }

    // Verificar que el email sea único
    const usuarioExistente = await db.collection('usuarios_admin').findOne({ 
      email: email.toLowerCase().trim(),
      activo: true 
    });

    if (usuarioExistente) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ya existe un usuario con ese email'
        },
        { status: 400 }
      );
    }

    const usuario = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      rol,
      cuit: cuit ? cuit.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      activo: Boolean(activo),
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    const result = await db.collection('usuarios_admin').insertOne(usuario);

    // No devolver la contraseña en la respuesta
    const { password: _, ...usuarioSinPassword } = usuario;

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario admin creado exitosamente',
        data: {
          _id: result.insertedId,
          ...usuarioSinPassword
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error al crear usuario admin:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al crear usuario admin',
        error: error.message
      },
      { status: 500 }
    );
  }
}


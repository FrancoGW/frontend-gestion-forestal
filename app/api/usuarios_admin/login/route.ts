import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    const { email, password } = await request.json();

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email y contraseña son requeridos'
        },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const usuario = await db.collection('usuarios_admin').findOne({ 
      email: email.toLowerCase().trim(),
      activo: true 
    });

    if (!usuario) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas'
        },
        { status: 401 }
      );
    }

    // Verificar contraseña (por ahora en texto plano)
    if (usuario.password !== password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas'
        },
        { status: 401 }
      );
    }

    // No devolver la contraseña en la respuesta
    const { password: _, ...usuarioSinPassword } = usuario;

    return NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
      data: usuarioSinPassword
    });
  } catch (error: any) {
    console.error('Error en autenticación:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error en autenticación',
        error: error.message
      },
      { status: 500 }
    );
  }
}



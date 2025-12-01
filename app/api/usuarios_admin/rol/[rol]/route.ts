import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { rol: string } }
) {
  try {
    const db = await getDB();
    const rol = params.rol;
    
    const rolesValidos = ['admin', 'supervisor', 'provider'];
    
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Rol inválido. Debe ser uno de: ' + rolesValidos.join(', ')
        },
        { status: 400 }
      );
    }

    const usuarios = await db.collection('usuarios_admin')
      .find({ 
        rol: rol,
        activo: true 
      })
      .sort({ nombre: 1 })
      .toArray();
    
    // No devolver las contraseñas
    const usuariosSinPassword = usuarios.map((usuario: any) => {
      const { password, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword;
    });
    
    return NextResponse.json({
      success: true,
      data: usuariosSinPassword
    });
  } catch (error: any) {
    console.error('Error al obtener usuarios por rol:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener usuarios por rol',
        error: error.message
      },
      { status: 500 }
    );
  }
}


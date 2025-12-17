import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'https://gis.fasa.ibc.ar/ordenes/json-tablas-adm';
const WORK_ORDERS_API_KEY = process.env.WORK_ORDERS_API_KEY || 'c3kvEUZ3yqzjU7ePcqesLUOZfaijujtRbl1tswiscXY7XxcU2LuZtvlB9I0oAq2g';

export async function GET(request: NextRequest) {
  try {
    const response = await axios.get(ADMIN_API_URL, {
      headers: {
        'x-api-key': WORK_ORDERS_API_KEY,
      },
    });
    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.error('Error al obtener datos de ADMIN_API_URL:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


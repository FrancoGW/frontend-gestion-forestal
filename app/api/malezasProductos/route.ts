import { NextRequest, NextResponse } from 'next/server';
import { handleAdminCollectionRoute } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return handleAdminCollectionRoute('malezasProductos', request);
}

export async function POST(request: NextRequest) {
  return handleAdminCollectionRoute('malezasProductos', request);
}



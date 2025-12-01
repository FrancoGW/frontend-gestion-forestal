import { NextRequest, NextResponse } from 'next/server';
import { handleAdminCollectionRoute } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleAdminCollectionRoute('empresas', request, params.id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleAdminCollectionRoute('empresas', request, params.id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleAdminCollectionRoute('empresas', request, params.id);
}

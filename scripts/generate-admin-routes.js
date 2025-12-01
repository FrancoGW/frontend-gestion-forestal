const fs = require('fs');
const path = require('path');

const collections = [
  'zonas', 'propietarios', 'campos', 'empresas', 'actividades',
  'usuarios', 'tiposUso', 'especies', 'ambientales', 'insumos',
  'cuadrillas', 'vecinos'
];

const baseRouteTemplate = `import { NextRequest, NextResponse } from 'next/server';
import { handleAdminCollectionRoute } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return handleAdminCollectionRoute('{{COLLECTION}}', request);
}

export async function POST(request: NextRequest) {
  return handleAdminCollectionRoute('{{COLLECTION}}', request);
}
`;

const idRouteTemplate = `import { NextRequest, NextResponse } from 'next/server';
import { handleAdminCollectionRoute } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleAdminCollectionRoute('{{COLLECTION}}', request, params.id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleAdminCollectionRoute('{{COLLECTION}}', request, params.id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleAdminCollectionRoute('{{COLLECTION}}', request, params.id);
}
`;

const apiDir = path.join(__dirname, '..', 'app', 'api');

collections.forEach(collection => {
  const collectionDir = path.join(apiDir, collection);
  const idDir = path.join(collectionDir, '[id]');
  
  // Crear directorios
  if (!fs.existsSync(idDir)) {
    fs.mkdirSync(idDir, { recursive: true });
  }
  
  // Crear route.ts base
  const baseRoutePath = path.join(collectionDir, 'route.ts');
  if (!fs.existsSync(baseRoutePath)) {
    const content = baseRouteTemplate.replace(/{{COLLECTION}}/g, collection);
    fs.writeFileSync(baseRoutePath, content);
    console.log(`Created ${baseRoutePath}`);
  }
  
  // Crear [id]/route.ts
  const idRoutePath = path.join(idDir, 'route.ts');
  if (!fs.existsSync(idRoutePath)) {
    const content = idRouteTemplate.replace(/{{COLLECTION}}/g, collection);
    fs.writeFileSync(idRoutePath, content);
    console.log(`Created ${idRoutePath}`);
  }
});

console.log('✅ All admin collection routes generated!');



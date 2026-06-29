import { NextRequest } from 'next/server';
import { handleProxy } from '@/lib/api/proxy';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export async function GET(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

export async function POST(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

export async function PUT(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

export async function PATCH(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

export async function DELETE(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

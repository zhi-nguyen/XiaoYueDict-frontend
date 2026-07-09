import { NextRequest, NextResponse } from 'next/server';
import { handleProxy } from '@/lib/api/proxy';

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

function shouldMockMediaImage(request: NextRequest): boolean {
  return request.nextUrl.pathname.startsWith('/api/core/media/image');
}

export async function GET(request: NextRequest) {
  if (shouldMockMediaImage(request)) {
    return NextResponse.json({ status: 'collecting' });
  }
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

export async function POST(request: NextRequest) {
  if (shouldMockMediaImage(request)) {
    return NextResponse.json({ status: 'collecting' });
  }
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

export async function PUT(request: NextRequest) {
  if (shouldMockMediaImage(request)) {
    return NextResponse.json({ status: 'collecting' });
  }
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

export async function PATCH(request: NextRequest) {
  if (shouldMockMediaImage(request)) {
    return NextResponse.json({ status: 'collecting' });
  }
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

export async function DELETE(request: NextRequest) {
  if (shouldMockMediaImage(request)) {
    return NextResponse.json({ status: 'collecting' });
  }
  return handleProxy(request, GATEWAY_URL, '/api/core', '/api/core');
}

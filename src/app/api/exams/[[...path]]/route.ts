import { NextRequest } from 'next/server';
import { handleProxy } from '@/lib/api/proxy';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost';

export async function GET(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/exams', '/api/core/exams');
}

export async function POST(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/exams', '/api/core/exams');
}

export async function PUT(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/exams', '/api/core/exams');
}

export async function PATCH(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/exams', '/api/core/exams');
}

export async function DELETE(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/api/exams', '/api/core/exams');
}

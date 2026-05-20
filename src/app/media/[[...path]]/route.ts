import { NextRequest } from 'next/server';
import { handleProxy } from '@/lib/api/proxy';

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost';

export async function GET(request: NextRequest) {
  return handleProxy(request, GATEWAY_URL, '/media', '/media');
}

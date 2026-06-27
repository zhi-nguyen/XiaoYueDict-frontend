import { NextRequest } from 'next/server';
import { handleProxy } from '@/lib/api/proxy';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export async function GET(request: NextRequest) {
  return handleProxy(request, DJANGO_API_URL, '/api/auth/me', '/api/core/users/profile');
}

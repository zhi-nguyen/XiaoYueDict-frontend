import { NextResponse } from 'next/server';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Call Django API to get tokens via Nginx
    const res = await fetch(`${DJANGO_API_URL}/api/core/users/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text || `HTTP Error ${res.status}: ${res.statusText}` };
    }

    if (res.ok) {
      const response = NextResponse.json({
        access: data.access,
        user: data.user || null // if we return user info with token
      });

      // Set refresh token in HttpOnly cookie
      response.cookies.set({
        name: 'refresh_token',
        value: data.refresh,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 1, // 1 day (match Django settings)
      });

      return response;
    } else {
      console.error(`Backend auth error: Status ${res.status}`, data);
      return NextResponse.json(data, { status: res.status });
    }
  } catch (error) {
    console.error('Login route exception:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    let refreshToken = null;

    if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'refresh_token') {
          refreshToken = value;
          break;
        }
      }
    }

    if (!refreshToken) {
      return NextResponse.json({ message: 'No refresh token provided' }, { status: 401 });
    }

    const res = await fetch(`${DJANGO_API_URL}/api/core/users/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await res.json();

    if (res.ok) {
      const response = NextResponse.json({ access: data.access });
      
      // If backend rotates refresh token and returns a new one
      if (data.refresh) {
        response.cookies.set({
          name: 'refresh_token',
          value: data.refresh,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 1,
        });
      }

      return response;
    } else {
      // Refresh token is invalid or expired
      const response = NextResponse.json({ message: 'Refresh token invalid or expired' }, { status: 401 });
      response.cookies.delete('refresh_token');
      return response;
    }
  } catch (error) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

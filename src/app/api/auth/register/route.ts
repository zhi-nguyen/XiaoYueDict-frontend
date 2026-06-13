import { NextResponse } from 'next/server';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${DJANGO_API_URL}/api/core/users/register/`, {
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
      return NextResponse.json(data);
    } else {
      console.error(`Backend register error: Status ${res.status}`, data);
      return NextResponse.json(data, { status: res.status });
    }
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';

const DJANGO_API_URL = process.env.GATEWAY_URL || 'http://localhost';

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

    const data = await res.json();

    if (res.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json(data, { status: res.status });
    }
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

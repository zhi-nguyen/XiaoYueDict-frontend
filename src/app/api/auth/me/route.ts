import { NextResponse } from 'next/server';

const DJANGO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'No authorization header' }, { status: 401 });
    }

    const res = await fetch(`${DJANGO_API_URL}/api/core/users/profile/`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
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
      console.error(`Backend profile error: Status ${res.status}`, data);
      return NextResponse.json(data, { status: res.status });
    }
  } catch (error) {
    console.error('Me route exception:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}


import { cookies } from 'next/headers';

const DJANGO_API_URL = process.env.GATEWAY_URL || 'http://localhost';

export async function getServerAuthToken(): Promise<string | null> {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch(`${DJANGO_API_URL}/api/core/users/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: 'no-store', // Prevent Next.js from caching the token response
    });

    if (res.ok) {
      const data = await res.json();
      return data.access;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to refresh token on server:', error);
    return null;
  }
}

export async function getServerUser() {
  const token = await getServerAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${DJANGO_API_URL}/api/core/users/profile/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to get user profile on server:', error);
    return null;
  }
}

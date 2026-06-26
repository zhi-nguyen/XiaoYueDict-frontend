import React from 'react';
import { Notebook } from '@/types/note';
import NotesClient from './NotesClient';
import { getServerAuthToken } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    lang: string;
  };
}

export default async function NotesPage({ params }: PageProps) {
  const lang = params?.lang || 'zh';
  let initialNotebooks: Notebook[] = [];
  try {
    const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
    const token = await getServerAuthToken();
    const headers = new Headers({ 'Content-Type': 'application/json' });
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${GATEWAY_URL}/api/core/notes/notebooks/?lang=${lang}`, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (res.ok) {
      initialNotebooks = await res.json();
    }
  } catch (err) {
    console.error('[NotesPage Server] Failed to pre-fetch notebooks:', err);
  }

  return <NotesClient initialNotebooks={initialNotebooks} />;
}

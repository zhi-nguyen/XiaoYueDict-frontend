import React from 'react';
import { fetchNotebooks } from '@/lib/api/notes';
import { Notebook } from '@/types/note';
import NotesClient from './NotesClient';

export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  let initialNotebooks: Notebook[] = [];
  try {
    initialNotebooks = await fetchNotebooks();
  } catch (err) {
    console.error('[NotesPage Server] Failed to pre-fetch notebooks:', err);
  }

  return <NotesClient initialNotebooks={initialNotebooks} />;
}

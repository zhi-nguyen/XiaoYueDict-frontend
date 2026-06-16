"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect from old /profile to /zh/profile (or the user's preferred language).
 * Kept for backward compatibility — new canonical path is /[lang]/profile.
 */
export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/zh/profile');
  }, [router]);

  return null;
}

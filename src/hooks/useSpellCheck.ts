'use client';

import { useState, useCallback } from 'react';

export interface MisspelledWord {
  /** The misspelled word as it appears in the text */
  word: string;
  /** Word index (position) in the split text */
  index: number;
  /** Suggested corrections */
  suggestions: string[];
}

export interface SpellCheckResult {
  is_valid: boolean;
  misspelled: MisspelledWord[];
  clean_text: string;
}

export interface UseSpellCheckReturn {
  /** Trigger spellcheck against the Django backend */
  checkText: (text: string) => Promise<SpellCheckResult | null>;
  /** The latest spellcheck result */
  result: SpellCheckResult | null;
  /** Whether a check is in-flight */
  isChecking: boolean;
  /** Error from the last failed check */
  error: string | null;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook to check English text for spelling errors via the Django spellcheck API.
 *
 * Flow: Next.js /api/assessments/spellcheck/ → Nginx → Django /api/v1/assessments/spellcheck/
 */
export function useSpellCheck(): UseSpellCheckReturn {
  const [result, setResult] = useState<SpellCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setResult(null);
    setIsChecking(false);
    setError(null);
  }, []);

  const checkText = useCallback(async (text: string): Promise<SpellCheckResult | null> => {
    if (!text || !text.trim()) {
      setResult(null);
      return null;
    }

    setIsChecking(true);
    setError(null);

    try {
      const res = await fetch('/api/assessments/spellcheck/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Spellcheck failed' }));
        throw new Error(errBody.error || `Server error (${res.status})`);
      }

      const data: SpellCheckResult = await res.json();
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Spellcheck failed.';
      setError(message);
      console.error('[useSpellCheck] Failed:', err);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { checkText, result, isChecking, error, reset };
}

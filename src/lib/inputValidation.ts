/**
 * Input validation for pronunciation scoring text.
 *
 * Strategy: "Warm welcome on the outside" — validate user input at the
 * Next.js layer BEFORE it reaches the Django/AI backends, so the AI
 * models never see numbers, math symbols, or other alien characters
 * that could freeze inference.
 */

// ─── Regex Patterns ──────────────────────────────────────────────────────────
// English: letters, spaces, and common punctuation (including single quote
// for contractions like "don't", "I'm", "it's")
const ENGLISH_PATTERN = /^[a-zA-Z\s.,?!'":;\-]+$/;

// Chinese: CJK unified ideographs, spaces, and Chinese full-width punctuation
const CHINESE_PATTERN = /^[\u4e00-\u9fa5\s，。？！、：；""''（）《》]+$/;

// ─── Validation Results ──────────────────────────────────────────────────────
export interface TextValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

/**
 * Validate text input for English mode.
 *
 * Allows: Letters (a-z, A-Z), spaces, and basic punctuation
 * including the single quote ' (for contractions).
 *
 * Rejects: Numbers (0-9), special symbols ($, %, @, #, etc.)
 */
export function validateEnglishText(text: string): TextValidationResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isValid: true, errorMessage: null }; // empty is OK (Free Decoding)
  }

  if (!ENGLISH_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        'Please enter English words only. Numbers (0-9) and special symbols ($, %, @) must be spelled out.',
    };
  }

  return { isValid: true, errorMessage: null };
}

/**
 * Validate text input for Chinese mode.
 *
 * Allows: Chinese characters (U+4E00–U+9FA5), spaces, and
 * Chinese full-width punctuation.
 *
 * Rejects: Numbers, Latin letters, and special symbols.
 */
export function validateChineseText(text: string): TextValidationResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isValid: true, errorMessage: null }; // empty is OK (Free Decoding)
  }

  if (!CHINESE_PATTERN.test(trimmed)) {
    return {
      isValid: false,
      errorMessage:
        'Please enter Chinese characters and punctuation only. Numbers or foreign characters are not supported.',
    };
  }

  return { isValid: true, errorMessage: null };
}

/**
 * Validate text based on language mode.
 * Dispatches to the appropriate language-specific validator.
 */
export function validateTextInput(
  text: string,
  language: 'en' | 'zh',
): TextValidationResult {
  return language === 'zh'
    ? validateChineseText(text)
    : validateEnglishText(text);
}

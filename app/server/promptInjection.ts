/**
 * Detects potential prompt injection attacks in user input
 */

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|all)\s+(instructions?|commands?)/i,
  /forget\s+(previous|all)\s+(instructions?|commands?)/i,
  /disregard\s+(previous|all)\s+(instructions?|commands?)/i,
  /override\s+(previous|all)\s+(instructions?|commands?)/i,
  /new\s+(instructions?|commands?)/i,
  /change\s+(instructions?|commands?)/i,
  /system\s*:\s*/i,
  /assistant\s*:\s*/i,
  /user\s*:\s*/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|.*?\|>/i,
  /<<.*?>>/,
  /```.*?```/,
  /act\s+as\s+a/i,
  /pretend\s+to\s+be/i,
  /roleplay\s+as/i,
  /simulate\s+a/i,
  /you\s+are\s+now/i,
  /switch\s+to\s+mode/i,
  /jailbreak/i,
  /bypass\s+(security|restrictions|filters)/i,
  /admin\s+mode/i,
  /developer\s+mode/i,
  /god\s+mode/i,
];

/**
 * Checks if text contains potential prompt injection patterns
 */
export function detectPromptInjection(text: string): boolean {
  if (typeof text !== 'string') {
    return false;
  }

  const lowerText = text.toLowerCase();
  
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitizes text by removing potential prompt injection patterns
 */
export function sanitizePromptInjection(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }

  let sanitized = text;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  return sanitized;
}

/**
 * Validates text for prompt injection and returns whether it's safe
 */
export function isSafeFromPromptInjection(text: string): boolean {
  return !detectPromptInjection(text);
}

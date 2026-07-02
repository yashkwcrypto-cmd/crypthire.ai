import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';

// Rate limiting store (in-memory - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
};

const AUTH_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
};

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig = DEFAULT_RATE_LIMIT) {
  return (request: NextRequest): NextResponse | null => {
    const ip = getClientIP(request);
    const key = `ratelimit:${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null;
    }

    if (record.count >= config.maxRequests) {
      logger.warn('Rate limit exceeded', { ip, key });
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    record.count++;
    return null;
  };
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content security policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  );
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

/**
 * CORS middleware
 */
export function handleCORS(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Validate request origin
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Allow same-origin requests
  if (!origin && (!referer || referer.includes(host || ''))) {
    return true;
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }

  logger.warn('Invalid origin', { origin, referer, host });
  return false;
}

/**
 * Sanitize user agent
 */
export function validateUserAgent(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent');
  
  if (!userAgent) {
    logger.warn('Missing user agent');
    return false;
  }

  // Block common bot user agents (optional)
  const blockedPatterns = ['curl', 'wget', 'python', 'bot', 'spider', 'crawler'];
  const lowerUA = userAgent.toLowerCase();
  
  for (const pattern of blockedPatterns) {
    if (lowerUA.includes(pattern)) {
      logger.warn('Blocked user agent', { userAgent });
      return false;
    }
  }

  return true;
}

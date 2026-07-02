import { NextRequest } from 'next/server';
import { registerRoute, loginRoute } from '@/app/server/routes/auth.routes';
import { rateLimit, addSecurityHeaders, validateOrigin, validateUserAgent } from '@/app/server/middleware/security';

export async function POST(request: NextRequest) {
  // Security checks
  if (!validateOrigin(request)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  if (!validateUserAgent(request)) {
    return new Response('Forbidden', { status: 403 });
  }

  const rateLimitResponse = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5 })(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const clonedRequest = request.clone();
  const body = await clonedRequest.json();
  const { action } = body;

  let response;
  if (action === 'register') {
    response = await registerRoute(request);
  } else if (action === 'login') {
    response = await loginRoute(request);
  } else {
    return new Response('Invalid action. Use "register" or "login"', { status: 400 });
  }

  return addSecurityHeaders(response as any);
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log the incoming request
  console.log(`[Backend Log] ${request.method} ${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

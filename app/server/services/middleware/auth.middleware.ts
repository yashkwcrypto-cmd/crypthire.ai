import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../constants';
import { ResponseHelper } from '../../response';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function authenticate(request: NextRequest): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return { user: decoded };
  } catch (error: any) {
    console.error('JWT Verification failed:', error);
    return { error: `JWT Verification failed: ${error.message}` };
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const { user, error } = await authenticate(request);
    
    if (!user) {
      return ResponseHelper.unauthorized(error);
    }

    return handler(request, user);
  };
}

export function requireRole(roles: string[]) {
  return function(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
    return async (request: NextRequest): Promise<Response> => {
      const { user, error } = await authenticate(request);
      
      if (!user) {
        return ResponseHelper.unauthorized(error);
      }

      if (!roles.includes(user.role)) {
        return ResponseHelper.forbidden('Insufficient permissions');
      }

      return handler(request, user);
    };
  };
}

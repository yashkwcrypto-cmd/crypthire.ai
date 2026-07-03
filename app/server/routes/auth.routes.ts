import { NextRequest } from 'next/server';
import { register, login } from '../controllers/auth.controller';
import { registerSchema, loginSchema } from '../services/validation/auth.schema';
import { ResponseHelper } from '@/app/server/response';

export async function registerRoute(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, value } = registerSchema.validate(body, { stripUnknown: true });
    if (error) {
      return ResponseHelper.badRequest(error.details[0].message);
    }

    const result = await register(value);
    return ResponseHelper.created(result, 'User registered successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return ResponseHelper.error(message);
  }
}

export async function loginRoute(request: NextRequest) {
  try {
    const body = await request.json();
    const { error, value } = loginSchema.validate(body, { stripUnknown: true });
    if (error) {
      return ResponseHelper.badRequest(error.details[0].message);
    }

    const result = await login(value);
    return ResponseHelper.success(result, 'Login successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return ResponseHelper.error(message);
  }
}
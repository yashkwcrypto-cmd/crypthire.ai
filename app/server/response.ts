import { NextResponse } from 'next/server';
import { StatusCode } from './statusCode';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ResponseHelper {
  static success<T>(data: T, message?: string, status: StatusCode = StatusCode.OK): NextResponse {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      },
      { status }
    );
  }

  static error(error: string, status: StatusCode = StatusCode.INTERNAL_SERVER_ERROR): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error,
      },
      { status }
    );
  }

  static created<T>(data: T, message?: string): NextResponse {
    return this.success(data, message, StatusCode.CREATED);
  }

  static badRequest(error: string): NextResponse {
    return this.error(error, StatusCode.BAD_REQUEST);
  }

  static unauthorized(error: string = 'Unauthorized'): NextResponse {
    return this.error(error, StatusCode.UNAUTHORIZED);
  }

  static forbidden(error: string = 'Forbidden'): NextResponse {
    return this.error(error, StatusCode.FORBIDDEN);
  }

  static notFound(error: string = 'Not found'): NextResponse {
    return this.error(error, StatusCode.NOT_FOUND);
  }

  static conflict(error: string): NextResponse {
    return this.error(error, StatusCode.CONFLICT);
  }
}

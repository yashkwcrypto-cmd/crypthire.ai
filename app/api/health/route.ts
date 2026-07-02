import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/app/server/response';
import { getConnection } from '@/app/server/db/connection';
import { StatusCode } from '@/app/server/statusCode';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await getConnection();

    return ResponseHelper.success(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
      'Service is healthy'
    );
  } catch (error) {
    return ResponseHelper.error(
      'Service unhealthy',
      StatusCode.SERVICE_UNAVAILABLE as any
    );
  }
}

import { NextRequest } from 'next/server';
import { getCandidates } from '@/app/server/controllers/admin.controller';
import { generateSummaryReport, generateCSVReport } from '@/app/server/reportGenerator';
import { ResponseHelper } from '@/app/server/response';
import { authenticate } from '@/app/server/services/middleware/auth.middleware';
import { USER_ROLES } from '@/app/server/constants';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  
  if (!user || (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.RECRUITER)) {
    return ResponseHelper.unauthorized();
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const candidates = await getCandidates();

    if (format === 'csv') {
      const csv = generateCSVReport(candidates);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="candidates-report.csv"',
        },
      });
    }

    const summary = generateSummaryReport(candidates);
    return ResponseHelper.success(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate report';
    return ResponseHelper.error(message);
  }
}

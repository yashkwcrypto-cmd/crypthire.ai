import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/app/server/services/middleware/auth.middleware';
import { USER_ROLES } from '@/app/server/constants';
import { generateAndSendDailyReport } from '@/app/server/services/report.service';

export const maxDuration = 300;

export const POST = requireRole([USER_ROLES.ADMIN])(
  async (request: NextRequest) => {
    try {
      const result = await generateAndSendDailyReport();

      if (result.success) {
        return NextResponse.json({ success: true, message: result.message });
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 500 });
      }
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }
);

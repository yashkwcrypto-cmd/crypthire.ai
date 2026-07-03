import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/app/server/logger';
import { generateAndSendDailyReport } from '@/app/server/services/report.service';

export const maxDuration = 300; // Allow 5 minutes for cron execution

export async function GET(request: NextRequest) {
  try {
    // Verify Authentication (Cron Secret)
    const authHeader = request.headers.get('authorization');
    const urlToken = request.nextUrl.searchParams.get('token');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}` && urlToken !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Daily Cron Report Triggered via URL');

    const result = await generateAndSendDailyReport();

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    logger.error('Daily cron route failed', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


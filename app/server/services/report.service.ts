import { candidateQueries } from '@/app/server/db/queries';
import { triggerAnalysis } from '@/app/server/controllers/admin.controller';
import { generateDailyReport } from '@/app/server/pdfGenerator';
import { generateCSVReport } from '@/app/server/reportGenerator';
import { sendDailyReportEmail } from '@/app/server/mailer';
import { logger } from '@/app/server/logger';

export async function generateAndSendDailyReport(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    logger.info('Starting Daily Report Generation Process...');

    // 1. Fetch today's candidates
    const allCandidates = await candidateQueries.getAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCandidates = allCandidates.filter(c => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= today;
    });

    logger.info(`Found ${todayCandidates.length} candidates submitted today.`);

    // 2. Ensure all candidates are analyzed
    for (let i = 0; i < todayCandidates.length; i++) {
      const candidate = todayCandidates[i];
      if (!candidate.analysisResult) {
        logger.info(`Candidate ${candidate.id} missing analysis. Triggering...`);
        try {
          await triggerAnalysis(candidate.id);
          // Refetch candidate after analysis
          const updatedCandidate = await candidateQueries.findById(candidate.id);
          if (updatedCandidate) {
            todayCandidates[i] = updatedCandidate;
          }
        } catch (err) {
          logger.error(`Failed to analyze candidate ${candidate.id}`, err);
        }
      }
    }

    // 3. Generate PDF and CSV Reports
    const dateString = new Date().toLocaleDateString();
    const pdfBuffer = await generateDailyReport(todayCandidates, dateString);
    const csvString = generateCSVReport(todayCandidates);

    // 4. Email Reports to HR
    const hrEmail = process.env.HR_EMAIL || 'yashkw.crypto@gmail.com';
    const emailSent = await sendDailyReportEmail(hrEmail, pdfBuffer, dateString, csvString);

    if (emailSent) {
      logger.info('Daily reports emailed to HR successfully.');
      return { success: true, message: 'Daily report sent successfully to ' + hrEmail };
    } else {
      logger.error('Failed to send daily report email.');
      return { success: false, error: 'Failed to send email.' };
    }
  } catch (error: any) {
    logger.error('Daily report task failed', error);
    return { success: false, error: error.message };
  }
}


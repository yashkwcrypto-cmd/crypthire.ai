import { analysisJobQueries, candidateQueries } from '../database/db';
import { ANALYSIS_JOB_STATUS, CANDIDATE_STATUS } from '../../constants';
import { triggerAnalysis } from '../../controllers/admin.controller';
import { logger } from '../../logger';

let isRunning = false;

/**
 * Processes pending analysis jobs
 * This would typically run as a cron job
 */
export async function processPendingAnalysisJobs() {
  if (isRunning) {
    logger.info('Analysis job processor already running');
    return;
  }

  isRunning = true;

  try {
    logger.info('Processing pending analysis jobs');

    const pendingJobs = await analysisJobQueries.getPendingJobs();

    for (const job of pendingJobs) {
      try {
        logger.info('Processing analysis job', { jobId: job.id, candidateId: job.candidateId });

        await triggerAnalysis(job.candidateId);

        logger.info('Analysis job processed successfully', { jobId: job.id });
      } catch (error) {
        logger.error('Failed to process analysis job', { jobId: job.id, error });
      }
    }

    logger.info('Pending analysis jobs processing completed');
  } catch (error) {
    logger.error('Error processing pending analysis jobs', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Sends notifications for candidates who have been in a status for too long
 * This would typically run as a daily cron job
 */
export async function sendStatusNotifications() {
  try {
    logger.info('Checking for status notifications');

    const candidates = await candidateQueries.getAll();
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    for (const candidate of candidates) {
      // Notify about candidates pending for more than 3 days
      if (
        candidate.status === CANDIDATE_STATUS.PENDING &&
        new Date(candidate.createdAt) < threeDaysAgo
      ) {
        logger.info('Candidate pending for more than 3 days', {
          candidateId: candidate.id,
          email: candidate.email,
        });
        // In production, send notification to admin
      }

      // Notify about candidates in reviewing for more than 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (
        candidate.status === CANDIDATE_STATUS.REVIEWING &&
        new Date(candidate.updatedAt) < sevenDaysAgo
      ) {
        logger.info('Candidate in reviewing for more than 7 days', {
          candidateId: candidate.id,
          email: candidate.email,
        });
        // In production, send notification to admin
      }
    }

    logger.info('Status notifications check completed');
  } catch (error) {
    logger.error('Error sending status notifications', error);
  }
}

/**
 * Starts the scheduler
 * In production, this would use a proper cron library like node-cron
 */
export function startScheduler() {
  logger.info('Starting scheduler');

  // Process analysis jobs every 5 minutes
  setInterval(processPendingAnalysisJobs, 5 * 60 * 1000);

  // Check for status notifications every day
  setInterval(sendStatusNotifications, 24 * 60 * 60 * 1000);

  // Run initial checks
  processPendingAnalysisJobs();
  sendStatusNotifications();
}

/**
 * Stops the scheduler
 */
export function stopScheduler() {
  logger.info('Stopping scheduler');
  // In production, clear intervals
}

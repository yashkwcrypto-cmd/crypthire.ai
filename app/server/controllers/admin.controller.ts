import { candidateQueries, analysisJobQueries } from '../services/database/db';
import { ANALYSIS_JOB_STATUS, CANDIDATE_STATUS } from '../constants';
import { logger } from '../logger';
import { aiPipeline } from '../aiPipeline';
import fs from 'fs/promises';

export async function triggerAnalysis(candidateId: string) {
  try {
    const candidate = await candidateQueries.findById(candidateId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const job = await analysisJobQueries.create({
      candidateId,
      status: ANALYSIS_JOB_STATUS.PROCESSING,
      result: undefined,
      error: undefined,
    });

    logger.info('Analysis job created', { jobId: job.id, candidateId });

    try {
      const resumeText = await getResumeText(candidate.resumeUrl);
      const result = await aiPipeline.execute(Buffer.from(resumeText));

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Pipeline execution failed');
      }

      await candidateQueries.updateAnalysisResult(
        candidateId,
        JSON.stringify(result.data.analysis)
      );

      await analysisJobQueries.updateStatus(
        job.id,
        ANALYSIS_JOB_STATUS.COMPLETED,
        JSON.stringify(result.data.analysis)
      );

      logger.info('Analysis completed successfully', { 
        jobId: job.id, 
        candidateId,
        processingTime: result.data.metadata.processingTime 
      });

      return {
        jobId: job.id,
        candidateId,
        status: ANALYSIS_JOB_STATUS.COMPLETED,
        result: result.data.analysis,
        metadata: result.data.metadata,
      };
    } catch (analysisError) {
      await analysisJobQueries.updateStatus(
        job.id,
        ANALYSIS_JOB_STATUS.FAILED,
        undefined,
        analysisError instanceof Error ? analysisError.message : 'Analysis failed'
      );

      logger.error('Analysis failed', { jobId: job.id, error: analysisError });
      throw analysisError;
    }
  } catch (error) {
    logger.error('Failed to trigger analysis', error);
    throw error;
  }
}

/**
 * Reads resume PDF from local disk and extracts text
 */
async function getResumeText(resumeUrl: string): Promise<string> {
  try {
    const path = require('path');
    const fs = require('fs').promises;
    const pdf = require('pdf-parse');

    // Remove leading slash to make it a relative path in public folder
    const relativePath = resumeUrl.startsWith('/') ? resumeUrl.slice(1) : resumeUrl;
    const filePath = path.join(process.cwd(), 'public', relativePath);
    
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    
    return data.text;
  } catch (error) {
    logger.error('Failed to extract resume text', error);
    throw new Error('Could not parse resume file');
  }
}

export async function getCandidates() {
  try {
    const candidates = await candidateQueries.getAll();
    return candidates;
  } catch (error) {
    logger.error('Failed to get candidates', error);
    throw error;
  }
}

export async function getCandidate(id: string) {
  try {
    const candidate = await candidateQueries.findById(id);
    if (!candidate) {
      throw new Error('Candidate not found');
    }
    return candidate;
  } catch (error) {
    logger.error('Failed to get candidate', error);
    throw error;
  }
}

export async function updateCandidateStatus(id: string, status: string) {
  try {
    const candidate = await candidateQueries.updateStatus(id, status);
    if (!candidate) {
      throw new Error('Candidate not found');
    }
    logger.info('Candidate status updated', { candidateId: id, status });
    return candidate;
  } catch (error) {
    logger.error('Failed to update candidate status', error);
    throw error;
  }
}

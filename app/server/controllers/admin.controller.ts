import { candidateQueries, analysisJobQueries } from '../services/database/db';
import { ANALYSIS_JOB_STATUS, CANDIDATE_STATUS } from '../constants';
import { logger } from '../logger';
import { aiPipeline } from '../aiPipeline';
import fs from 'fs/promises';

export async function triggerAnalysis(candidateId: string, jobDescription?: string) {
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
      const resumeBuffer = await getResumeBuffer(candidate.resumeUrl);
      const result = await aiPipeline.execute(resumeBuffer, jobDescription, candidate.linkedinUrl || undefined, candidate.portfolioUrl || undefined);

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

async function getResumeBuffer(resumeUrl: string): Promise<Buffer> {
  try {
    const path = require('path');
    const fs = require('fs').promises;

    // Remove leading slash to make it a relative path in public folder
    const relativePath = resumeUrl.startsWith('/') ? resumeUrl.slice(1) : resumeUrl;
    const filePath = path.join(process.cwd(), 'public', relativePath);
    
    return await fs.readFile(filePath);
  } catch (error) {
    logger.error('Failed to read resume file', error);
    throw new Error('Could not read resume file');
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

export async function updateCandidateDetails(id: string, data: { fullName?: string; email?: string; phone?: string | null; linkedinUrl?: string | null; portfolioUrl?: string | null; }) {
  try {
    const candidate = await candidateQueries.update(id, data);
    if (!candidate) {
      throw new Error('Candidate not found');
    }
    logger.info('Candidate details updated', { candidateId: id });
    return candidate;
  } catch (error) {
    logger.error('Failed to update candidate details', error);
    throw error;
  }
}

export async function deleteCandidate(id: string) {
  try {
    const candidate = await candidateQueries.findById(id);
    if (!candidate) {
      throw new Error('Candidate not found');
    }
    await candidateQueries.delete(id);
    logger.info('Candidate deleted', { candidateId: id });
    return true;
  } catch (error) {
    logger.error('Failed to delete candidate', error);
    throw error;
  }
}

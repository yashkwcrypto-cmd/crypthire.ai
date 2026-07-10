import { candidateQueries, analysisJobQueries } from '../services/database/db';
import { ANALYSIS_JOB_STATUS, CANDIDATE_STATUS } from '../constants';
import { logger } from '../logger';
import { aiPipeline } from '../aiPipeline';
import fs from 'fs/promises';
import path from 'path';

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

      // Update candidate with extracted name and email if they are currently anonymous
      const analysis = result.data.analysis;
      if ((candidate.fullName === 'Anonymous' || !candidate.fullName) && analysis.extractedName) {
        await candidateQueries.update(candidateId, { fullName: analysis.extractedName });
        logger.info('Updated candidate name from AI analysis', { candidateId, extractedName: analysis.extractedName });
      }
      
      const isDummyEmail = !candidate.email || candidate.email === 'anonymous@no-email.com' || candidate.email.startsWith('anonymous_');
      if (isDummyEmail && analysis.extractedEmail && analysis.extractedEmail.includes('@')) {
        await candidateQueries.update(candidateId, { email: analysis.extractedEmail });
        logger.info('Updated candidate email from AI analysis', { candidateId, extractedEmail: analysis.extractedEmail });
      }

      if (!candidate.phone && analysis.extractedPhone) {
        await candidateQueries.update(candidateId, { phone: analysis.extractedPhone });
        logger.info('Updated candidate phone from AI analysis', { candidateId, extractedPhone: analysis.extractedPhone });
      }

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
    if (!resumeUrl) {
      throw new Error('No resume URL provided');
    }

    const relativePath = resumeUrl.startsWith('/') ? resumeUrl.slice(1) : resumeUrl;

    // Candidate local paths to try (ordered)
    const candidates = [
      path.join(process.cwd(), 'public', relativePath),
      path.join(process.cwd(), relativePath),
      path.join(process.cwd(), 'public', 'uploads', 'resumes', path.basename(relativePath)),
      path.join(process.cwd(), 'uploads', 'resumes', path.basename(relativePath)),
      path.join(process.cwd(), 'public', 'uploads', path.basename(relativePath)),
      path.join(process.cwd(), 'uploads', path.basename(relativePath)),
    ];

    for (const filePath of candidates) {
      try {
        await fs.access(filePath);
        logger.info('Found resume file', { filePath });
        return await fs.readFile(filePath);
      } catch {
        // not found, try next
      }
    }

    // If resumeUrl is an HTTP(S) URL, attempt to fetch it
    if (/^https?:\/\//i.test(resumeUrl)) {
      try {
        const resp = await fetch(resumeUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          logger.info('Fetched resume from remote URL', { resumeUrl });
          return Buffer.from(arrayBuffer);
        }
        logger.warn('Failed to fetch resume from URL', { resumeUrl, status: resp.status });
      } catch (err) {
        logger.warn('Error fetching resume URL', { resumeUrl, error: err });
      }
    }

    logger.warn('Resume file not found in any expected location', { resumeUrl, tried: candidates });
    // As a last resort, search the repository for the file by basename
    const basename = path.basename(relativePath);

    async function searchForFile(dir: string, target: string, depth = 0, maxDepth = 6): Promise<string | null> {
      if (depth > maxDepth) return null;
      let entries: string[];
      try {
        entries = await fs.readdir(dir);
      } catch {
        return null;
      }

      for (const entry of entries) {
        const full = path.join(dir, entry);
        try {
          const st = await fs.stat(full);
          if (st.isFile() && entry === target) return full;
        } catch {
          continue;
        }
      }

      for (const entry of entries) {
        const full = path.join(dir, entry);
        try {
          const st = await fs.stat(full);
          if (st.isDirectory()) {
            const found = await searchForFile(full, target, depth + 1, maxDepth);
            if (found) return found;
          }
        } catch {
          continue;
        }
      }
      return null;
    }

    const repoRoot = process.cwd();
    const found = await searchForFile(repoRoot, basename, 0, 6);
    if (found) {
      logger.warn('Located resume by searching workspace', { found });
      return await fs.readFile(found);
    }

    throw new Error(`Resume file not found: ${resumeUrl}`);
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

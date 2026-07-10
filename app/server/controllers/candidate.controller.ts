import { candidateQueries } from '../services/database/db';
import { CANDIDATE_STATUS } from '../constants';
import { logger } from '../logger';
import { CandidateSubmissionPayload } from '../types';

export async function submitCandidate(payload: CandidateSubmissionPayload) {
  try {
    const { fullName, email, phone, resumeUrl } = payload;

    // Check if candidate with same email already exists (only if email is provided)
    if (email && email.trim()) {
      const existingCandidate = await candidateQueries.getAll();
      const duplicate = existingCandidate.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
      
      if (duplicate) {
        throw new Error('A candidate with this email has already submitted');
      }
    }

    // Create candidate
    const candidate = await candidateQueries.create({
      fullName: fullName || 'Anonymous',
      email: email || 'anonymous@no-email.com',
      phone: phone || null,
      linkedinUrl: payload.linkedinUrl || null,
      portfolioUrl: payload.portfolioUrl || null,
      resumeUrl,
      status: CANDIDATE_STATUS.PENDING,
      analysisResult: null,
      notes: null,
    });

    logger.info('Candidate submitted successfully', { candidateId: candidate.id, email });

    return {
      id: candidate.id,
      fullName: candidate.fullName,
      email: candidate.email,
      status: candidate.status,
      submittedAt: candidate.createdAt,
    };
  } catch (error) {
    logger.error('Candidate submission failed', error);
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

export async function getAllCandidates() {
  try {
    const candidates = await candidateQueries.getAll();
    return candidates;
  } catch (error) {
    logger.error('Failed to get candidates', error);
    throw error;
  }
}

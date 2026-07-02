import { Candidate } from '@/app/server/types';
import { logger } from '@/app/server/logger';

export interface CandidateReport {
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    submittedAt: Date;
  };
  analysis?: {
    score: number;
    skills: string[];
    experience: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  };
  status: string;
}

/**
 * Generates a comprehensive report for a candidate
 */
export function generateCandidateReport(candidate: Candidate): CandidateReport {
  const report: CandidateReport = {
    candidate: {
      id: candidate.id,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone || undefined,
      submittedAt: candidate.createdAt,
    },
    status: candidate.status,
  };

  // Parse analysis result if available
  if (candidate.analysisResult) {
    try {
      const analysis = JSON.parse(candidate.analysisResult);
      report.analysis = analysis;
    } catch (error) {
      logger.error('Failed to parse analysis result', { candidateId: candidate.id });
    }
  }

  return report;
}

/**
 * Generates a summary report for all candidates
 */
export function generateSummaryReport(candidates: Candidate[]): {
  total: number;
  byStatus: Record<string, number>;
  averageScore: number;
  topCandidates: CandidateReport[];
} {
  const byStatus: Record<string, number> = {};
  let totalScore = 0;
  let scoredCount = 0;
  const scoredCandidates: CandidateReport[] = [];

  candidates.forEach(candidate => {
    // Count by status
    byStatus[candidate.status] = (byStatus[candidate.status] || 0) + 1;

    // Calculate average score
    if (candidate.analysisResult) {
      try {
        const analysis = JSON.parse(candidate.analysisResult);
        if (analysis.score) {
          totalScore += analysis.score;
          scoredCount++;
          
          const report = generateCandidateReport(candidate);
          if (report.analysis) {
            scoredCandidates.push(report);
          }
        }
      } catch (error) {
        logger.error('Failed to parse analysis for summary', { candidateId: candidate.id });
      }
    }
  });

  // Sort scored candidates by score (descending)
  scoredCandidates.sort((a, b) => {
    const scoreA = a.analysis?.score || 0;
    const scoreB = b.analysis?.score || 0;
    return scoreB - scoreA;
  });

  const averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

  return {
    total: candidates.length,
    byStatus,
    averageScore,
    topCandidates: scoredCandidates.slice(0, 10), // Top 10 candidates
  };
}

/**
 * Generates a CSV report for candidates
 */
export function generateCSVReport(candidates: Candidate[]): string {
  const headers = [
    'ID',
    'Full Name',
    'Email',
    'Phone',
    'Status',
    'Submitted At',
    'Score',
    'Skills',
    'Experience',
    'Recommendation',
  ];

  const rows = candidates.map(candidate => {
    let score = '';
    let skills = '';
    let experience = '';
    let recommendation = '';

    if (candidate.analysisResult) {
      try {
        const analysis = JSON.parse(candidate.analysisResult);
        score = analysis.score?.toString() || '';
        skills = analysis.skills?.join(', ') || '';
        experience = analysis.experience || '';
        recommendation = analysis.recommendation || '';
      } catch (error) {
        // Ignore parsing errors
      }
    }

    return [
      candidate.id,
      candidate.fullName,
      candidate.email,
      candidate.phone || '',
      candidate.status,
      candidate.createdAt.toISOString(),
      score,
      skills,
      experience,
      recommendation,
    ].map(field => `"${field}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

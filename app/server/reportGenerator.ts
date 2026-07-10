import { Candidate } from '@/app/server/types';
import { logger } from '@/app/server/logger';
import ExcelJS from 'exceljs';

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
 * Generates an Excel report for candidates
 */
export async function generateExcelReport(candidates: Candidate[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Candidates Report');

  const headers = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Full Name', key: 'fullName', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Location', key: 'location', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Submitted At', key: 'submittedAt', width: 22 },
    { header: 'Score', key: 'score', width: 10 },
    { header: 'Current Role', key: 'currentRole', width: 20 },
    { header: 'Current Company', key: 'currentCompany', width: 20 },
    { header: 'Previous Companies', key: 'previousCompanies', width: 30 },
    { header: 'Skills', key: 'skills', width: 40 },
    { header: 'Experience', key: 'experience', width: 35 },
    { header: 'Recommendation', key: 'recommendation', width: 45 },
    { header: 'Recommended Role', key: 'recommendedRole', width: 25 }
  ];

  worksheet.columns = headers;

  candidates.forEach(candidate => {
    let score = '';
    let skills = '';
    let experience = '';
    let recommendation = '';
    let location = '';
    let currentRole = '';
    let currentCompany = '';
    let previousCompanies = '';
    let recommendedRole = '';

    if (candidate.analysisResult) {
      try {
        const analysis = JSON.parse(candidate.analysisResult);
        score = analysis.score?.toString() || '';
        skills = analysis.skills?.join(', ') || '';
        experience = analysis.experience || '';
        recommendation = analysis.recommendation || '';
        location = analysis.location || '';
        currentRole = analysis.currentRole || '';
        currentCompany = analysis.currentCompany || '';
        previousCompanies = analysis.previousCompanies?.join(', ') || '';
        recommendedRole = analysis.recommendedJd || '';
      } catch (error) {
        // Ignore parsing errors
      }
    }

    worksheet.addRow({
      id: candidate.id,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone || '',
      location,
      status: candidate.status,
      submittedAt: candidate.createdAt.toISOString(),
      score,
      currentRole,
      currentCompany,
      previousCompanies,
      skills,
      experience,
      recommendation,
      recommendedRole
    });
  });

  worksheet.getRow(1).font = { bold: true };
  
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'top', wrapText: true };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
}


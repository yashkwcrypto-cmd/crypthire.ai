export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobDescription {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  resumeUrl: string;
  status: string;
  analysisResult: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisJob {
  id: string;
  candidateId: string;
  status: string;
  result?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface CandidateSubmissionPayload {
  fullName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl: string;
}

export interface AnalysisResult {
  score: number;
  currentRole?: string;
  currentCompany?: string;
  previousCompanies?: string[];
  location?: string;
  experience: string;
  skills: string[];
  education: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  issues: string[];
  requirementsMatch: string;
  recommendation: string;
  recommendedJd?: string;
}

export interface DbRecord {
  [key: string]: any;
}

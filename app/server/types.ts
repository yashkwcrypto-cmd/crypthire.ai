export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl: string;
  status: string;
  analysisResult?: string;
  notes?: string;
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
  resumeUrl: string;
}

export interface AnalysisResult {
  score: number;
  skills: string[];
  experience: string;
  education: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export interface DbRecord {
  [key: string]: any;
}

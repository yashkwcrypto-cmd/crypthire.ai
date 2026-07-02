export const USER_ROLES = {
  ADMIN: 'admin',
  RECRUITER: 'recruiter',
} as const;

export const CANDIDATE_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  INTERVIEWED: 'interviewed',
  HIRED: 'hired',
  REJECTED: 'rejected',
} as const;

export const ANALYSIS_JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['application/pdf'];

export const DB_CONFIG = {
  server: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'CryptHire',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
  },
};

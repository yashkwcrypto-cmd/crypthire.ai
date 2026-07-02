import pdf from 'pdf-parse';
import { logger } from '@/app/server/logger';

export interface ParsedResume {
  text: string;
  metadata?: {
    pages?: number;
    info?: any;
  };
}

/**
 * Parses PDF resume and extracts text content
 */
export async function parseResume(buffer: Buffer): Promise<ParsedResume> {
  try {
    const data = await pdf(buffer);
    
    logger.info('Resume parsed successfully', {
      pages: data.numpages,
      textLength: data.text.length,
    });

    return {
      text: data.text,
      metadata: {
        pages: data.numpages,
        info: data.info,
      },
    };
  } catch (error) {
    logger.error('Failed to parse resume', error);
    throw new Error('Failed to parse resume file');
  }
}

/**
 * Extracts key information from resume text
 * This is a simple extraction - in production, use more sophisticated NLP
 */
export function extractResumeInfo(text: string): {
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: string;
} {
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const phoneRegex = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/;
  
  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);

  // Simple skill extraction (looks for common tech keywords)
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
    'node', 'express', 'sql', 'mongodb', 'postgresql', 'aws', 'docker',
    'kubernetes', 'git', 'agile', 'scrum', 'rest', 'graphql', 'api',
  ];
  
  const lowerText = text.toLowerCase();
  const foundSkills = commonSkills.filter(skill => lowerText.includes(skill));

  return {
    email: emailMatch?.[0],
    phone: phoneMatch?.[0],
    skills: foundSkills.length > 0 ? foundSkills : undefined,
    experience: text.substring(0, 500), // First 500 chars as preview
  };
}

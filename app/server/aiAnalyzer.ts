import { AnalysisResult } from '@/app/server/types';
import { logger } from '@/app/server/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Analyzes resume text and generates AI-powered insights using Google Gemini
 */
export async function analyzeResume(resumeText: string): Promise<AnalysisResult> {
  try {
    logger.info('Starting AI resume analysis via Gemini');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an expert technical recruiter and AI resume analyzer.
      Analyze the following resume text and extract structured information.
      Return ONLY a valid JSON object strictly matching this schema, with no markdown formatting or extra text:

      {
        "score": number (0-100 overall assessment score),
        "skills": [string] (array of extracted technical and soft skills),
        "experience": string (e.g. "5+ years", "1-3 years", based on the text),
        "education": string (brief summary of education),
        "summary": string (1-2 sentences summarizing the candidate),
        "strengths": [string] (top 3 strengths),
        "weaknesses": [string] (any identified weaknesses or missing common skills),
        "recommendation": string (e.g. "Strong candidate - recommend for interview")
      }

      RESUME TEXT:
      ${resumeText}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting (e.g. ```json ... ```)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysis: AnalysisResult = JSON.parse(text);

    logger.info('Resume analysis completed', { score: analysis.score });
    
    return analysis;
  } catch (error) {
    logger.error('Resume analysis failed', error);
    throw new Error('Failed to analyze resume');
  }
}

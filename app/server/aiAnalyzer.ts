import { AnalysisResult } from '@/app/server/types';
import { logger } from '@/app/server/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT = `
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
`;

async function callDeepSeek(text: string, apiKey: string): Promise<string> {
  logger.info('Trying DeepSeek API...');
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: PROMPT + text }],
      temperature: 0.2
    })
  });
  
  if (!response.ok) throw new Error(`DeepSeek API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callNvidiaNim(text: string, apiKey: string): Promise<string> {
  logger.info('Trying NVIDIA NIM API...');
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: PROMPT + text }],
      temperature: 0.2
    })
  });
  
  if (!response.ok) throw new Error(`NVIDIA NIM API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(text: string, apiKey: string): Promise<string> {
  logger.info('Trying Google Gemini API...');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(PROMPT + text);
  const response = await result.response;
  return response.text();
}

/**
 * Analyzes resume text and generates AI-powered insights using a fallback chain of providers.
 */
export async function analyzeResume(resumeText: string): Promise<AnalysisResult> {
  try {
    let rawResult = '';

    if (process.env.DEEPSEEK_API_KEY) {
      try {
        rawResult = await callDeepSeek(resumeText, process.env.DEEPSEEK_API_KEY);
      } catch (e: any) {
        logger.warn(`DeepSeek failed: ${e.message}`);
      }
    }

    if (!rawResult && process.env.NVIDIA_NIM_API_KEY) {
      try {
        rawResult = await callNvidiaNim(resumeText, process.env.NVIDIA_NIM_API_KEY);
      } catch (e: any) {
        logger.warn(`NVIDIA NIM failed: ${e.message}`);
      }
    }

    if (!rawResult && process.env.GEMINI_API_KEY) {
      try {
        rawResult = await callGemini(resumeText, process.env.GEMINI_API_KEY);
      } catch (e: any) {
        logger.warn(`Gemini failed: ${e.message}`);
      }
    }

    if (!rawResult) {
      throw new Error('All AI providers failed or no valid API keys found.');
    }

    // Clean up potential markdown formatting (e.g. ```json ... ```)
    let cleanedText = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysis: AnalysisResult = JSON.parse(cleanedText);
    logger.info('Resume analysis completed', { score: analysis.score });
    
    return analysis;
  } catch (error) {
    logger.error('Resume analysis failed', error);
    throw new Error('Failed to analyze resume');
  }
}

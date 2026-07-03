import { AnalysisResult } from '@/app/server/types';
import { logger } from '@/app/server/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

const generatePrompt = (text: string, jobDescription?: string, linkedinUrl?: string, portfolioUrl?: string) => `
You are a brutally honest, highly critical expert technical recruiter and AI resume analyzer. Your job is to strictly evaluate candidates. Do NOT sugarcoat your feedback. You must be objective and highlight any missing skills, lack of experience, or red flags.

Analyze the following candidate profile (including resume text, and optionally LinkedIn/Portfolio URLs) and extract structured information.

${jobDescription ? `\nCRITICAL INSTRUCTION: You have been provided with one or more Job Descriptions. 
If multiple Job Descriptions are provided, DO NOT merge their requirements together. Instead, FIRST review the candidate's resume, THEN select the SINGLE BEST Job Description that the candidate fits. 
Once you have selected the best Job Description (or if only one was provided), you must STRICTLY evaluate the candidate ONLY against that specific Job Description. 
If the candidate lacks essential requirements for that JD (e.g. required years of experience, specific languages/frameworks), you MUST lower the score significantly and highlight this prominently in the weaknesses and issues. Do not give high scores just because they have a good resume if it doesn't match the selected JD.
\nJob Description(s):\n"""\n${jobDescription}\n"""\n` : ''}

${linkedinUrl ? `\nLinkedIn Profile URL (Optional but useful for context): ${linkedinUrl}` : ''}
${portfolioUrl ? `\nPortfolio/Website URL (Optional but useful for context): ${portfolioUrl}` : ''}

Return ONLY a valid JSON object strictly matching this schema, with no markdown formatting or extra text:

{
  "score": number (0-100 overall assessment score. Be brutally strict based on JD match. A typical candidate should score 40-70. Only perfect fits should get >80.),
  "currentRole": string (candidate's current or most recent job title),
  "currentCompany": string (candidate's current or most recent company),
  "previousCompanies": [string] (array of previous company names),
  "location": string (candidate's address, city, or country),
  "experience": string (e.g. "5+ years", "1-3 years", based on the text),
  "skills": [string] (array of extracted technical and soft skills),
  "education": string (brief summary of highest education, degrees, and institutions),
  "summary": string (1-2 sentences summarizing the candidate objectively),
  "strengths": [string] (top 3-5 plus points - be highly specific about why they are a strong fit),
  "weaknesses": [string] (top 3-5 minus points - explicitly list missing skills, missing experience, or areas they fall short of the JD. Be brutally honest here),
  "issues": [string] (any red flags, employment gaps, job hopping, or candidate issues),
  "requirementsMatch": string (detailed explanation of how well they match the JD. If they don't meet core requirements, clearly say they fail to meet the bar),
  "recommendation": string (e.g. "Strong candidate - recommend for interview", "Reject - lacks required skills, experience, or fit"),
  "recommendedJd": string (If no JD was provided, suggest the best Job Description title for this candidate based on their skills)
}

RESUME TEXT:
${text}
`;

async function callDeepSeek(text: string, apiKey: string, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  logger.info('Trying DeepSeek API...');
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: generatePrompt(text, jd, linkedinUrl, portfolioUrl) }],
      temperature: 0.2
    })
  });
  
  if (!response.ok) throw new Error(`DeepSeek API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callNvidiaNim(text: string, apiKey: string, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  logger.info('Trying NVIDIA NIM API...');
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: generatePrompt(text, jd, linkedinUrl, portfolioUrl) }],
      temperature: 0.2
    })
  });
  
  if (!response.ok) throw new Error(`NVIDIA NIM API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenRouter(text: string, apiKey: string, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  logger.info('Trying OpenRouter API...');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'CryptHire AI',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-70b-instruct', // A strong, widely available model on OpenRouter
      messages: [{ role: 'user', content: generatePrompt(text, jd, linkedinUrl, portfolioUrl) }],
      temperature: 0.2
    })
  });
  
  if (!response.ok) throw new Error(`OpenRouter API error: ${response.statusText}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(text: string, apiKey: string, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  logger.info('Trying Google Gemini API...');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(generatePrompt(text, jd, linkedinUrl, portfolioUrl));
  const response = await result.response;
  return response.text();
}

/**
 * Analyzes resume text and generates AI-powered insights using a fallback chain of providers.
 */
export async function analyzeResume(resumeText: string, jobDescription?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<AnalysisResult> {
  try {
    let rawResult = '';

    if (process.env.DEEPSEEK_API_KEY) {
      try {
        rawResult = await callDeepSeek(resumeText, process.env.DEEPSEEK_API_KEY, jobDescription, linkedinUrl, portfolioUrl);
      } catch (e: any) {
        logger.warn(`DeepSeek failed: ${e.message}`);
      }
    }

    if (!rawResult && process.env.NVIDIA_NIM_API_KEY) {
      try {
        rawResult = await callNvidiaNim(resumeText, process.env.NVIDIA_NIM_API_KEY, jobDescription, linkedinUrl, portfolioUrl);
      } catch (e: any) {
        logger.warn(`NVIDIA NIM failed: ${e.message}`);
      }
    }

    if (!rawResult && process.env.OPEN_ROUTER_API_KEY) {
      try {
        rawResult = await callOpenRouter(resumeText, process.env.OPEN_ROUTER_API_KEY, jobDescription, linkedinUrl, portfolioUrl);
      } catch (e: any) {
        logger.warn(`OpenRouter failed: ${e.message}`);
      }
    }

    if (!rawResult && process.env.GEMINI_API_KEY) {
      try {
        rawResult = await callGemini(resumeText, process.env.GEMINI_API_KEY, jobDescription, linkedinUrl, portfolioUrl);
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

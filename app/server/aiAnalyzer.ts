import { AnalysisResult } from '@/app/server/types';
import { logger } from '@/app/server/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Per-provider hard timeout. A provider that hangs is aborted quickly so the
// next provider can take over without blocking the whole request.
const PROVIDER_TIMEOUT_MS = 30_000;

/**
 * Single shared prompt for EVERY provider so they all return the exact same
 * structured shape ("give all the same answer"). Instructs each model to act
 * like an elite, brutally-honest technical recruiter / web-dev evaluator.
 */
const generatePrompt = (text: string, jobDescription?: string, linkedinUrl?: string, portfolioUrl?: string) => `
You are a brutally honest, highly critical expert technical recruiter and world-class web developer / AI evaluator. Your job is to strictly evaluate candidates with the precision of a senior web engineer reviewing a codebase. Do NOT sugarcoat your feedback. You must be objective and highlight any missing skills, lack of experience, or red flags. Always return the analysis in the exact same JSON schema below, regardless of model, so results are consistent across providers.

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
  "extractedName": string (candidate's full name as found in the resume),
  "extractedEmail": string (candidate's valid email address exactly as found in the resume. Extract carefully, avoiding random strings or labels like 'Email:'),
  "extractedPhone": string (candidate's phone number exactly as found in the resume. Extract cleanly, preserving country codes),
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

// Prefer an explicit `GROK_MODEL` env var; otherwise try sensible Groq model names
const GROK_MODELS = process.env.GROK_MODEL
  ? [process.env.GROK_MODEL, 'llama-3.1-8b-instant', 'llama-3.1-8b']
  : ['llama-3.1-8b-instant', 'llama-3.1-8b'];
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || process.env.OPEN_ROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;
const NVIDIA_NIM_MODEL = process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.3-70b-instruct';
const DEFAULT_GOOGLE_MODEL = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5';
const EXTERNAL_AI_MODEL = process.env.EXTERNAL_AI_MODEL || 'gpt-4o-mini';
const APIFREE_BASE_URL = process.env.API_FREE_BASE_URL || 'https://apifree.ai';
const APIFREE_MODEL = process.env.API_FREE_MODEL || 'gpt-4o';

type ProviderResponse = {
  choices?: Array<{
    message?: { content?: string };
    text?: string;
  }>;
  output?: string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function callGrok(text: string, apiKey: string, signal: AbortSignal, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  const prompt = generatePrompt(text, jd, linkedinUrl, portfolioUrl);
  const modelCandidates = GROK_MODELS;

  const callModel = async (modelName: string) => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      signal,
      body: JSON.stringify({
        model: "groq/compound",
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 4000,
        top_p: 1,
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => 'unable to read body');
      throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${body}`);
    }

    const data = await response.json();
    return extractProviderText(data, 'Grok');
  };

  let lastError: Error | null = null;
  for (const modelName of modelCandidates) {
    try {
      logger.info('Trying Grok model', { modelName });
      return await callModel(modelName);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      lastError = new Error(message);
      if (!/model not found|invalid-argument|404|not found/i.test(message)) {
        throw new Error(`Grok API error: ${message}`);
      }
      logger.warn('Grok model unavailable, trying next fallback', { modelName, message });
    }
  }

  throw new Error(`Grok failed for all configured models: ${modelCandidates.join(', ')}. Last error: ${lastError?.message ?? 'unknown'}`);
}

async function callNvidiaNim(text: string, apiKey: string, signal: AbortSignal, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  const modelName = process.env.NVIDIA_NIM_MODEL || NVIDIA_NIM_MODEL;
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    signal,
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: generatePrompt(text, jd, linkedinUrl, portfolioUrl) }],
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 1,
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => 'unable to read body');
    throw new Error(`NVIDIA NIM API error: ${response.status} ${response.statusText} - ${body}`);
  }

  const data = await response.json();
  return extractProviderText(data, 'NVIDIA NIM');
}

function extractProviderText(data: unknown, providerName: string): string {
  if (!data || typeof data !== 'object') {
    throw new Error(`${providerName} returned invalid response payload`);
  }

  const payload = data as ProviderResponse;
  if (Array.isArray(payload.choices) && payload.choices.length > 0) {
    const choice = payload.choices[0];
    if (choice?.message?.content) {
      return choice.message.content;
    }
    if (typeof choice?.text === 'string') {
      return choice.text;
    }
  }

  if (typeof payload.output === 'string') {
    return payload.output;
  }

  throw new Error(`${providerName} did not return a valid completion text`);
}

async function callOpenRouter(text: string, apiKey: string, signal: AbortSignal, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'CryptHire AI',
    },
    signal,
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: generatePrompt(text, jd, linkedinUrl, portfolioUrl) }],
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => 'unable to read body');
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${body}`);
  }

  const data = await response.json();
  return extractProviderText(data, 'OpenRouter');
}

async function callGemini(text: string, apiKey: string, signal: AbortSignal, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  const configuredModel = process.env.GOOGLE_AI_MODEL || process.env.GEMINI_MODEL || DEFAULT_GOOGLE_MODEL;
  const fallbackModel = DEFAULT_GOOGLE_MODEL;
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = generatePrompt(text, jd, linkedinUrl, portfolioUrl);

  const callModel = async (modelName: string) => {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt, { signal });
    const response = await result.response;
    return response.text();
  };

  try {
    return await callModel(configuredModel);
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    if (configuredModel !== fallbackModel && /404|not found|Unknown model|model.*does not exist/i.test(message)) {
      logger.warn('Google Gemini model unavailable, retrying with fallback model', { configuredModel, fallbackModel });
      return await callModel(fallbackModel);
    }
    throw new Error(`Google Gemini error: ${message}`);
  }
}

// Optional "external" / generic OpenAI-compatible provider (EXT) for anyone
// self-hosting or using another gateway. Configured via env vars.
async function callExternal(text: string, signal: AbortSignal, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  const baseUrl = process.env.EXTERNAL_AI_BASE_URL;
  const apiKey = process.env.EXTERNAL_AI_API_KEY;
  const model = EXTERNAL_AI_MODEL;
  if (!baseUrl || !apiKey) throw new Error('External AI provider not configured');

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: generatePrompt(text, jd, linkedinUrl, portfolioUrl) }],
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => 'unable to read body');
    throw new Error(`External AI API error: ${response.status} ${response.statusText} - ${body}`);
  }

  const data = await response.json();
  return extractProviderText(data, 'External AI');
}

// APIFree provider (pluggable gateway) - configured via API_FREE_API_KEY
async function callApiFree(text: string, apiKey: string, signal: AbortSignal, jd?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<string> {
  const baseUrl = APIFREE_BASE_URL;
  const model = APIFREE_MODEL;

  // APIFree expects requests to the base URL (per their curl example)
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    signal,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: generatePrompt(text, jd, linkedinUrl, portfolioUrl) }],
      temperature: 0.2,
      max_tokens: 4000,
      top_p: 1,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => 'unable to read body');
    throw new Error(`APIFree API error: ${response.status} ${response.statusText} - ${body}`);
  }

  const data = await response.json();
  return extractProviderText(data, 'APIFree');
}

// Provider registry in PRIORITY order: Grok → OpenRouter → NIM → Google Gemini → External.
// Providers are attempted sequentially in order; the first provider that returns valid JSON wins.
const PROVIDER_REGISTRY: {
  name: string;
  enabled: () => boolean;
  run: (text: string, signal: AbortSignal, jd?: string, linkedinUrl?: string, portfolioUrl?: string) => Promise<string>;
}[] = [
  { name: 'OpenRouter', enabled: () => !!OPENROUTER_API_KEY, run: (t, s, jd, li, pf) => callOpenRouter(t, OPENROUTER_API_KEY!, s, jd, li, pf) },
  { name: 'NVIDIA NIM', enabled: () => !!process.env.NVIDIA_NIM_API_KEY, run: (t, s, jd, li, pf) => callNvidiaNim(t, process.env.NVIDIA_NIM_API_KEY!, s, jd, li, pf) },
  { name: 'APIFree', enabled: () => !!process.env.API_FREE_API_KEY, run: (t, s, jd, li, pf) => callApiFree(t, process.env.API_FREE_API_KEY!, s, jd, li, pf) },
  { name: 'Grok', enabled: () => !!process.env.GROK_API_KEY, run: (t, s, jd, li, pf) => callGrok(t, process.env.GROK_API_KEY!, s, jd, li, pf) },
  { name: 'Google Gemini', enabled: () => !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY, run: (t, s, jd, li, pf) => callGemini(t, process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!, s, jd, li, pf) },
  { name: 'External', enabled: () => !!process.env.EXTERNAL_AI_API_KEY && !!process.env.EXTERNAL_AI_BASE_URL, run: (t, s, jd, li, pf) => callExternal(t, s, jd, li, pf) },
];

/**
 * Strictly parses + validates the raw model output into the expected schema.
 * Throws if the answer is not proper/valid JSON so the provider attempt fails
 * and the next configured provider can be tried.
 */
function parseAnalysis(raw: string): AnalysisResult {
  const stripped = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();

  const tryParse = (s: string): AnalysisResult => {
    const parsed = JSON.parse(s) as AnalysisResult;
    if (typeof parsed !== 'object' || parsed === null || typeof parsed.score !== 'number') {
      throw new Error('Analysis missing required fields');
    }
    return parsed;
  };

  try {
    return tryParse(stripped);
  } catch {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return tryParse(stripped.slice(start, end + 1));
    }
    throw new Error('Could not parse valid JSON from AI response');
  }
}

/**
 * Analyzes resume text and generates AI-powered insights.
 *
 * Provider fallback path: each enabled provider is tried in priority order.
 * If one provider fails or times out, the next one is automatically attempted.
 * Per-provider timeouts prevent a hung provider from blocking the pipeline.
 */
export async function analyzeResume(resumeText: string, jobDescription?: string, linkedinUrl?: string, portfolioUrl?: string): Promise<AnalysisResult> {
  const enabledProviders = PROVIDER_REGISTRY.filter(p => p.enabled());

  if (enabledProviders.length === 0) {
    throw new Error('No AI providers configured (set at least one API key).');
  }

  const overallController = new AbortController();
  const overallTimeout = setTimeout(() => overallController.abort(), PROVIDER_TIMEOUT_MS * enabledProviders.length);
  const errors: string[] = [];

  try {
    // Preprocess resume for providers with strict token limits (Grok/Groq)
    const preprocessResume = (text: string, maxChars = 12000) => {
      if (!text || text.length <= maxChars) return text;

      const headings = ['experience', 'work experience', 'professional experience', 'skills', 'projects', 'education', 'summary', 'certifications'];
      let extracted = '';

      for (const h of headings) {
        try {
          const re = new RegExp(`${h}[\s\S]{0,2000}`, 'i');
          const m = text.match(re);
          if (m && m[0]) {
            if (extracted.length + m[0].length <= maxChars) {
              extracted += '\n\n' + m[0];
            } else {
              const remaining = maxChars - extracted.length - 20;
              if (remaining > 0) extracted += '\n\n' + m[0].slice(0, remaining);
              break;
            }
          }
        } catch {
          // ignore regex errors
        }
      }

      // If nothing extracted, fall back to taking the start of the resume
      if (!extracted.trim()) {
        return text.slice(0, maxChars) + '\n\n[TRUNCATED]';
      }

      return extracted.slice(0, maxChars) + '\n\n[TRUNCATED]';
    };

    const grokInput = preprocessResume(resumeText, 12000);
    for (const provider of enabledProviders) {
      const providerController = new AbortController();
      const providerTimeout = setTimeout(() => providerController.abort(), PROVIDER_TIMEOUT_MS);
      overallController.signal.addEventListener('abort', () => providerController.abort(), { once: true });

      try {
        logger.info(`Querying ${provider.name}...`);

        // Attempt normal full-text run first
        try {
          const inputForProvider = provider.name === 'Grok' ? grokInput : resumeText;
          const raw = await provider.run(inputForProvider, providerController.signal, jobDescription, linkedinUrl, portfolioUrl);
          const analysis = parseAnalysis(raw);
          logger.info(`Resume analysis completed via ${provider.name}`, { score: analysis.score });
          return analysis;
        } catch (err: unknown) {
          const message = getErrorMessage(err);

          // Detect provider errors that indicate payload / token limits
          if (/payload too large|request too large|tokens per minute|rate_limit_exceeded|Request too large|413|token limit|exceed/i.test(message)) {
            logger.warn(`${provider.name} reported large payload/token limit; attempting truncated retries`, { message });

            // Try several decreasing truncation sizes (characters). These are heuristic and conservative.
            const truncationCandidates = [16000, 12000, 8000, 4000];
            let lastTruncError: string | null = null;

            for (const size of truncationCandidates) {
              const truncated = resumeText.slice(0, size) + '\n\n[TRUNCATED]';
              try {
                logger.info('Retrying with truncated resume', { provider: provider.name, size });
                const raw2 = await provider.run(truncated, providerController.signal, jobDescription, linkedinUrl, portfolioUrl);
                const analysis2 = parseAnalysis(raw2);
                logger.info(`Resume analysis completed via ${provider.name} (truncated)`, { score: analysis2.score });
                return analysis2;
              } catch (innerErr: unknown) {
                const innerMsg = getErrorMessage(innerErr);
                lastTruncError = innerMsg;
                logger.warn('Truncated retry failed', { provider: provider.name, size, innerMsg });
                // If the error is not about payload, stop trying truncations and propagate
                if (!/payload too large|request too large|tokens per minute|rate_limit_exceeded|413|token limit|exceed/i.test(innerMsg)) {
                  throw innerErr;
                }
                // otherwise continue to next smaller chunk
              }
            }

            errors.push(`${provider.name} (truncated attempts): ${lastTruncError ?? message}`);
            continue; // try next provider
          }

          // Non-payload error - record and move to next provider
          logger.warn(`${provider.name} failed: ${message}`);
          errors.push(`${provider.name}: ${message}`);
        }
      } catch (err: unknown) {
        const message = getErrorMessage(err);
        logger.warn(`${provider.name} failed: ${message}`);
        errors.push(`${provider.name}: ${message}`);
      } finally {
        clearTimeout(providerTimeout);
      }

      if (overallController.signal.aborted) {
        break;
      }
    }

    logger.error('Resume analysis failed — all AI providers failed', { errors });
    throw new Error('Failed to analyze resume: all AI providers failed or timed out.');
  } finally {
    clearTimeout(overallTimeout);
  }
}

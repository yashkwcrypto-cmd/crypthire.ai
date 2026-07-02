import { logger } from './logger';
import { parseResume } from './resumeParser';
import { analyzeResume } from './aiAnalyzer';
import { AnalysisResult } from './types';

export interface PipelineConfig {
  enablePromptInjectionCheck: boolean;
  enableSkillExtraction: boolean;
  enableExperienceAnalysis: boolean;
  maxRetries: number;
}

export interface PipelineResult {
  success: boolean;
  data?: {
    parsedText: string;
    analysis: AnalysisResult;
    metadata: {
      processingTime: number;
      steps: string[];
    };
  };
  error?: string;
}

export class AIPipeline {
  private config: PipelineConfig;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      enablePromptInjectionCheck: true,
      enableSkillExtraction: true,
      enableExperienceAnalysis: true,
      maxRetries: 3,
      ...config,
    };
  }

  async execute(resumeBuffer: Buffer): Promise<PipelineResult> {
    const startTime = Date.now();
    const steps: string[] = [];

    try {
      logger.info('Starting AI pipeline execution');
      steps.push('parse_resume');
      const parsed = await this.parseResumeWithRetry(resumeBuffer);
      logger.info('Resume parsed successfully');
      steps.push('validate_content');
      this.validateContent(parsed.text);
      logger.info('Content validation passed');
      steps.push('ai_analysis');
      const analysis = await this.analyzeWithRetry(parsed.text);
      logger.info('AI analysis completed', { score: analysis.score });
      const processingTime = Date.now() - startTime;
      return {
        success: true,
        data: {
          parsedText: parsed.text,
          analysis,
          metadata: { processingTime, steps },
        },
      };
    } catch (error: any) {
      logger.error('AI pipeline execution failed', { error: error.message, steps });
      return { success: false, error: error.message || 'Pipeline execution failed' };
    }
  }

  private async parseResumeWithRetry(buffer: Buffer, retries = 0): Promise<any> {
    try {
      return await parseResume(buffer);
    } catch (error: any) {
      if (retries < this.config.maxRetries) {
        logger.warn(`Resume parsing failed, retrying (${retries + 1}/${this.config.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return this.parseResumeWithRetry(buffer, retries + 1);
      }
      throw error;
    }
  }

  private async analyzeWithRetry(text: string, retries = 0): Promise<AnalysisResult> {
    try {
      return await analyzeResume(text);
    } catch (error: any) {
      if (retries < this.config.maxRetries) {
        logger.warn(`AI analysis failed, retrying (${retries + 1}/${this.config.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return this.analyzeWithRetry(text, retries + 1);
      }
      throw error;
    }
  }

  private validateContent(text: string): void {
    if (!text || text.length < 100) {
      throw new Error('Resume content is too short or empty');
    }
    if (text.length > 100000) {
      throw new Error('Resume content is too large');
    }
    const suspiciousPatterns = [/script/i, /javascript:/i, /onerror=/i, /onload=/i];
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        throw new Error('Suspicious content detected in resume');
      }
    }
  }

  updateConfig(config: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PipelineConfig {
    return { ...this.config };
  }
}

export const aiPipeline = new AIPipeline();

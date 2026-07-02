import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { submitCandidate, getAllCandidates } from '../controllers/candidate.controller';
import { candidateSubmissionSchema } from '../services/validation/candidate.schema';
import { ResponseHelper } from '../response';
import { requireAuth, requireRole } from '../services/middleware/auth.middleware';
import { USER_ROLES } from '../constants';
import { sanitizeAndValidate } from '../middleware/validation';
import { generateUniqueFilename } from '../fileUpload';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('resume') as File | null;
      let resumeUrl = '';

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = generateUniqueFilename(file.name);
        
        // Ensure the directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
        await fs.mkdir(uploadDir, { recursive: true });
        
        // Save the file
        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);
        
        // This URL is publicly accessible via Next.js static serving
        resumeUrl = `/uploads/resumes/${filename}`;
      }
      
      body = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone') || undefined,
        resumeUrl,
      };
    } else {
      body = await request.json();
    }
    
    const validated = sanitizeAndValidate(candidateSubmissionSchema, body) as any;
    const result = await submitCandidate(validated);
    return ResponseHelper.created(result, 'Candidate submitted successfully');
  } catch (error: any) {
    const message = error.message || 'Candidate submission failed';
    
    if (message.includes('already submitted')) {
      return ResponseHelper.conflict(message);
    }
    
    return ResponseHelper.error(message);
  }
}

export const GET = requireRole([USER_ROLES.ADMIN, USER_ROLES.RECRUITER])(
  async (request: NextRequest) => {
    try {
      const candidates = await getAllCandidates();
      return ResponseHelper.success(candidates);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get candidates';
      return ResponseHelper.error(message);
    }
  }
);

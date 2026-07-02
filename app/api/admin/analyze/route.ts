import { NextRequest } from 'next/server';
import { triggerAnalysis } from '@/app/server/controllers/admin.controller';
import { ResponseHelper } from '@/app/server/response';
import { requireRole } from '@/app/server/services/middleware/auth.middleware';
import { USER_ROLES } from '@/app/server/constants';
import { validateBody } from '@/app/server/middleware/validation';
import Joi from 'joi';

export const POST = requireRole([USER_ROLES.ADMIN])(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      
      const schema = Joi.object({
        candidateId: Joi.string().required(),
      });
      
      const validated = validateBody(schema, body) as { candidateId: string };
      const { candidateId } = validated;

      const result = await triggerAnalysis(candidateId);
      return ResponseHelper.success(result, 'Analysis triggered successfully');
    } catch (error: any) {
      const message = error.message || 'Failed to trigger analysis';
      return ResponseHelper.error(message);
    }
  }
);

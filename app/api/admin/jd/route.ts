import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/app/server/response';
import { requireRole } from '@/app/server/services/middleware/auth.middleware';
import { USER_ROLES } from '@/app/server/constants';
import { validateBody } from '@/app/server/middleware/validation';
import Joi from 'joi';
import { jobDescriptionQueries } from '@/app/server/db/queries';

export const GET = requireRole([USER_ROLES.ADMIN, USER_ROLES.RECRUITER])(
  async (request: NextRequest) => {
    try {
      const jds = await jobDescriptionQueries.getAll();
      return ResponseHelper.success(jds);
    } catch (error: any) {
      return ResponseHelper.error('Failed to fetch job descriptions');
    }
  }
);

export const POST = requireRole([USER_ROLES.ADMIN])(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      
      const schema = Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        isActive: Joi.boolean().default(true),
      });
      
      const validated = validateBody(schema, body) as { title: string; description: string; isActive: boolean };
      
      const newJd = await jobDescriptionQueries.create(validated);
      return ResponseHelper.success(newJd, 'Job description created successfully', 201);
    } catch (error: any) {
      return ResponseHelper.error(error.message || 'Failed to create job description');
    }
  }
);

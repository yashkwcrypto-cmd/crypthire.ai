import { NextRequest } from 'next/server';
import { ResponseHelper } from '@/app/server/response';
import { requireRole } from '@/app/server/services/middleware/auth.middleware';
import { USER_ROLES } from '@/app/server/constants';
import { validateBody } from '@/app/server/middleware/validation';
import Joi from 'joi';
import { jobDescriptionQueries } from '@/app/server/db/queries';

export const PATCH = requireRole([USER_ROLES.ADMIN])(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      const body = await request.json();
      
      const schema = Joi.object({
        isActive: Joi.boolean().required(),
      });
      
      const validated = validateBody(schema, body) as { isActive: boolean };
      
      const updated = await jobDescriptionQueries.updateStatus(id, validated.isActive);
      if (!updated) {
        return ResponseHelper.error('Job description not found', 404);
      }
      
      return ResponseHelper.success(updated, 'Status updated successfully');
    } catch (error: any) {
      return ResponseHelper.error(error.message || 'Failed to update status');
    }
  }
);

export const DELETE = requireRole([USER_ROLES.ADMIN])(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      await jobDescriptionQueries.delete(id);
      return ResponseHelper.success(null, 'Job description deleted successfully');
    } catch (error: any) {
      return ResponseHelper.error(error.message || 'Failed to delete job description');
    }
  }
);

import { NextRequest } from 'next/server';
import { getCandidates } from '@/app/server/controllers/admin.controller';
import { ResponseHelper } from '@/app/server/response';
import { requireRole } from '@/app/server/services/middleware/auth.middleware';
import { USER_ROLES } from '@/app/server/constants';

export const GET = requireRole([USER_ROLES.ADMIN, USER_ROLES.RECRUITER])(
  async (request: NextRequest) => {
    try {
      const candidates = await getCandidates();
      return ResponseHelper.success(candidates);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get candidates';
      return ResponseHelper.error(message);
    }
  }
);

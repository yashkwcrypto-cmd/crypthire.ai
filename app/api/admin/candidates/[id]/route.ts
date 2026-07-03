import { NextRequest } from 'next/server';
import { getCandidate, updateCandidateStatus, updateCandidateDetails, deleteCandidate } from '@/app/server/controllers/admin.controller';
import { ResponseHelper } from '@/app/server/response';
import { requireRole } from '@/app/server/services/middleware/auth.middleware';
import { USER_ROLES, CANDIDATE_STATUS } from '@/app/server/constants';

export const GET = requireRole([USER_ROLES.ADMIN, USER_ROLES.RECRUITER])(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      const candidate = await getCandidate(id);
      return ResponseHelper.success(candidate);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get candidate';
      if (message === 'Candidate not found') {
        return ResponseHelper.notFound(message);
      }
      return ResponseHelper.error(message);
    }
  }
);

export const PATCH = requireRole([USER_ROLES.ADMIN])(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      const body = await request.json();
      
      // If updating status only
      if (Object.keys(body).length === 1 && body.status) {
        const { status } = body;
        const validStatuses = Object.values(CANDIDATE_STATUS);
        if (!validStatuses.includes(status)) {
          return ResponseHelper.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        const candidate = await updateCandidateStatus(id, status);
        return ResponseHelper.success(candidate, 'Candidate status updated successfully');
      }
      
      // Otherwise updating details
      const updateData: any = {};
      if (body.fullName !== undefined) updateData.fullName = body.fullName;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl;
      if (body.portfolioUrl !== undefined) updateData.portfolioUrl = body.portfolioUrl;
      
      if (Object.keys(updateData).length === 0) {
         return ResponseHelper.badRequest('No valid fields provided for update');
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const candidate = await updateCandidateDetails(id, updateData);
      return ResponseHelper.success(candidate, 'Candidate updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update candidate';
      if (message === 'Candidate not found') {
        return ResponseHelper.notFound(message);
      }
      return ResponseHelper.error(message);
    }
  }
);

export const DELETE = requireRole([USER_ROLES.ADMIN])(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await context.params;
      await deleteCandidate(id);
      return ResponseHelper.success(null, 'Candidate deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete candidate';
      if (message === 'Candidate not found') {
        return ResponseHelper.notFound(message);
      }
      return ResponseHelper.error(message);
    }
  }
);

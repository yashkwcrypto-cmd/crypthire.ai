import { NextRequest } from 'next/server';
import { getCandidate, updateCandidateStatus } from '@/app/server/controllers/admin.controller';
import { ResponseHelper } from '@/app/server/response';
import { authenticate } from '@/app/server/services/middleware/auth.middleware';
import { USER_ROLES, CANDIDATE_STATUS } from '@/app/server/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(request);
  
  if (!user || (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.RECRUITER)) {
    return ResponseHelper.unauthorized();
  }

  try {
    const candidate = await getCandidate(params.id);
    return ResponseHelper.success(candidate);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get candidate';
    if (message === 'Candidate not found') {
      return ResponseHelper.notFound(message);
    }
    return ResponseHelper.error(message);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(request);
  
  if (!user || user.role !== USER_ROLES.ADMIN) {
    return ResponseHelper.unauthorized();
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return ResponseHelper.badRequest('status is required');
    }

    // Validate status
    const validStatuses = Object.values(CANDIDATE_STATUS);
    if (!validStatuses.includes(status)) {
      return ResponseHelper.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const candidate = await updateCandidateStatus(params.id, status);
    return ResponseHelper.success(candidate, 'Candidate status updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update candidate';
    if (message === 'Candidate not found') {
      return ResponseHelper.notFound(message);
    }
    return ResponseHelper.error(message);
  }
}

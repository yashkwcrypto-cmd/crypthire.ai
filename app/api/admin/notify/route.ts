import { NextRequest } from 'next/server';
import { getCandidate, updateCandidateStatus } from '@/app/server/controllers/admin.controller';
import { sendInterviewInvitation, sendRejectionEmail } from '@/app/server/mailer';
import { ResponseHelper } from '@/app/server/response';
import { requireRole } from '@/app/server/services/middleware/auth.middleware';
import { USER_ROLES, CANDIDATE_STATUS } from '@/app/server/constants';

export const POST = requireRole([USER_ROLES.ADMIN])(
  async (request: NextRequest, user: any) => {
    try {
      const body = await request.json();


      const { candidateId, type, interviewDate } = body;

      if (!candidateId || !type) {
        return ResponseHelper.badRequest('candidateId and type are required');
      }

      const candidate = await getCandidate(candidateId);
      if (!candidate) {
        return ResponseHelper.notFound('Candidate not found');
      }

      let emailSent = false;

      if (type === 'interview') {
        if (!interviewDate) {
          return ResponseHelper.badRequest('interviewDate is required for interview invitations');
        }

        emailSent = await sendInterviewInvitation(candidate.email, candidate.fullName, interviewDate);
        
        if (emailSent) {
          await updateCandidateStatus(candidateId, CANDIDATE_STATUS.INTERVIEWED);
        }
      } else if (type === 'rejection') {
        emailSent = await sendRejectionEmail(candidate.email, candidate.fullName);
        
        if (emailSent) {
          await updateCandidateStatus(candidateId, CANDIDATE_STATUS.REJECTED);
        }
      } else {
        return ResponseHelper.badRequest('Invalid notification type. Use "interview" or "rejection"');
      }

      if (emailSent) {
        return ResponseHelper.success(
          { candidateId, type, emailSent },
          'Notification sent successfully'
        );
      } else {
        return ResponseHelper.error('Failed to send notification email');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send notification';
      return ResponseHelper.error(message);
    }
  }
);

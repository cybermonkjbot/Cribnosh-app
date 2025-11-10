import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { ErrorCode, ErrorFactory, errorHandler, ErrorSeverity, withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { mattermostService } from '@/lib/mattermost';
import { jwtVerify } from 'jose';
import { onboardStaff } from '@/lib/onboarding/onboardStaff';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { notifyStaffOnboardingComplete, notifyOnboardingError } from '@/lib/mattermost/utils';
import { getUserFromRequest } from "@/lib/auth/session";
import { logger } from '@/lib/utils/logger';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /staff/onboarding:
 *   post:
 *     summary: Submit Staff Onboarding Form
 *     description: Submit employee onboarding form with personal information and documents
 *     tags: [Staff, Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - position
 *               - department
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Employee first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Employee last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Employee email address
 *                 example: "john.doe@cribnosh.com"
 *               position:
 *                 type: string
 *                 description: Employee position/title
 *                 example: "Customer Support Specialist"
 *               department:
 *                 type: string
 *                 description: Employee department
 *                 example: "Customer Support"
 *               phone:
 *                 type: string
 *                 description: Employee phone number
 *                 example: "+1234567890"
 *               address:
 *                 type: string
 *                 description: Employee address
 *                 example: "123 Main St, London, UK"
 *               emergencyContact:
 *                 type: string
 *                 description: Emergency contact information
 *                 example: "Jane Doe - +0987654321"
 *               idDocument:
 *                 type: string
 *                 format: binary
 *                 description: ID document file
 *               taxForm:
 *                 type: string
 *                 format: binary
 *                 description: Tax form file
 *               directDepositForm:
 *                 type: string
 *                 format: binary
 *                 description: Direct deposit form file
 *     responses:
 *       200:
 *         description: Onboarding form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     onboardingId:
 *                       type: string
 *                       description: Onboarding form ID
 *                       example: "ONB-12345"
 *                     status:
 *                       type: string
 *                       description: Onboarding status
 *                       example: "submitted"
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Submission timestamp
 *                       example: "2024-01-15T10:00:00.000Z"
 *                     nextSteps:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Next steps in onboarding process
 *                       example: ["HR Review", "Background Check", "System Access Setup"]
 *                 message:
 *                   type: string
 *                   example: "Onboarding form submitted successfully"
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Enforce Convex session auth
  const user = await getUserFromRequest(request);
  if (!user) {
    return ResponseFactory.unauthorized('Unauthorized');
  }

  try {
    const formData = await request.formData();
    
    // Extract form data
    const onboardingData: any = {};
    
    // Parse JSON data from form fields
    for (const [key, value] of formData.entries()) {
      if (key !== 'idDocument' && key !== 'taxForm' && key !== 'directDepositForm') {
        try {
          onboardingData[key] = JSON.parse(value as string);
        } catch {
          onboardingData[key] = value;
        }
      }
    }

    // Manual validation for required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'position', 'department'];
    for (const field of requiredFields) {
      if (!onboardingData[field] || typeof onboardingData[field] !== 'string') {
        throw ErrorFactory.custom(
          ErrorCode.VALIDATION_ERROR,
          `Field '${field}' is required and must be a string.`,
          ErrorSeverity.MEDIUM
        );
      }
    }
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(onboardingData.email)) {
      throw ErrorFactory.custom(
        ErrorCode.VALIDATION_ERROR,
        'Invalid email format.',
        ErrorSeverity.MEDIUM
      );
    }

    // Use shared onboarding logic
    const onboardResult = await onboardStaff(onboardingData);

    // Save onboarding data to Convex - this consolidates user update and onboarding record creation
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    await convex.mutation(api.mutations.staff.createOrUpdateStaffOnboarding, {
      userId: user._id,
      onboardingData: onboardingData,
      sessionToken: sessionToken || undefined
    });

    // Send Mattermost notification to HR
    await notifyStaffOnboardingComplete({
      name: `${onboardingData.firstName} ${onboardingData.lastName}`,
      email: onboardingData.email,
      position: onboardingData.position,
      department: onboardingData.department,
    });

    // Send confirmation to employee
    await mattermostService.sendAPIMessage({
      channel_id: process.env.MATTERMOST_CHANNEL_ID!,
      message: `:white_check_mark: Welcome to CribNosh, ${onboardingData.firstName}!`,
      props: {
        attachments: [{
          fallback: 'Onboarding confirmation',
          color: '#4a90e2',
          title: 'Onboarding Submission Confirmed',
          text: `Thank you for completing your onboarding form. HR will review your information and contact you soon with next steps.`,
          fields: [
            { title: 'Next Steps', value: '1. HR Review (1-2 business days)\n2. Document Verification\n3. System Access Setup\n4. Welcome Meeting', short: false },
          ],
          footer: 'CribNosh HR',
          ts: Math.floor(Date.now() / 1000),
        }],
      },
    });

    return errorHandler.createSuccessResponse({
      success: true,
      message: 'Onboarding form submitted successfully',
      employeeId: onboardingData.employeeId,
    });

  } catch (error) {
    logger.error('Onboarding submission error:', error);
    
    await notifyOnboardingError({
      email: undefined,
      error: error instanceof Error ? error.message : String(error),
      step: 'onboarding-submit',
    });
    
    throw ErrorFactory.custom(
      ErrorCode.INTERNAL_ERROR,
      'Failed to process onboarding submission',
      ErrorSeverity.HIGH
    );
  }
}

/**
 * OPTIONS /api/staff/onboarding - Handle CORS preflight
 */
async function handleOPTIONS(): Promise<NextResponse> {
  return ResponseFactory.options(['POST', 'OPTIONS']);
}

/**
 * POST /api/staff/onboarding/validate-code - Validate onboarding code
 */
async function handlePOST_validateCode(request: NextRequest): Promise<NextResponse> {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== 'string' || code.length !== 6) {
      throw ErrorFactory.custom(ErrorCode.VALIDATION_ERROR, 'Invalid code format', ErrorSeverity.MEDIUM);
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const result = await convex.mutation(api.mutations.staff.validateOnboardingCode, {
      code,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success(result);
  } catch (error) {
    throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to validate onboarding code', ErrorSeverity.HIGH);
  }
}

// Export handlers with middleware
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const OPTIONS = withAPIMiddleware(withErrorHandling(handleOPTIONS)); 
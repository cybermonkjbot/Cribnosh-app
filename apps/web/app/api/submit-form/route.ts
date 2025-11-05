import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { ErrorCode, ErrorFactory, errorHandler, ErrorSeverity, withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { addToBroadcastList } from '@/lib/email/addToBroadcastList';

/**
 * @swagger
 * /submit-form:
 *   post:
 *     summary: Submit Form Data
 *     description: Submit various types of forms including chef applications and waitlist signups
 *     tags: [Forms, Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formType
 *             properties:
 *               formType:
 *                 type: string
 *                 enum: [Chef Application, Waitlist]
 *                 description: Type of form being submitted
 *                 example: "Chef Application"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (required for all form types)
 *                 example: "chef@example.com"
 *               fullName:
 *                 type: string
 *                 description: Full name (required for Chef Application)
 *                 example: "John Doe"
 *               name:
 *                 type: string
 *                 description: Name (required for Waitlist)
 *                 example: "Jane Smith"
 *               phoneNumber:
 *                 type: string
 *                 nullable: true
 *                 description: Phone number (optional)
 *                 example: "+1-555-123-4567"
 *               experience:
 *                 type: string
 *                 nullable: true
 *                 description: Cooking experience (for Chef Application)
 *                 example: "5 years professional experience"
 *               specialties:
 *                 type: array
 *                 nullable: true
 *                 description: Cuisine specialties (for Chef Application)
 *                 items:
 *                   type: string
 *                 example: ["italian", "mexican"]
 *               location:
 *                 type: string
 *                 nullable: true
 *                 description: Location (for Chef Application)
 *                 example: "New York, NY"
 *               availability:
 *                 type: string
 *                 nullable: true
 *                 description: Availability (for Chef Application)
 *                 example: "Evenings and weekends"
 *               motivation:
 *                 type: string
 *                 nullable: true
 *                 description: Motivation for joining (for Chef Application)
 *                 example: "Passionate about sharing authentic recipes"
 *               referralSource:
 *                 type: string
 *                 nullable: true
 *                 description: How they heard about the platform
 *                 example: "Social media"
 *               additionalInfo:
 *                 type: string
 *                 nullable: true
 *                 description: Additional information
 *                 example: "Looking forward to joining the community"
 *     responses:
 *       200:
 *         description: Form submitted successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Form submitted successfully"
 *                     formType:
 *                       type: string
 *                       example: "Chef Application"
 *                     email:
 *                       type: string
 *                       example: "chef@example.com"
 *                     addedToBroadcast:
 *                       type: boolean
 *                       description: Whether email was added to broadcast list
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields or invalid data
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
 *     security: []
 *   options:
 *     summary: Handle CORS Preflight
 *     description: Handle CORS preflight requests for form submission
 *     tags: [Forms, CORS]
 *     responses:
 *       200:
 *         description: CORS preflight handled successfully
 *         headers:
 *           Access-Control-Allow-Origin:
 *             description: Allowed origin
 *             schema:
 *               type: string
 *               example: "*"
 *           Access-Control-Allow-Methods:
 *             description: Allowed methods
 *             schema:
 *               type: string
 *               example: "POST, OPTIONS"
 *           Access-Control-Allow-Headers:
 *             description: Allowed headers
 *             schema:
 *               type: string
 *               example: "Content-Type, Authorization"
 *     security: []
 */
/**
 * POST /api/submit-form - Submit form data
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();

  // Manual validation
  if (!body.formType || typeof body.formType !== 'string') {
    throw ErrorFactory.custom(
      ErrorCode.VALIDATION_ERROR,
      'formType is required and must be a string.',
      ErrorSeverity.MEDIUM
    );
  }
  if (body.formType === 'Chef Application') {
    if (!body.email || typeof body.email !== 'string' || !body.fullName || typeof body.fullName !== 'string') {
      throw ErrorFactory.custom(
        ErrorCode.VALIDATION_ERROR,
        'email and fullName are required for Chef Application and must be strings.',
        ErrorSeverity.MEDIUM
      );
    }
  } else if (body.formType === 'Waitlist') {
    if (!body.email || typeof body.email !== 'string' || !body.name || typeof body.name !== 'string') {
      throw ErrorFactory.custom(
        ErrorCode.VALIDATION_ERROR,
        'email and name are required for Waitlist and must be strings.',
        ErrorSeverity.MEDIUM
      );
    }
  }

  // Add to broadcast list
  if (body.formType === 'Chef Application') {
    await addToBroadcastList({ email: body.email, firstName: body.fullName });
  } else if (body.formType === 'Waitlist') {
    await addToBroadcastList({ email: body.email, firstName: body.name });
  }

  return errorHandler.createSuccessResponse({
    success: true,
    message: 'Form submitted successfully',
  });
}

/**
 * OPTIONS /api/submit-form - Handle CORS preflight
 */
async function handleOPTIONS(request: NextRequest): Promise<NextResponse> {
  return ResponseFactory.options(['POST', 'OPTIONS']);
}

// Export handlers with middleware
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const OPTIONS = withAPIMiddleware(withErrorHandling(handleOPTIONS));

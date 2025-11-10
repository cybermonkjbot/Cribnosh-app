import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { EmailService } from '@/lib/email/email.service';
import { addToBroadcastList } from '@/lib/email/addToBroadcastList';
import { mattermostService } from '@/lib/mattermost';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EQsb5GpW_HkaiK9VCCYjwAYH2Jd8xP5VN';

const emailService = new EmailService({
  resend: {
    apiKey: RESEND_API_KEY!,
  },
});

/**
 * @swagger
 * /cooking/apply:
 *   post:
 *     summary: Apply to Become a Chef
 *     description: Submit chef application with personal, kitchen, and culinary background information
 *     tags: [Chef, Applications, Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personalInfo
 *               - kitchenDetails
 *               - culinaryBackground
 *             properties:
 *               personalInfo:
 *                 type: object
 *                 required:
 *                   - email
 *                   - firstName
 *                   - lastName
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Applicant's email address
 *                     example: "chef@example.com"
 *                   firstName:
 *                     type: string
 *                     description: First name
 *                     example: "John"
 *                   lastName:
 *                     type: string
 *                     description: Last name
 *                     example: "Doe"
 *                   phone:
 *                     type: string
 *                     nullable: true
 *                     description: Phone number
 *                     example: "+1234567890"
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                     nullable: true
 *                     description: Date of birth
 *                     example: "1990-01-15"
 *                   address:
 *                     type: object
 *                     nullable: true
 *                     description: Address information
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: "123 Main St"
 *                       city:
 *                         type: string
 *                         example: "London"
 *                       postcode:
 *                         type: string
 *                         example: "SW1A 1AA"
 *                       country:
 *                         type: string
 *                         example: "UK"
 *               kitchenDetails:
 *                 type: object
 *                 required:
 *                   - kitchenName
 *                   - kitchenType
 *                 properties:
 *                   kitchenName:
 *                     type: string
 *                     description: Name of the kitchen
 *                     example: "Chef John's Kitchen"
 *                   kitchenType:
 *                     type: string
 *                     enum: [home, commercial, food_truck, popup, other]
 *                     description: Type of kitchen
 *                     example: "home"
 *                   kitchenAddress:
 *                     type: object
 *                     nullable: true
 *                     description: Kitchen address
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: "123 Kitchen St"
 *                       city:
 *                         type: string
 *                         example: "London"
 *                       postcode:
 *                         type: string
 *                         example: "SW1A 1AA"
 *                   equipment:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Available kitchen equipment
 *                     example: ["oven", "stovetop", "refrigerator", "food_processor"]
 *                   capacity:
 *                     type: number
 *                     nullable: true
 *                     description: Maximum serving capacity per day
 *                     example: 50
 *               culinaryBackground:
 *                 type: object
 *                 required:
 *                   - experience
 *                   - cuisineTypes
 *                 properties:
 *                   experience:
 *                     type: string
 *                     description: Years of culinary experience
 *                     example: "5 years professional experience"
 *                   cuisineTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Types of cuisines they specialize in
 *                     example: ["italian", "french", "mediterranean"]
 *                   specialties:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Culinary specialties
 *                     example: ["pasta", "seafood", "desserts"]
 *                   certifications:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Culinary certifications
 *                     example: ["ServSafe", "Culinary Institute Certificate"]
 *                   education:
 *                     type: string
 *                     nullable: true
 *                     description: Culinary education background
 *                     example: "Culinary Arts Degree from Le Cordon Bleu"
 *                   previousRestaurants:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Previous restaurant experience
 *                     example: ["Michelin Star Restaurant", "Local Bistro"]
 *     responses:
 *       200:
 *         description: Chef application submitted successfully
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
 *                     applicationId:
 *                       type: string
 *                       description: Application reference ID
 *                       example: "APP-12345"
 *                     status:
 *                       type: string
 *                       description: Application status
 *                       example: "submitted"
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Application submission timestamp
 *                       example: "2024-01-15T10:00:00.000Z"
 *                     nextSteps:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Next steps in the application process
 *                       example: ["Review application", "Schedule interview", "Background check"]
 *                     estimatedReviewTime:
 *                       type: string
 *                       description: Estimated time for application review
 *                       example: "3-5 business days"
 *                 message:
 *                   type: string
 *                   example: "Application submitted successfully"
 *       400:
 *         description: Validation error - missing required fields
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
 */
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { personalInfo, kitchenDetails, culinaryBackground } = data;
  if (!personalInfo?.email) {
    return ResponseFactory.validationError('Missing email');
  }
  // Email to admin (now templated)
  const adminHtml = await emailService.getTemplateRenderer().renderAdminNotificationEmail({
    title: '[Chef Application] New Chef Signup',
    details: `A new chef applied.\nName: ${personalInfo.firstName} ${personalInfo.lastName}\nEmail: ${personalInfo.email}\nKitchen: ${kitchenDetails.kitchenName}\nExperience: ${culinaryBackground.experience}`,
  });
  await emailService.send({
    to: 'support@cribnosh.com',
    from: 'earlyaccess@emails.cribnosh.com',
    subject: '[Chef Application] New Chef Signup',
    html: adminHtml,
  });
  // Add to broadcast list
  await addToBroadcastList({ email: personalInfo.email, firstName: personalInfo.firstName, lastName: personalInfo.lastName });
  
  // Send Mattermost notification
  await mattermostService.notifyChefApplication({
    name: `${personalInfo.firstName} ${personalInfo.lastName}`,
    email: personalInfo.email,
    phone: personalInfo.phone,
    experience: culinaryBackground.experience,
    cuisines: culinaryBackground.cuisineTypes,
    kitchenType: kitchenDetails.kitchenType,
    certifications: culinaryBackground.certifications,
    specialties: culinaryBackground.specialties,
  });
  
  // Confirmation email to chef (already templated)
  const confirmationHtml = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
    title: 'Thank you for applying as a CribNosh chef!',
    message: 'Thank you for your interest in cooking with CribNosh. We have received your application and will be in touch soon.',
  });
  await emailService.send({
    to: personalInfo.email,
    from: 'earlyaccess@emails.cribnosh.com',
    subject: 'Thank you for applying as a CribNosh chef!',
    html: confirmationHtml,
  });
  return ResponseFactory.success({ success: true });
}

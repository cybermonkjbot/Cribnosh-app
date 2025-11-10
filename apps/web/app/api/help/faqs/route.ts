import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /help/faqs:
 *   get:
 *     summary: Get Help FAQs
 *     description: Get frequently asked questions and help content
 *     tags: [Help]
 *     responses:
 *       200:
 *         description: FAQs retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       description: Categorized FAQ items
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: "Getting Started"
 *                           questions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 question:
 *                                   type: string
 *                                   example: "How do I create an account?"
 *                                 answer:
 *                                   type: string
 *                                   example: "You can create an account by..."
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // TODO: Fetch from database or CMS when available
    // For now, return static content
    const faqs = {
      categories: [
        {
          category: 'Getting Started',
          questions: [
            {
              question: 'How do I create a driver account?',
              answer: 'You can create a driver account by downloading the Cribnosh Driver app and following the registration process. You\'ll need to provide personal information, vehicle details, and required documents.',
            },
            {
              question: 'What documents do I need?',
              answer: 'You need a valid driver\'s license, vehicle registration, and insurance certificate. All documents will be verified before your account is activated.',
            },
            {
              question: 'How long does verification take?',
              answer: 'Document verification typically takes 24-48 hours. You\'ll receive a notification once your account is verified.',
            },
          ],
        },
        {
          category: 'Orders & Deliveries',
          questions: [
            {
              question: 'How do I accept an order?',
              answer: 'When an order is assigned to you, you\'ll receive a notification. You can accept or decline the order from the order details screen.',
            },
            {
              question: 'What happens if I decline an order?',
              answer: 'Declining an order will make it available to other drivers. Frequent declines may affect your driver rating.',
            },
            {
              question: 'How do I update order status?',
              answer: 'You can update the order status (picked up, in transit, delivered) from the active order screen.',
            },
          ],
        },
        {
          category: 'Earnings & Payments',
          questions: [
            {
              question: 'How are earnings calculated?',
              answer: 'Earnings are calculated based on a percentage of the order total or a fixed fee per delivery, whichever is higher.',
            },
            {
              question: 'When can I request a payout?',
              answer: 'You can request a payout once you have available earnings. Payouts are processed within 3-5 business days.',
            },
            {
              question: 'How do I update my bank details?',
              answer: 'You can update your bank details from the Profile section in the app. Changes may require verification.',
            },
          ],
        },
        {
          category: 'Support',
          questions: [
            {
              question: 'How do I contact support?',
              answer: 'You can contact support through the in-app support feature, email at support@cribnosh.com, or by calling our support line.',
            },
            {
              question: 'What are your support hours?',
              answer: 'Our support team is available 24/7 to assist you with any questions or issues.',
            },
          ],
        },
      ],
      lastUpdated: Date.now(),
    };

    return ResponseFactory.success(faqs);
  } catch (error: unknown) {
    return ResponseFactory.internalError('Failed to fetch FAQs.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));


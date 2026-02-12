import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /legal/terms-of-service:
 *   get:
 *     summary: Get Terms of Service
 *     description: Get the terms of service content for the platform
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Terms of service retrieved successfully
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
 *                     title:
 *                       type: string
 *                       example: "Terms of Service"
 *                     content:
 *                       type: string
 *                       description: Formatted HTML or markdown content
 *                     lastUpdated:
 *                       type: number
 *                       description: Last update timestamp
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
    const content = {
      title: 'Terms of Service',
      content: `
# Terms of Service

**Effective Date:** 12 February 2026
**Last Updated:** ${new Date().toLocaleDateString()}

## 1. Agreement to Terms
These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and CribNosh Limited ("CribNosh", "we", "us", or "our"), a company registered in Scotland (Company No. SC834534). By accessing or using our Platform, you agree to be bound by these Terms.

## 2. Account Registration & Eligibility
- **Eligibility:** You must be at least 18 years old.
- **Security:** You are responsible for safeguarding your account credentials.
- **Accuracy:** You must provide accurate and complete information.

## 3. Platform Services & User Conduct
CribNosh is a marketplace connecting food creators with customers. We are a technology provider, not a food preparation entity. You agree not to use the Platform for illegal purposes, harassment, or disruption of services.

## 4. Terms for Food Creators
- **Compliance:** Must comply with all food safety laws and hold a valid Food Hygiene Rating.
- **Insurance:** Must maintain public liability insurance.
- **Status:** Independent business/contractor, responsible for own taxes.

## 5. Terms for Delivery Partners
- **Requirements:** Valid driver's license, vehicle insurance (hire and reward), right to work in UK.
- **Conduct:** Safe and professional delivery.
- **Status:** Independent contractor.

## 6. Payment & Refunds
- **Pricing:** Inclusive of VAT where applicable.
- **Processing:** Secure processing via Stripe.
- **Refunds:** Subject to our Refund Policy.

## 7. Intellectual Property
The Platform and its content are owned by CribNosh. You grant us a license to use content you post (e.g., photos, menus).

## 8. Limitation of Liability
To the fullest extent permitted by law, CribNosh shall not be liable for indirect, incidental, or consequential damages. Our liability is limited to the greater of fees paid in the last 12 months or £100.

## 9. Termination
We may terminate or suspend your account for breach of these Terms without prior notice.

## 10. Governing Law & Jurisdiction
These Terms are governed by the laws of England and Wales. Disputes are subject to the exclusive jurisdiction of the courts of England and Wales.

## 11. Contact Us
**Email:** legal@cribnosh.co.uk
**Address:** 50 Southhouse Broadway, Edinburgh, EH17 8AR, United Kingdom
      `.trim(),
      lastUpdated: Date.now(),
    };

    return ResponseFactory.success(content);
  } catch (error: unknown) {
    return ResponseFactory.internalError('Failed to fetch terms of service.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));


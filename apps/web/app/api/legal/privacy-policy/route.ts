import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /legal/privacy-policy:
 *   get:
 *     summary: Get Privacy Policy
 *     description: Get the privacy policy content for the platform
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Privacy policy retrieved successfully
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
 *                       example: "Privacy Policy"
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
      title: 'Privacy Policy',
      content: `
# Privacy Policy

**Last Updated:** ${new Date().toLocaleDateString()}
**Data Controller:** CribNosh Limited (Company No. SC834534)

## 1. Introduction
CribNosh ("we", "our", or "us") is committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, and protect your information when you use our website, mobile application, and services (collectively, the "Platform"), in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

## 2. Information We Collect
We collect information to provide and improve our services:
- **Identity Data:** Name, username, date of birth.
- **Contact Data:** Email address, telephone number, delivery address.
- **Financial Data:** Payment card details (processed securely by Stripe).
- **Transaction Data:** Details of orders, payments, and services.
- **Technical Data:** IP address, login data, browser type, time zone setting, location data.
- **Profile Data:** Username, password, preferences, feedback.
- **Usage Data:** How you use our website and services.

## 3. How We Use Your Information
We use your data for the following purposes and legal bases:
- **Service Delivery:** To process and deliver orders (Contract).
- **Account Management:** To manage your registration and account (Contract).
- **Payments:** To process payments and prevent fraud (Contract/Legitimate Interest).
- **Improvement:** To use data analytics to improve our website, products/services, marketing, customer relationships, and experiences (Legitimate Interest).
- **Safety:** To ensure the safety of our community (Legitimate Interest/Legal Obligation).

## 4. Sharing Your Information
We may share your Personal Data with:
- **Service Providers:** IT and system administration services, payment processors (Stripe), delivery partners.
- **Professional Advisers:** Lawyers, bankers, auditors, and insurers.
- **Regulators:** HM Revenue & Customs, regulators, and other authorities.
- **Third Parties:** Entities involved in a business sale or restructuring.

## 5. International Transfers
We may transfer your personal data outside the UK/EEA. Whenever we transfer your personal data out of the UK, we ensure a similar degree of protection is afforded to it by ensuring at least one of the following safeguards is implemented (e.g., Adequacy Decisions, Standard Contractual Clauses).

## 6. Data Retention
We will only retain your personal data for as long as necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.

## 7. Your Legal Rights
Under the GDPR, you have the right to:
- **Request access** to your personal data.
- **Request correction** of your personal data.
- **Request erasure** of your personal data.
- **Object to processing** of your personal data.
- **Request restriction** of processing your personal data.
- **Request transfer** of your personal data.
- **Right to withdraw consent.**

To exercise any of these rights, please contact our Data Protection Officer.

## 8. Contact Us
**Data Protection Officer:**
Email: privacy@cribnosh.co.uk
Address: 50 Southhouse Broadway, Edinburgh, EH17 8AR, United Kingdom

## 9. Complaints
You have the right to make a complaint at any time to the Information Commissioner's Office (ICO), the UK supervisory authority for data protection issues (www.ico.org.uk).
      `.trim(),
      lastUpdated: Date.now(),
    };

    return ResponseFactory.success(content);
  } catch (error: unknown) {
    return ResponseFactory.internalError('Failed to fetch privacy policy.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));


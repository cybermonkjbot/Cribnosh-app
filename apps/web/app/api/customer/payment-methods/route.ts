import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { validatePaymentMethod } from '@/lib/services/payment-service';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/payment-methods:
 *   get:
 *     summary: Get all payment methods for the customer
 *     description: Get all payment methods (cards, Apple Pay, etc.) associated with the customer account
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "pm_1234567890"
 *                       type:
 *                         type: string
 *                         enum: [card, apple_pay, google_pay]
 *                         example: "apple_pay"
 *                       is_default:
 *                         type: boolean
 *                         example: true
 *                       last4:
 *                         type: string
 *                         nullable: true
 *                         example: "8601"
 *                       brand:
 *                         type: string
 *                         nullable: true
 *                         example: "visa"
 *                       exp_month:
 *                         type: integer
 *                         nullable: true
 *                         example: 12
 *                       exp_year:
 *                         type: integer
 *                         nullable: true
 *                         example: 2025
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-10T10:00:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);

    // Query payment methods from database
    const paymentMethods = await convex.query(api.queries.paymentMethods.getByUserId, {
      userId,
    });

    return ResponseFactory.success(paymentMethods);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payment methods';
    return createSpecErrorResponse(
      errorMessage,
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * @swagger
 * /customer/payment-methods:
 *   post:
 *     summary: Add a new payment method
 *     description: Add a new payment method (card, Apple Pay, etc.) to the customer account
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method_id
 *               - type
 *             properties:
 *               payment_method_id:
 *                 type: string
 *                 description: Payment method ID from payment processor (e.g., Stripe)
 *                 example: "pm_token_from_stripe_or_other_processor"
 *               type:
 *                 type: string
 *                 enum: [card, apple_pay, google_pay]
 *                 example: "card"
 *               set_as_default:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Payment method added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "pm_new_payment_method_id"
 *                     type:
 *                       type: string
 *                       example: "card"
 *                     is_default:
 *                       type: boolean
 *                       example: false
 *                     last4:
 *                       type: string
 *                       example: "8601"
 *                     brand:
 *                       type: string
 *                       example: "visa"
 *                     exp_month:
 *                       type: integer
 *                       example: 12
 *                     exp_year:
 *                       type: integer
 *                       example: 2025
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid payment method token or validation error
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       422:
 *         description: Payment method could not be processed
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    // Parse and validate request body
    let body: { payment_method_id?: string; type?: string; set_as_default?: boolean; last4?: string; brand?: string; exp_month?: number; exp_year?: number };
    try {
      body = await request.json();
    } catch {
      return createSpecErrorResponse(
        'Invalid JSON body',
        'BAD_REQUEST',
        400
      );
    }

    const { payment_method_id, type, set_as_default = false } = body;
    let { last4, brand, exp_month, exp_year } = body;

    // Validation
    if (!payment_method_id || typeof payment_method_id !== 'string') {
      return createSpecErrorResponse(
        'payment_method_id is required and must be a string',
        'BAD_REQUEST',
        400
      );
    }

    if (!type || !['card', 'apple_pay', 'google_pay'].includes(type)) {
      return createSpecErrorResponse(
        'type is required and must be one of: card, apple_pay, google_pay',
        'BAD_REQUEST',
        400
      );
    }

    const convex = getConvexClientFromRequest(request);

    // Validate payment method with payment provider (Stripe)
    let validatedPaymentMethod: { valid: boolean; type: string; card: { last4: string; brand: string; exp_month: number; exp_year: number; } | null };
    try {
      validatedPaymentMethod = await validatePaymentMethod(payment_method_id);
      
      // If validation successful and card details not provided, use validated details
      let finalLast4 = last4;
      let finalBrand = brand;
      let finalExpMonth = exp_month;
      let finalExpYear = exp_year;
      
      if (type === 'card' && validatedPaymentMethod.card) {
        if (!finalLast4) finalLast4 = validatedPaymentMethod.card.last4 || undefined;
        if (!finalBrand) finalBrand = validatedPaymentMethod.card.brand || undefined;
        if (!finalExpMonth) finalExpMonth = validatedPaymentMethod.card.exp_month || undefined;
        if (!finalExpYear) finalExpYear = validatedPaymentMethod.card.exp_year || undefined;
      }
      
      // Use the final values below
      last4 = finalLast4;
      brand = finalBrand;
      exp_month = finalExpMonth;
      exp_year = finalExpYear;
    } catch (error: unknown) {
      // If validation fails, return error
      const errorMessage = error instanceof Error ? error.message : 'Payment method validation failed';
      return createSpecErrorResponse(
        errorMessage,
        'BAD_REQUEST',
        400
      );
    }

    // Store payment method in database
    const paymentMethodId = await convex.mutation(api.mutations.paymentMethods.create, {
      userId,
      payment_method_id,
      type: type as 'card' | 'apple_pay' | 'google_pay',
      set_as_default: set_as_default,
      last4: type === 'card' ? (last4 || undefined) : undefined,
      brand: type === 'card' ? (brand || undefined) : undefined,
      exp_month: type === 'card' ? (exp_month || undefined) : undefined,
      exp_year: type === 'card' ? (exp_year || undefined) : undefined,
    });

    // Get the created payment method
    const createdPaymentMethod = await convex.query(api.queries.paymentMethods.getById, {
      paymentMethodId,
      userId,
    });

    if (!createdPaymentMethod) {
      return createSpecErrorResponse(
        'Failed to create payment method',
        'INTERNAL_ERROR',
        500
      );
    }

    const paymentMethod = {
      id: paymentMethodId,
      type: createdPaymentMethod.type,
      is_default: createdPaymentMethod.is_default,
      last4: createdPaymentMethod.last4 || null,
      brand: createdPaymentMethod.brand || null,
      exp_month: createdPaymentMethod.exp_month || null,
      exp_year: createdPaymentMethod.exp_year || null,
      created_at: new Date(createdPaymentMethod.createdAt).toISOString(),
    };

    return ResponseFactory.success(
      paymentMethod,
      'Payment method added successfully'
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to add payment method';
    return createSpecErrorResponse(
      errorMessage,
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));


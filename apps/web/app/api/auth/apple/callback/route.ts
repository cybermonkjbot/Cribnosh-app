import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * Apple Sign-In Callback Handler
 * Handles the redirect from Apple Sign-In and processes the authorization
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const code = formData.get('code') as string;
    const idToken = formData.get('id_token') as string;
    const state = formData.get('state') as string;
    const user = formData.get('user') as string;

    // Parse state to get redirect URL
    let redirectUrl = '/try-it';
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        redirectUrl = stateData.redirect || '/try-it';
      } catch (e) {
        console.error('Failed to parse state:', e);
      }
    }

    // Parse user data if provided (only on first sign-in)
    let userData: { email?: string; name?: { firstName?: string; lastName?: string } } | null = null;
    if (user) {
      try {
        userData = JSON.parse(user);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    // Call the Apple sign-in API endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/auth/apple-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identityToken: idToken || undefined,
        authorizationCode: code || undefined,
        user: userData ? {
          email: userData.email,
          name: userData.name ? `${userData.name.firstName || ''} ${userData.name.lastName || ''}`.trim() : undefined,
        } : undefined,
      }),
    });

    const data = await response.json();

    if (data.success && data.data?.token) {
      // Set cookie
      cookies().set('convex-auth-token', data.data.token, {
        path: '/',
        maxAge: 7200,
        sameSite: 'lax',
        httpOnly: false, // Needs to be accessible from client
      });

      // Redirect to the original page or try-it with success indicator
      const successUrl = new URL(redirectUrl, request.url);
      successUrl.searchParams.set('signed_in', 'true');
      return NextResponse.redirect(successUrl);
    } else {
      // Redirect to sign-in with error
      const errorUrl = new URL('/try-it', request.url);
      errorUrl.searchParams.set('error', 'apple_signin_failed');
      return NextResponse.redirect(errorUrl);
    }
  } catch (error) {
    console.error('Apple callback error:', error);
    const errorUrl = new URL('/try-it', request.url);
    errorUrl.searchParams.set('error', 'apple_signin_error');
    return NextResponse.redirect(errorUrl);
  }
}


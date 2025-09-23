import { useCallback } from "react";
import { useCribNoshAuth } from "./useCribNoshAuth";


interface OAuthData {
    identityToken?: string;
    authorizationCode?: string;
    user?: {
        sub: string;
        email: string;
        name: string;
    };
}
// OAuth integration hook that works with your existing SignInScreen components
export const useCribNoshOAuth = () => {
  const { oauth } = useCribNoshAuth();

  const handleGoogleSignIn = useCallback(
    async (OAuthData: OAuthData) => {
      try {
        await oauth({
          identityToken: OAuthData.identityToken,
          authorizationCode: OAuthData.authorizationCode,
          user: OAuthData.user,
        });
      } catch (error) {
        console.error("Google OAuth failed:", error);
        throw error;
      }
    },
    [oauth]
  );

  const handleAppleSignIn = useCallback(
        async (OAuthData: OAuthData) => {
      try {
        await oauth({
          identityToken: OAuthData.identityToken,
          authorizationCode: OAuthData.authorizationCode,
          user: OAuthData.user,
        });
      } catch (error) {
        console.error("Apple OAuth failed:", error);
        throw error;
      }
    },
    [oauth]
  );

  return {
    handleGoogleSignIn,
    handleAppleSignIn,
  };
};

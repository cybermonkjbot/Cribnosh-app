import * as Linking from "expo-linking";
import { router } from "expo-router";

export const handleDeepLink = (event: { url: string }) => {
  try {
    const url = event.url;

    // Validate URL format and ensure it's a valid deep link
    if (!url || typeof url !== "string") {
      return;
    }

    // Check if it's a valid deep link
    if (!url.includes('cribnoshapp://') && !url.includes('cribnosh.com') && !url.includes('cribnosh.co.uk')) {
      return;
    }

    // Check if URL is malformed
    if (
      url.includes("Failed to parse manifest JSON") ||
      url.includes("manifest")
    ) {
      try {
        router.navigate("/shared-link");
      } catch (navError) {
        console.error("Navigation error in deep link handler:", navError);
      }
      return;
    }

    // Parse the URL to extract route and parameters
    let parsedUrl;
    try {
      parsedUrl = Linking.parse(url);
    } catch (parseError) {
      // Try to handle the URL manually if parsing fails
      if (url.includes("/treat/")) {
        handleTreatLink(url);
        return;
      }
      throw parseError;
    }

    // Handle different deep link patterns
    if (url.includes("/treat/")) {
      handleTreatLink(url);
    } else if (url.includes("/pay/")) {
      handlePaymentLink(url);
    } else if (url.includes("/shared-link")) {
      try {
        router.navigate("/shared-link");
      } catch (navError) {
        console.error("Navigation error in deep link handler:", navError);
      }
    } else {
      // Try to handle as treat link as fallback
      handleTreatLink(url);
    }
  } catch (error) {
    // Fallback to shared-link page
    try {
      router.navigate("/shared-link");
    } catch (navError) {
      console.error("Navigation error in deep link handler fallback:", navError);
    }
  }
};

const handleTreatLink = (url: string) => {
  try {
    // Extract treat ID from URL - handle cribnoshapp:// scheme
    const treatIdMatch = url.match(/cribnoshapp:\/\/treat\/([^/?]+)/);
    const treatId = treatIdMatch ? treatIdMatch[1] : null;

    if (treatId) {
      // Decode the treat ID if it's URL encoded
      const decodedTreatId = decodeURIComponent(treatId);

      // Navigate directly to shared-link page with the treat ID as parameter
      try {
        router.navigate({
          pathname: "/shared-link",
          params: { treatId: decodedTreatId },
        });
      } catch (navError) {
        console.error("Navigation error in handleTreatLink:", navError);
        // Fallback to simple navigation
        try {
          router.navigate("/shared-link");
        } catch (fallbackError) {
          console.error("Fallback navigation also failed:", fallbackError);
        }
      }
    } else {
      // Fallback to shared-link page
      try {
        router.navigate("/shared-link");
      } catch (navError) {
        console.error("Navigation error in handleTreatLink fallback:", navError);
      }
    }
  } catch (error) {
    try {
      router.navigate("/shared-link");
    } catch (navError) {
      console.error("Navigation error in handleTreatLink catch:", navError);
    }
  }
};

const handlePaymentLink = (url: string) => {
  try {
    // Extract token from URL - handle cribnoshapp://pay/TOKEN schema
    const tokenMatch = url.match(/cribnoshapp:\/\/pay\/([^/?]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (token) {
      const decodedToken = decodeURIComponent(token);
      try {
        router.navigate(`/pay/${decodedToken}` as any);
      } catch (navError) {
        console.error("Navigation error in handlePaymentLink:", navError);
      }
    }
  } catch (error) {
    console.error("Error handling payment link:", error);
  }
};
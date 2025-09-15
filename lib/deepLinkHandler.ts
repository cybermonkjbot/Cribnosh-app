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
    if (!url.includes('cribnoshapp://') && !url.includes('cribnosh.com')) {
      return;
    }

    // Check if URL is malformed
    if (
      url.includes("Failed to parse manifest JSON") ||
      url.includes("manifest")
    ) {
      router.navigate("/shared-link");
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
    } else if (url.includes("/shared-link")) {
      router.navigate("/shared-link");
    } else {
      // Try to handle as treat link as fallback
      handleTreatLink(url);
    }
  } catch (error) {
    // Fallback to shared-link page
    router.navigate("/shared-link");
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
      router.navigate({
        pathname: "/shared-link",
        params: { treatId: decodedTreatId },
      });
    } else {
      // Fallback to shared-link page
      router.navigate("/shared-link");
    }
  } catch (error) {
    router.navigate("/shared-link");
  }
};
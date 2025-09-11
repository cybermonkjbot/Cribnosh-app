import * as Linking from "expo-linking";
import { router } from "expo-router";

export const handleDeepLink = (event: { url: string }) => {
  console.log("Deep link received:", event.url);
  console.log("URL type:", typeof event.url);
  console.log("URL length:", event.url?.length);

  try {
    const url = event.url;

    // Validate URL format
    if (!url || typeof url !== "string") {
      console.error("Invalid URL received:", url);
      router.navigate("/shared-link");
      return;
    }

    // Check if URL is malformed
    if (
      url.includes("Failed to parse manifest JSON") ||
      url.includes("manifest")
    ) {
      console.error("Malformed URL detected, likely a system error:", url);
      router.navigate("/shared-link");
      return;
    }

    // Parse the URL to extract route and parameters
    let parsedUrl;
    try {
      parsedUrl = Linking.parse(url);
      console.log("Parsed URL:", parsedUrl);
    } catch (parseError) {
      console.error("URL parsing failed:", parseError);
      console.log("Raw URL:", url);
      // Try to handle the URL manually if parsing fails
      if (url.includes("/treat/")) {
        console.log("Manual treat link detection");
        handleTreatLink(url);
        return;
      }
      throw parseError;
    }

    // Handle different deep link patterns
    if (url.includes("/treat/")) {
      console.log("Treat link detected, handling...");
      handleTreatLink(url);
    } else if (url.includes("/shared-link")) {
      console.log("Shared link detected, handling...");
      router.navigate("/shared-link");
    } else {
      console.log("Unknown deep link pattern:", url);
      console.log("Attempting to handle as treat link...");
      // Try to handle as treat link as fallback
      handleTreatLink(url);
    }
  } catch (error) {
    console.error("Error handling deep link:", error);
    console.log(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.log("Falling back to shared-link page");
    // Fallback to shared-link page
    router.navigate("/shared-link");
  }
};

const handleTreatLink = (url: string) => {
  try {
    console.log("Handling treat link:", url);

    // Extract treat ID from URL - handle cribnoshapp:// scheme
    const treatIdMatch = url.match(/cribnoshapp:\/\/treat\/([^/?]+)/);
    const treatId = treatIdMatch ? treatIdMatch[1] : null;

    console.log("Extracted treat ID:", treatId);

    if (treatId) {
      console.log("Navigating to shared-link page with treat ID:", treatId);

      // Decode the treat ID if it's URL encoded
      const decodedTreatId = decodeURIComponent(treatId);
      console.log("Decoded treat ID:", decodedTreatId);

      // Navigate directly to shared-link page with the treat ID as parameter
      router.navigate({
        pathname: "/shared-link",
        params: { treatId: decodedTreatId },
      });
    } else {
      console.log("No treat ID found in URL, redirecting to shared-link");
      console.log("URL analysis:", {
        url,
        hasTreatPath: url.includes("/treat/"),
        hasCribnoshScheme: url.startsWith("cribnoshapp://"),
      });
      // Fallback to shared-link page
      router.navigate("/shared-link");
    }
  } catch (error) {
    console.error("Error handling treat link:", error);
    console.log("Falling back to shared-link page");
    router.navigate("/shared-link");
  }
};

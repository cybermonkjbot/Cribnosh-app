import * as Linking from "expo-linking";
import { router } from "expo-router";

export interface DeepLinkData {
  treatId?: string;
  treatName?: string;
  [key: string]: string | undefined;
}

export class DeepLinkHandler {
  private static instance: DeepLinkHandler;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler();
    }
    return DeepLinkHandler.instance;
  }

  public async initialize() {
    if (this.isInitialized) return;

    try {
      // Handle deep links when app is already running
      Linking.addEventListener("url", this.handleDeepLink);

      // Handle deep links when app is opened from a closed state
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        this.handleDeepLink({ url: initialUrl });
      }

      this.isInitialized = true;
      console.log("Deep link handler initialized");
    } catch (error) {
      console.error("Error initializing deep link handler:", error);
    }
  }

  public handleDeepLink = (event: { url: string }) => {
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
      const parsedUrl = Linking.parse(url);
      console.log("Parsed URL:", parsedUrl);

      // Handle different deep link patterns
      if (url.includes("/treat/")) {
        console.log("Treat link detected, handling...");
        this.handleTreatLink(url);
      } else if (url.includes("/shared-link")) {
        console.log("Shared link detected, handling...");
        this.handleSharedLink(url);
      } else {
        console.log("Unknown deep link pattern:", url);
        console.log("Attempting to handle as treat link...");
        // Try to handle as treat link as fallback
        this.handleTreatLink(url);
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

  private handleTreatLink(url: string) {
    try {
      console.log("Handling treat link:", url);

      // Extract treat ID from URL - handle cribnoshapp://, https://, and exp:// schemes
      const treatIdMatch = url.match(
        /(?:cribnoshapp:\/\/treat\/|https:\/\/cribnosh\.com\/treat\/|exp:\/\/[^\/]+\/treat\/)([^/?]+)/
      );
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
        // Fallback to shared-link page
        router.navigate("/shared-link");
      }
    } catch (error) {
      console.error("Error handling treat link:", error);
      console.log("Falling back to shared-link page");
      router.navigate("/shared-link");
    }
  }

  private handleSharedLink(url: string) {
    try {
      console.log("Navigating to shared-link page");
      router.navigate("/shared-link");
    } catch (error) {
      console.error("Error handling shared link:", error);
    }
  }

  public generateTreatLink(treatId: string, treatName?: string): string {
    const baseUrl = "cribnoshapp://treat";
    return `${baseUrl}/${treatId}`;
  }

  public generateWebTreatLink(treatId: string): string {
    const baseUrl = "https://cribnosh.com/treat";
    return `${baseUrl}/${treatId}`;
  }

  public generateShareMessage(treatId: string, treatName?: string): string {
    const deepLink = this.generateTreatLink(treatId, treatName);
    const webLink = this.generateWebTreatLink(treatId);

    return `I'm treating you to a meal! 🍽️\n\nDownload Cribnosh and use this link: ${deepLink}\n\nOr visit: ${webLink}`;
  }
}

// Export singleton instance
export const deepLinkHandler = DeepLinkHandler.getInstance();

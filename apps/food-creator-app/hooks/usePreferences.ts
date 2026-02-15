import { useCallback, useState } from "react";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useToast } from "@/lib/ToastContext";

export const usePreferences = () => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get dietary preferences
   */
  const getDietaryPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetDietaryPreferences,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(result.error || "Failed to get dietary preferences");
      }

      return {
        success: true,
        data: {
          preferences: result.preferences,
          religious_requirements: result.religious_requirements,
          health_driven: result.health_driven,
          updated_at: result.updated_at,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get dietary preferences";
      showToast({
        type: "error",
        title: "Preferences Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Update dietary preferences
   */
  const updateDietaryPreferences = useCallback(
    async (data: {
      preferences: string[];
      religious_requirements: string[];
      health_driven: string[];
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerUpdateDietaryPreferences,
          {
            sessionToken,
            preferences: data.preferences,
            religious_requirements: data.religious_requirements,
            health_driven: data.health_driven,
          }
        );

        if (result.success === false) {
          throw new Error(result.error || "Failed to update dietary preferences");
        }

        showToast({
          type: "success",
          title: "Success",
          message: result.message || "Dietary preferences updated successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            preferences: result.preferences,
            religious_requirements: result.religious_requirements,
            health_driven: result.health_driven,
            updated_at: result.updated_at,
          },
          message: result.message,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to update dietary preferences";
        showToast({
          type: "error",
          title: "Update Failed",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Get allergies
   */
  const getAllergies = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(api.actions.users.customerGetAllergies, {
        sessionToken,
      });

      if (result.success === false) {
        throw new Error(result.error || "Failed to get allergies");
      }

      return {
        success: true,
        data: {
          allergies: result.allergies,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message || error?.data?.error?.message || "Failed to get allergies";
      showToast({
        type: "error",
        title: "Allergies Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Update allergies
   */
  const updateAllergies = useCallback(
    async (allergies: Array<{
      name: string;
      type: "allergy" | "intolerance";
      severity: "mild" | "moderate" | "severe";
    }>) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(api.actions.users.customerUpdateAllergies, {
          sessionToken,
          allergies,
        });

        if (result.success === false) {
          throw new Error(result.error || "Failed to update allergies");
        }

        showToast({
          type: "success",
          title: "Success",
          message: result.message || "Allergies updated successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            allergies: result.allergies,
          },
          message: result.message,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message || error?.data?.error?.message || "Failed to update allergies";
        showToast({
          type: "error",
          title: "Update Failed",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  /**
   * Get data sharing preferences
   */
  const getDataSharingPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const result = await convex.action(
        api.actions.users.customerGetDataSharingPreferences,
        {
          sessionToken,
        }
      );

      if (result.success === false) {
        throw new Error(
          result.error || "Failed to get data sharing preferences"
        );
      }

      return {
        success: true,
        data: {
          analytics_enabled: result.analytics_enabled,
          personalization_enabled: result.personalization_enabled,
          marketing_enabled: result.marketing_enabled,
          updated_at: result.updated_at,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.data?.error?.message ||
        "Failed to get data sharing preferences";
      showToast({
        type: "error",
        title: "Preferences Error",
        message: errorMessage,
        duration: 4000,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Update data sharing preferences
   */
  const updateDataSharingPreferences = useCallback(
    async (data: {
      analytics_enabled?: boolean;
      personalization_enabled?: boolean;
      marketing_enabled?: boolean;
    }) => {
      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          throw new Error("Not authenticated");
        }

        const result = await convex.action(
          api.actions.users.customerUpdateDataSharingPreferences,
          {
            sessionToken,
            analytics_enabled: data.analytics_enabled,
            personalization_enabled: data.personalization_enabled,
            marketing_enabled: data.marketing_enabled,
          }
        );

        if (result.success === false) {
          throw new Error(
            result.error || "Failed to update data sharing preferences"
          );
        }

        showToast({
          type: "success",
          title: "Success",
          message:
            result.message || "Data sharing preferences updated successfully",
          duration: 3000,
        });

        return {
          success: true,
          data: {
            analytics_enabled: result.analytics_enabled,
            personalization_enabled: result.personalization_enabled,
            marketing_enabled: result.marketing_enabled,
            updated_at: result.updated_at,
          },
          message: result.message,
        };
      } catch (error: any) {
        const errorMessage =
          error?.message ||
          error?.data?.error?.message ||
          "Failed to update data sharing preferences";
        showToast({
          type: "error",
          title: "Update Failed",
          message: errorMessage,
          duration: 4000,
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  return {
    isLoading,
    getDietaryPreferences,
    updateDietaryPreferences,
    getAllergies,
    updateAllergies,
    getDataSharingPreferences,
    updateDataSharingPreferences,
  };
};


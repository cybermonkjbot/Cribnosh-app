import { useOffersAndTreats } from "@/hooks/useOffersAndTreats";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuthContext } from "../../contexts/AuthContext";
import { showError } from "../../lib/GlobalToastManager";
import { SpecialOffersSectionSkeleton } from "./SpecialOffersSectionSkeleton";
import { SkeletonWithTimeout } from "./SkeletonWithTimeout";

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: string;
  image: any;
  validUntil: string;
  isLimited?: boolean;
  remainingTime?: string;
}

// Utility function to format date without year
const formatDateWithoutYear = (dateString: string | number): string => {
  // Handle timestamp
  let date: Date;
  if (typeof dateString === "number") {
    date = new Date(dateString);
  } else {
    // If it's already formatted without year, return as is
    if (!dateString.includes(",")) {
      return dateString;
    }
    date = new Date(dateString);
  }

  // Parse date and format without year
  try {
    const month = date.toLocaleString("en-GB", { month: "short" });
    const day = date.getDate();
    return `${month} ${day}`;
  } catch {
    // If parsing fails, try to remove year from string
    return typeof dateString === "string"
      ? dateString.replace(/,?\s*\d{4}$/, "")
      : "";
  }
};

// Utility function to calculate remaining time
const calculateRemainingTime = (endsAt: number): string | undefined => {
  const now = Date.now();
  const diff = endsAt - now;

  if (diff <= 0) return undefined;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days} ${days === 1 ? "day" : "days"} left`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
  } else {
    return "Ending soon";
  }
};

interface SpecialOffersSectionProps {
  offers?: SpecialOffer[];
  onOfferPress?: (offer: SpecialOffer) => void;
  onSeeAllPress?: () => void;
  useBackend?: boolean;
}

export const SpecialOffersSection: React.FC<SpecialOffersSectionProps> = ({
  offers: propOffers,
  onOfferPress,
  onSeeAllPress,
  useBackend = true,
}) => {
  const { isAuthenticated } = useAuthContext();
  const { getActiveOffers, isLoading: backendLoading } = useOffersAndTreats();
  const [offersData, setOffersData] = useState<any>(null);
  const [backendError, setBackendError] = useState<any>(null);

  // Fetch offers from backend when needed
  useEffect(() => {
    if (useBackend && isAuthenticated) {
      loadOffers();
    }
  }, [useBackend, isAuthenticated]);

  const loadOffers = useCallback(async () => {
    try {
      setBackendError(null);
      const result = await getActiveOffers("all");
      if (result.success) {
        setOffersData(result);
      }
    } catch (error) {
      setBackendError(error);
      // Error state is shown in UI - no toast needed
    }
  }, [getActiveOffers, isAuthenticated]);

  // Transform API data to component format
  const transformOfferData = useCallback(
    (apiOffer: any): SpecialOffer | null => {
      if (!apiOffer) return null;

      // Format discount value
      let discountText = "";
      if (apiOffer.discount_type === "percentage") {
        discountText = `${apiOffer.discount_value}%`;
      } else if (apiOffer.discount_type === "fixed_amount") {
        discountText = `£${(apiOffer.discount_value / 100).toFixed(2)}`;
      } else if (apiOffer.discount_type === "free_delivery") {
        discountText = "Free Delivery";
      }

      // Format valid until date
      const validUntil = formatDateWithoutYear(apiOffer.ends_at);
      const remainingTime = calculateRemainingTime(apiOffer.ends_at);

      return {
        id: apiOffer.offer_id || apiOffer._id || "",
        title: apiOffer.title || "Special Offer",
        description: apiOffer.description || "",
        discount: discountText,
        image: {
          uri:
            apiOffer.background_image_url ||
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
        },
        validUntil,
        isLimited: apiOffer.offer_type === "limited_time",
        remainingTime,
      };
    },
    []
  );

  // Process offers data - only use API data, no prop fallback
  const offers: SpecialOffer[] = useMemo(() => {
    // Only use backend API data
    if (useBackend && offersData?.success && offersData.data?.offers) {
      const transformedOffers = offersData.data.offers
        .map(transformOfferData)
        .filter((offer): offer is SpecialOffer => offer !== null);
      return transformedOffers;
    }

    // Return empty array if no API data
    return [];
  }, [offersData, useBackend, transformOfferData]);


  // Show skeleton while loading
  if (useBackend && backendLoading) {
    return (
      <SkeletonWithTimeout isLoading={backendLoading}>
        <SpecialOffersSectionSkeleton itemCount={3} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section if no offers (don't show empty state)
  if (offers.length === 0) {
    return null;
  }
  const renderOfferCard = (offer: SpecialOffer, index: number) => (
    <TouchableOpacity
      key={offer.id}
      style={{
        width: 280,
        marginRight: 16,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
      }}
      onPress={() => onOfferPress?.(offer)}
      activeOpacity={0.8}
    >
      {/* Offer Image */}
      <View style={{ position: "relative" }}>
        <Image
          source={offer.image}
          style={{
            width: "100%",
            height: 140,
            resizeMode: "cover",
          }}
        />

        {/* Discount Badge */}
        <View
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            backgroundColor: "#ef4444",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 14,
              fontWeight: "700",
            }}
          >
            {offer.discount} OFF
          </Text>
        </View>

        {/* Limited Time Badge */}
        {offer.isLimited && (
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 10,
                fontWeight: "600",
              }}
            >
              LIMITED
            </Text>
          </View>
        )}

        {/* Remaining Time */}
        {offer.remainingTime && (
          <View
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 10,
                fontWeight: "500",
              }}
            >
              {offer.remainingTime}
            </Text>
          </View>
        )}
      </View>

      {/* Offer Info */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            color: "#1a1a1a",
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 4,
            lineHeight: 20,
          }}
        >
          {offer.title}
        </Text>

        <Text
          style={{
            color: "#666666",
            fontSize: 13,
            fontWeight: "400",
            marginBottom: 8,
            lineHeight: 16,
          }}
        >
          {offer.description}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: "#ef4444",
              fontSize: 12,
              fontWeight: "600",
            }}
          >
            Valid until {formatDateWithoutYear(offer.validUntil)}
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#ef4444",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              Claim Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ marginBottom: 24 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          paddingHorizontal: 12,
        }}
      >
        <Text
          style={{
            color: "#1a1a1a",
            fontSize: 20,
            fontWeight: "700",
            lineHeight: 24,
          }}
        >
          Special Offers
        </Text>

        <TouchableOpacity onPress={onSeeAllPress}>
          <Text
            style={{
              color: "#ef4444",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            See All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 12, // Changed from paddingHorizontal to paddingLeft only
        }}
      >
        {offers.map(renderOfferCard)}
      </ScrollView>
    </View>
  );
};

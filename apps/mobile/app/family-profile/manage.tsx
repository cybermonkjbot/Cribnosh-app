import { useToast } from "@/lib/ToastContext";
import {
  useGetFamilyProfileQuery,
  useGetFamilySpendingQuery,
  useRemoveFamilyMemberMutation,
} from "@/store/customerApi";
import type { FamilyMember } from "@/types/customer";
import { Stack, useRouter } from "expo-router";
import { Plus, Users } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { AddFamilyMemberSheet } from "@/components/ui/AddFamilyMemberSheet";
import { FamilyMemberDetailSheet } from "@/components/ui/FamilyMemberDetailSheet";
import { FamilyOrdersSheet } from "@/components/ui/FamilyOrdersSheet";
import { useState } from "react";

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function FamilyProfileManageScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    data: familyProfileData,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchFamilyProfile,
  } = useGetFamilyProfileQuery();
  const { data: spendingData, isLoading: spendingLoading } =
    useGetFamilySpendingQuery();
  const [removeFamilyMember, { isLoading: isRemovingMember }] =
    useRemoveFamilyMemberMutation();
  
  const [isAddMemberSheetVisible, setIsAddMemberSheetVisible] = useState(false);
  const [isMemberDetailSheetVisible, setIsMemberDetailSheetVisible] = useState(false);
  const [isOrdersSheetVisible, setIsOrdersSheetVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handleAddMember = () => {
    setIsAddMemberSheetVisible(true);
  };

  const handleMemberPress = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsMemberDetailSheetVisible(true);
  };
  
  const handleAddMemberSuccess = () => {
    // Refetch family profile data to show the new member
    refetchFamilyProfile();
  };


  const handleOrders = () => {
    setIsOrdersSheetVisible(true);
  };
  
  const handleOrderSelect = (orderId: string) => {
    router.push(`/order-details?id=${orderId}`);
  };

  const handleRemoveMember = (member: FamilyMember) => {
    Alert.alert(
      "Remove Family Member",
      `Are you sure you want to remove ${member.name} from your family profile? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFamilyMember({ member_id: member.id }).unwrap();
              showToast({
                type: "success",
                title: "Member Removed",
                message: `${member.name} has been removed from your family profile.`,
                duration: 3000,
              });
            } catch (error: any) {
              console.error("Error removing family member:", error);
              showToast({
                type: "error",
                title: "Remove Failed",
                message:
                  error?.data?.error?.message ||
                  "Failed to remove family member. Please try again.",
                duration: 4000,
              });
            }
          },
        },
      ]
    );
  };

  if (profileLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: "Family Profile",
          }}
        />
        <SafeAreaView style={styles.mainContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <SvgXml xml={backArrowSVG} width={24} height={24} />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
            <Text style={styles.loadingText}>Loading family profile...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (profileError || !familyProfileData?.data) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: "Family Profile",
          }}
        />
        <SafeAreaView style={styles.mainContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <SvgXml xml={backArrowSVG} width={24} height={24} />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.emptyScrollContent}
          >
            <Text style={styles.mainTitle}>Family Profile</Text>
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconContainer}>
                <Users size={64} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No Family Profile</Text>
              <Text style={styles.emptySubtitle}>
                Create a family profile to share your account with family
                members, manage shared payment methods, and track spending
                together.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/family-profile/setup")}
                style={styles.createButton}
                activeOpacity={0.8}
              >
                <Text style={styles.createButtonText}>
                  Create Family Profile
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  const profile = familyProfileData.data;
  const totalSpending = spendingData?.data?.total_spending || 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: "Family Profile",
        }}
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />

        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>Family Profile</Text>
          {/* Overview Section */}
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>
                  £{totalSpending.toFixed(2)}
                </Text>
                <Text style={styles.overviewLabel}>This Month</Text>
              </View>
            </View>
          </View>

          {/* Family Members Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family Members</Text>
              <TouchableOpacity
                onPress={handleAddMember}
                style={styles.addButton}
              >
                <Plus size={20} color="#094327" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {profile.family_members.map((member) => (
              <TouchableOpacity
                key={member.id}
                onPress={() => handleMemberPress(member)}
                onLongPress={() => handleRemoveMember(member)}
                style={styles.memberCard}
                disabled={isRemovingMember}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitials}>
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberDetails}>
                    {member.relationship} •{" "}
                    {member.status === "accepted" ? "Active" : member.status}
                  </Text>
                </View>
                <View style={styles.memberSpending}>
                  {spendingData?.data?.members.find(
                    (m) => m.member_id === member.id
                  ) && (
                    <>
                      <Text style={styles.spendingAmount}>
                        £
                        {spendingData.data.members
                          .find((m) => m.member_id === member.id)
                          ?.monthly_spent.toFixed(2) || "0.00"}
                      </Text>
                      <Text style={styles.spendingLabel}>This Month</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity onPress={handleOrders} style={[styles.actionCard, styles.quickActionCard]}>
              <Text style={styles.actionTitle}>View All Orders</Text>
              <Text style={styles.actionDescription}>
                See orders placed by family members
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Add Family Member Sheet */}
        <AddFamilyMemberSheet
          isVisible={isAddMemberSheetVisible}
          onClose={() => setIsAddMemberSheetVisible(false)}
          onSuccess={handleAddMemberSuccess}
        />
        
        {/* Family Member Detail Sheet */}
        <FamilyMemberDetailSheet
          isVisible={isMemberDetailSheetVisible}
          onClose={() => {
            setIsMemberDetailSheetVisible(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          onNavigateToBudget={(memberId) => router.push(`/family-profile/member/${memberId}/budget`)}
          onNavigateToPreferences={(memberId) => router.push(`/family-profile/member/${memberId}/preferences`)}
          onNavigateToOrders={(memberId) => router.push(`/family-profile/member/${memberId}/orders`)}
        />
        
        {/* Family Orders Sheet */}
        <FamilyOrdersSheet
          isVisible={isOrdersSheetVisible}
          onClose={() => setIsOrdersSheetVisible(false)}
          onSelectOrder={handleOrderSelect}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#FAFFFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontFamily: "Archivo",
    fontStyle: "normal",
    fontWeight: "700",
    fontSize: 24,
    lineHeight: 32,
    color: "#094327",
    textAlign: "left",
    marginTop: 16,
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#094327",
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Inter",
    fontWeight: "500",
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    minHeight: 400,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: "#094327",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "Archivo",
  },
  emptySubtitle: {
    color: "#6B7280",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "Inter",
    fontWeight: "400",
    paddingHorizontal: 16,
  },
  createButton: {
    backgroundColor: "#094327",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  overviewCard: {
    backgroundColor: "rgba(244, 255, 245, 0.79)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  overviewItem: {
    alignItems: "flex-start",
  },
  overviewValue: {
    color: "#094327",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
    fontFamily: "Inter",
  },
  overviewLabel: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: "400",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#094327",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Archivo",
    marginBottom: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  addButtonText: {
    color: "#094327",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
    fontFamily: "Inter",
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#094327",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitials: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Inter",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: "#094327",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: "Inter",
  },
  memberDetails: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: "400",
  },
  memberSpending: {
    alignItems: "flex-end",
  },
  spendingAmount: {
    color: "#094327",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    fontFamily: "Inter",
  },
  spendingLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: "Inter",
    fontWeight: "400",
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
  quickActionCard: {
    marginTop: 16,
    marginBottom: 0,
  },
  actionTitle: {
    color: "#094327",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: "Inter",
  },
  actionDescription: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: "400",
  },
});

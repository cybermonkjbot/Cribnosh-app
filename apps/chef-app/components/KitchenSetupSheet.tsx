import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { getSessionToken } from '@/lib/convexClient';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

interface KitchenSetupSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

// Icons
const checkIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 6L9 17L4 12" stroke="#0B9E58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const circleIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke="#9CA3AF" stroke-width="2"/>
</svg>`;

const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface SetupItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route?: string;
  onPress?: () => void;
}

export function KitchenSetupSheet({ isVisible, onClose }: KitchenSetupSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chef, user, sessionToken: authSessionToken } = useChefAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Get session token
  useEffect(() => {
    const loadToken = async () => {
      if (authSessionToken) {
        setSessionToken(authSessionToken);
      } else {
        const token = await getSessionToken();
        setSessionToken(token);
      }
    };
    if (isVisible && user) {
      loadToken();
    }
  }, [isVisible, user, authSessionToken]);

  // Get chef profile data (use chef from context, but query if needed for fresh data)
  // We already have chef from useChefAuth, so we can use that directly

  // Get kitchen ID
  const kitchenId = useQuery(
    api.queries.kitchens.getKitchenByChefId,
    chef?._id ? { chefId: chef._id } : 'skip'
  );

  // Get kitchen details
  const kitchen = useQuery(
    api.queries.kitchens.getKitchenById,
    kitchenId ? { kitchenId } : 'skip'
  );

  // Get onboarding completion status
  const isOnboardingComplete = useQuery(
    api.queries.chefCourses.isOnboardingComplete,
    chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : 'skip'
  );

  // Get basic onboarding status
  const isBasicOnboardingComplete = useQuery(
    api.queries.chefs.isBasicOnboardingComplete,
    chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : 'skip'
  );

  // Get bank accounts
  const bankAccounts = useQuery(
    api.queries.chefBankAccounts.getByChefId,
    chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : 'skip'
  );

  // Get documents summary
  const documentsSummary = useQuery(
    api.queries.chefDocuments.getSummary,
    chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : 'skip'
  );

  // Check what's missing
  const setupItems = useMemo<SetupItem[]>(() => {
    if (!chef || !user) return [];

    const items: SetupItem[] = [];

    // 1. Personal Info
    const hasName = !!user.name && user.name.trim().length > 0;
    const hasEmail = !!user.email && user.email.trim().length > 0;
    const hasPhone = !!user.phone && user.phone.trim().length > 0;
    const hasContact = hasEmail || hasPhone;
    const personalInfoComplete = hasName && hasContact;

    items.push({
      id: 'personal-info',
      title: 'Complete Business Settings',
      description: 'Add your name and contact details',
      completed: personalInfoComplete,
      route: '/personal-info',
    });

    // 2. Chef Profile
    const hasBio = !!chef.bio && chef.bio.trim().length > 0;
    const hasSpecialties = chef.specialties && chef.specialties.length > 0;
    const hasLocation = chef.location && chef.location.city && chef.location.coordinates;
    const chefProfileComplete = hasBio && hasSpecialties && hasLocation;

    items.push({
      id: 'chef-profile',
      title: 'Complete Chef Profile',
      description: 'Add bio, specialties, and location',
      completed: chefProfileComplete,
      route: '/(tabs)/profile',
    });

    // 3. Kitchen Setup
    const hasKitchen = !!kitchenId;
    const hasKitchenAddress = kitchen?.address && kitchen.address.trim().length > 0;
    const kitchenComplete = hasKitchen && hasKitchenAddress;

    items.push({
      id: 'kitchen-setup',
      title: 'Set Up Your Kitchen',
      description: 'Add kitchen address and details',
      completed: kitchenComplete,
      route: '/personal-info',
    });

    // 4. Compliance Course
    items.push({
      id: 'compliance-course',
      title: 'Complete Compliance Course',
      description: 'Finish the 13-module food safety course',
      completed: isOnboardingComplete === true,
      route: '/(tabs)/chef/onboarding',
    });

    // 5. Required Documents Verification
    const allRequiredDocumentsVerified = documentsSummary?.allRequiredVerified === true;
    const requiredDocsCount = documentsSummary?.required || 0;
    const verifiedDocsCount = documentsSummary?.requiredVerified || 0;
    
    items.push({
      id: 'documents-verification',
      title: 'Verify Required Documents',
      description: requiredDocsCount > 0
        ? `${verifiedDocsCount} of ${requiredDocsCount} required document${requiredDocsCount !== 1 ? 's' : ''} verified`
        : 'Upload and verify required documents',
      completed: allRequiredDocumentsVerified,
      route: '/(tabs)/profile', // Navigate to profile where documents can be uploaded
    });

    // 6. Bank Account (for payouts)
    const hasBankAccount = bankAccounts && bankAccounts.length > 0;
    items.push({
      id: 'bank-account',
      title: 'Add Bank Account',
      description: 'Set up bank account to receive payouts',
      completed: hasBankAccount,
      route: '/bank-accounts',
    });

    return items;
  }, [chef, user, kitchenId, kitchen, isOnboardingComplete, bankAccounts, documentsSummary]);

  const completedCount = setupItems.filter(item => item.completed).length;
  const totalCount = setupItems.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  useEffect(() => {
    if (isVisible) {
      setIsLoading(false);
    }
  }, [isVisible]);

  const handleItemPress = (item: SetupItem) => {
    if (item.route) {
      onClose();
      // Small delay to allow sheet to close
      setTimeout(() => {
        router.push(item.route as any);
      }, 300);
    } else if (item.onPress) {
      item.onPress();
    }
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top - 8, 0) }]}>
          <Text style={styles.headerTitle}>Complete Your Setup</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Setup Progress</Text>
                <Text style={styles.progressText}>
                  {completedCount} of {totalCount} completed
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${progressPercentage}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>

            {/* Setup Items */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>What's Missing</Text>
              {setupItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.setupItem,
                    index === setupItems.length - 1 && styles.lastItem
                  ]}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemLeft}>
                    <View style={styles.iconContainer}>
                      {item.completed ? (
                        <SvgXml xml={checkIconSVG} width={24} height={24} />
                      ) : (
                        <SvgXml xml={circleIconSVG} width={24} height={24} />
                      )}
                    </View>
                    <View style={styles.itemContent}>
                      <Text style={[
                        styles.itemTitle,
                        item.completed && styles.itemTitleCompleted
                      ]}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemDescription}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  {!item.completed && (
                    <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Help Text */}
            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                Complete these steps to start receiving orders and earning on CribNosh
              </Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Progress Section
  progressSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  progressText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0B9E58',
    borderRadius: 4,
  },
  // Items Section
  itemsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 16,
  },
  setupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lastItem: {
    marginBottom: 0,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  itemTitleCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  itemDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  // Help Section
  helpSection: {
    backgroundColor: '#E6FFE8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  helpText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    textAlign: 'center',
  },
});


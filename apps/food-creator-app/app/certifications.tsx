import { Stack, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const checkIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L7 13L4 10" stroke="#0B9E58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const certificateIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L14 8L20 9L16 13L17 19L12 16L7 19L8 13L4 9L10 8L12 2Z" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function CertificationsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { foodCreator } = useFoodCreatorAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [certifications, setCertifications] = useState<any[]>([]);

  // Get kitchen ID
  const kitchenId = useQuery(
    api.queries.kitchens.getKitchenByChefId,
    foodCreator?._id ? { chefId: foodCreator._id } : 'skip'
  );

  // Get kitchen details
  const kitchen = useQuery(
    api.queries.kitchens.getKitchenById,
    kitchenId ? { kitchenId } : 'skip'
  );

  // Get foodCreator documents (certifications)
  const chefDocuments = useQuery(
    api.queries.chefDocuments.getByChefId,
    foodCreator?._id ? { chefId: foodCreator._id } : 'skip'
  );

  useEffect(() => {
    if (chefDocuments) {
      // Filter for certification-type documents
      const certDocs = chefDocuments.filter((doc: any) => 
        doc.type === 'certification' || 
        doc.type === 'health_permit' ||
        doc.type === 'food_safety_certificate'
      );
      setCertifications(certDocs);
    }
    setIsLoading(false);
  }, [chefDocuments]);

  const handleBack = () => {
    router.back();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Certifications'
        }} 
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <SvgXml xml={backArrowSVG} width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Certifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Kitchen Certification Status */}
          {kitchen && (
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <SvgXml xml={certificateIconSVG} width={24} height={24} />
                <Text style={styles.statusTitle}>Kitchen Certification</Text>
              </View>
              <View style={styles.statusContent}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: kitchen.certified ? '#0B9E5820' : '#6B728020' }
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      { color: kitchen.certified ? '#0B9E58' : '#6B7280' }
                    ]}>
                      {kitchen.certified ? 'Certified' : 'Not Certified'}
                    </Text>
                  </View>
                </View>
                {kitchen.certified && (
                  <Text style={styles.statusDescription}>
                    Your kitchen has been certified and meets all food safety requirements
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Certifications List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Certifications</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#094327" />
              </View>
            ) : certifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No Certifications</Text>
                <Text style={styles.emptyStateText}>
                  Upload certification documents to verify your kitchen's compliance
                </Text>
              </View>
            ) : (
              certifications.map((cert: any) => (
                <View key={cert._id} style={styles.certCard}>
                  <View style={styles.certHeader}>
                    <View style={styles.certLeft}>
                      <View style={styles.certIconContainer}>
                        <SvgXml xml={certificateIconSVG} width={24} height={24} />
                      </View>
                      <View style={styles.certInfo}>
                        <Text style={styles.certName}>
                          {cert.name || cert.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Certification'}
                        </Text>
                        <Text style={styles.certType}>
                          {cert.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Document'}
                        </Text>
                      </View>
                    </View>
                    {cert.verified && (
                      <View style={styles.verifiedBadge}>
                        <SvgXml xml={checkIconSVG} width={16} height={16} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  {cert.uploadedAt && (
                    <Text style={styles.certDate}>
                      Uploaded: {formatDate(cert.uploadedAt)}
                    </Text>
                  )}
                  {cert.verifiedAt && (
                    <Text style={styles.certDate}>
                      Verified: {formatDate(cert.verifiedAt)}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
  },
  statusContent: {
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  statusDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
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
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  certLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  certIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6FFE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  certType: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0B9E5820',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
    color: '#0B9E58',
  },
  certDate: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
});


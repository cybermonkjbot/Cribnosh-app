import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle, FileText, Upload, XCircle } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const checkIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L7 13L4 10" stroke="#0B9E58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const warningIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2L2 18H18L10 2Z" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 12V8" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 14H10.01" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const certificateIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2L12 8L18 9L14 13L15 19L10 16L5 19L6 13L2 9L8 8L10 2Z" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Required compliance document types
const REQUIRED_DOCUMENTS = [
  { type: 'fba' as const, name: 'Food Business Approval (FBA)', isRequired: true },
  { type: 'health_permit' as const, name: 'Health Permit', isRequired: true },
  { type: 'insurance' as const, name: 'Insurance Certificate', isRequired: true },
  { type: 'kitchen_cert' as const, name: 'Kitchen Certification', isRequired: true },
];

export default function FoodSafetyComplianceScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { foodCreator, sessionToken } = useFoodCreatorAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [complianceStatus, setComplianceStatus] = useState<'compliant' | 'pending' | 'non-compliant'>('pending');
  const [certified, setCertified] = useState(false);
  const [inspectionDates, setInspectionDates] = useState<string[]>([]);
  const [lastInspectionDate, setLastInspectionDate] = useState<string | null>(null);
  const [nextInspectionDue, setNextInspectionDue] = useState<string | null>(null);

  // Get kitchen ID for the current foodCreator
  const kitchenId = useQuery(
    api.queries.kitchens.getKitchenByChefId,
    foodCreator?._id ? { chefId: foodCreator._id } : 'skip'
  );

  // Get kitchen details
  const kitchen = useQuery(
    api.queries.kitchens.getKitchenById,
    kitchenId ? { kitchenId } : 'skip'
  );

  // Get foodCreator documents
  const documents = useQuery(
    api.queries.chefDocuments.getByChefId,
    foodCreator?._id && sessionToken ? { chefId: foodCreator._id, sessionToken } : 'skip'
  );

  // Map documents by type for easy lookup
  const documentsByType = useMemo(() => {
    if (!documents) return {};
    const map: Record<string, typeof documents[0]> = {};
    documents.forEach((doc: any) => {
      map[doc.documentType] = doc;
    });
    return map;
  }, [documents]);

  // Get document status for each required document
  const documentStatuses = useMemo(() => {
    return REQUIRED_DOCUMENTS.map(reqDoc => {
      const existingDoc = documentsByType[reqDoc.type];
      return {
        ...reqDoc,
        status: existingDoc?.status || 'missing',
        document: existingDoc,
      };
    });
  }, [documentsByType]);

  useEffect(() => {
    if (kitchen) {
      setCertified(kitchen.certified || false);
      setInspectionDates(kitchen.inspectionDates || []);

      // Determine compliance status
      if (kitchen.certified) {
        setComplianceStatus('compliant');
      } else if (kitchen.inspectionDates && kitchen.inspectionDates.length > 0) {
        setComplianceStatus('pending');
      } else {
        setComplianceStatus('non-compliant');
      }

      // Set last inspection date
      if (kitchen.inspectionDates && kitchen.inspectionDates.length > 0) {
        const sortedDates = [...kitchen.inspectionDates].sort().reverse();
        setLastInspectionDate(sortedDates[0]);

        // Calculate next inspection due (assuming annual inspections)
        const lastDate = new Date(sortedDates[0]);
        const nextDate = new Date(lastDate);
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        setNextInspectionDue(nextDate.toISOString().split('T')[0]);
      }
    }
    setIsLoading(false);
  }, [kitchen]);

  const handleBack = () => {
    router.back();
  };

  const handleViewCertifications = () => {
    router.push('/certifications' as any);
  };

  const handleScheduleInspection = () => {
    router.push('/schedule-inspection' as any);
  };

  const handleUploadDocument = (documentType: string, documentId?: string) => {
    if (documentId) {
      // Navigate to existing document upload screen
      router.push({
        pathname: `/(tabs)/food-creator/onboarding/documents/${documentId}` as any,
        params: { returnPath: '/food-safety-compliance' },
      } as any);
    } else {
      // Navigate to new document upload by type
      router.push({
        pathname: '/(tabs)/food-creator/onboarding/documents/upload',
        params: { type: documentType, returnPath: '/food-safety-compliance' },
      } as any);
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={20} color="#0B9E58" />;
      case 'rejected':
        return <XCircle size={20} color="#EF4444" />;
      case 'pending':
        return <FileText size={20} color="#FF6B35" />;
      default:
        return <Upload size={20} color="#6B7280" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#0B9E58';
      case 'rejected':
        return '#EF4444';
      case 'pending':
        return '#FF6B35';
      default:
        return '#6B7280';
    }
  };

  const getDocumentStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending Review';
      default:
        return 'Not Uploaded';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = () => {
    switch (complianceStatus) {
      case 'compliant':
        return '#0B9E58';
      case 'pending':
        return '#FF6B35';
      case 'non-compliant':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (complianceStatus) {
      case 'compliant':
        return 'Compliant';
      case 'pending':
        return 'Pending Review';
      case 'non-compliant':
        return 'Action Required';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Food Safety Compliance'
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
          <Text style={styles.mainTitle}>Food Safety Compliance</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#094327" />
            </View>
          ) : (
            <>
              {/* Compliance Status Card */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <Text style={styles.statusTitle}>Compliance Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
                      {getStatusText()}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusContent}>
                  {complianceStatus === 'compliant' ? (
                    <View style={styles.statusRow}>
                      <SvgXml xml={checkIconSVG} width={20} height={20} />
                      <Text style={styles.statusText}>Your kitchen is fully compliant with food safety regulations</Text>
                    </View>
                  ) : complianceStatus === 'pending' ? (
                    <View style={styles.statusRow}>
                      <SvgXml xml={warningIconSVG} width={20} height={20} />
                      <Text style={styles.statusText}>Your compliance status is under review</Text>
                    </View>
                  ) : (
                    <View style={styles.statusRow}>
                      <SvgXml xml={warningIconSVG} width={20} height={20} />
                      <Text style={styles.statusText}>Action required to achieve compliance</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Certification Status */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Certification</Text>
                </View>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Certified Kitchen</Text>
                    <View style={[styles.certifiedBadge, { backgroundColor: certified ? '#0B9E5820' : '#6B728020' }]}>
                      <Text style={[styles.certifiedText, { color: certified ? '#0B9E58' : '#6B7280' }]}>
                        {certified ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </View>
                  {certified && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleViewCertifications}
                      activeOpacity={0.7}
                    >
                      <SvgXml xml={certificateIconSVG} width={20} height={20} />
                      <Text style={styles.actionButtonText}>View Certifications</Text>
                      <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Inspection History */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Inspections</Text>
                </View>
                <View style={styles.infoCard}>
                  {lastInspectionDate ? (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Last Inspection</Text>
                        <Text style={styles.infoValue}>{formatDate(lastInspectionDate)}</Text>
                      </View>
                      {nextInspectionDue && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Next Inspection Due</Text>
                          <Text style={styles.infoValue}>{formatDate(nextInspectionDue)}</Text>
                        </View>
                      )}
                      {inspectionDates.length > 1 && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Total Inspections</Text>
                          <Text style={styles.infoValue}>{inspectionDates.length}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No inspections recorded</Text>
                      <TouchableOpacity
                        style={styles.scheduleButton}
                        onPress={handleScheduleInspection}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.scheduleButtonText}>Schedule Inspection</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {/* Required Documents */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Required Documents</Text>
                </View>
                <View style={styles.documentsCard}>
                  {documentStatuses.map((docStatus, index) => (
                    <TouchableOpacity
                      key={docStatus.type}
                      style={[
                        styles.documentItem,
                        index === documentStatuses.length - 1 && styles.documentItemLast
                      ]}
                      onPress={() => handleUploadDocument(docStatus.type, docStatus.document?._id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.documentItemLeft}>
                        {getDocumentStatusIcon(docStatus.status)}
                        <View style={styles.documentItemInfo}>
                          <Text style={styles.documentItemName}>{docStatus.name}</Text>
                          <Text style={[styles.documentItemStatus, { color: getDocumentStatusColor(docStatus.status) }]}>
                            {getDocumentStatusText(docStatus.status)}
                          </Text>
                        </View>
                      </View>
                      <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Quick Actions</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={handleScheduleInspection}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>Schedule Inspection</Text>
                    <Text style={styles.actionDescription}>
                      Request a food safety inspection for your kitchen
                    </Text>
                  </View>
                  <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
                </TouchableOpacity>
              </View>
            </>
          )}
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
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    color: '#094327',
    textAlign: 'left',
    marginTop: 20,
    marginBottom: 32,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Status Card
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statusContent: {
    marginTop: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    flex: 1,
  },
  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
  },
  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  infoValue: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  certifiedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  certifiedText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    flex: 1,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 16,
  },
  scheduleButton: {
    backgroundColor: '#094327',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scheduleButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  // Action Card
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionContent: {
    flex: 1,
    marginRight: 16,
  },
  actionTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  actionDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  // Documents Card
  documentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  documentItemLast: {
    borderBottomWidth: 0,
  },
  documentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  documentItemInfo: {
    flex: 1,
  },
  documentItemName: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    marginBottom: 4,
  },
  documentItemStatus: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
  },
});


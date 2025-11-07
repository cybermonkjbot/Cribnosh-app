import { useCallback, useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';
import { FamilyMember } from '@/types/customer';
import { DollarSign, Heart, Package } from 'lucide-react-native';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface FamilyMemberDetailSheetProps {
  isVisible: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  isLoading?: boolean;
  onNavigateToBudget?: (memberId: string) => void;
  onNavigateToPreferences?: (memberId: string) => void;
  onNavigateToOrders?: (memberId: string) => void;
}

export function FamilyMemberDetailSheet({
  isVisible,
  onClose,
  member,
  isLoading = false,
  onNavigateToBudget,
  onNavigateToPreferences,
  onNavigateToOrders,
}: FamilyMemberDetailSheetProps) {
  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <BottomSheetBase
      snapPoints={snapPoints}
      index={0}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backgroundStyle={{
        backgroundColor: '#FAFFFA',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Member Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
            <Text style={styles.loadingText}>Loading member details...</Text>
          </View>
        ) : !member ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Member not found</Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.memberHeader}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitials}>
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRelationship}>{member.relationship}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.memberStatus}>
                  {member.status === 'accepted' ? 'Active' : member.status.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  if (onNavigateToBudget) {
                    onNavigateToBudget(member.id);
                    onClose();
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <DollarSign size={24} color="#094327" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Budget Settings</Text>
                  <Text style={styles.actionDescription}>Manage spending limits</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  if (onNavigateToPreferences) {
                    onNavigateToPreferences(member.id);
                    onClose();
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Heart size={24} color="#094327" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Preferences</Text>
                  <Text style={styles.actionDescription}>Allergies and dietary preferences</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  if (onNavigateToOrders) {
                    onNavigateToOrders(member.id);
                    onClose();
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Package size={24} color="#094327" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Order History</Text>
                  <Text style={styles.actionDescription}>View all orders placed by this member</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  memberHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  memberAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#094327',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInitials: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  memberName: {
    color: '#094327',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: 'Archivo',
  },
  memberRelationship: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  memberStatus: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  actionDescription: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
});


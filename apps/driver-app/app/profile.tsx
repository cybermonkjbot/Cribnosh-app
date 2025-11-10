import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import EarningsIllustration from '../assets/depictions/undraw_key-insights_ex8y.svg';

export default function DriverProfileScreen() {
  const router = useRouter();
  const { driver, user, logout, isLoading } = useDriverAuth();

  const handleBack = () => {
    router.back();
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleViewDocuments = () => {
    router.push('/documents');
  };

  const handleViewWithdrawals = () => {
    router.push('/withdrawals');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading profile...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if no driver data
  if (!driver || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Unable to load profile data</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/login')}>
            <ThemedText style={styles.retryButtonText}>Go to Login</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Format earnings display
  const formatEarnings = (earnings?: number): string => {
    if (!earnings || earnings === 0) return '₦0';
    return `₦${earnings.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return Colors.light.accent;
      case 'PENDING_APPROVAL':
        return Colors.light.warning;
      case 'REJECTED':
        return Colors.light.error;
      default:
        return Colors.light.icon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'PENDING_APPROVAL':
        return 'Pending Approval';
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Profile</ThemedText>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <ThemedView style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={48} color={Colors.light.primary} />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText type="subtitle" style={styles.profileName}>
                {user.fullName || 'Driver'}
              </ThemedText>
              <ThemedText style={styles.profilePhone}>{user.phone}</ThemedText>
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status || 'PENDING_APPROVAL') + '20' }]}>
                  <ThemedText style={[styles.statusText, { color: getStatusColor(driver.status || 'PENDING_APPROVAL') }]}>
                    {getStatusText(driver.status || 'PENDING_APPROVAL')}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>

          {/* Earnings Card */}
          <TouchableOpacity 
            style={styles.earningsCard} 
            onPress={handleViewWithdrawals}
            activeOpacity={0.7}
          >
            <View style={styles.earningsCardContent}>
              <View style={styles.earningsIllustrationContainer}>
                <EarningsIllustration width={100} height={80} />
              </View>
              <View style={styles.earningsInfo}>
                <ThemedText style={styles.earningsLabel}>Total Earnings</ThemedText>
                <ThemedText type="title" style={styles.earningsAmount}>
                  {formatEarnings(driver.totalEarnings)}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.light.primary} />
            </View>
          </TouchableOpacity>

          {/* Personal Information */}
          <ThemedView style={styles.sectionCard}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Personal Information</ThemedText>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person-outline" size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Full Name</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                    {user.fullName || 'Driver'}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="call-outline" size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Phone Number</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>{user.phone}</ThemedText>
                </View>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="mail-outline" size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Email</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>{user.email}</ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>

          {/* Vehicle Information */}
          <ThemedView style={styles.sectionCard}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Vehicle Information</ThemedText>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="car-outline" size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Vehicle Type</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>{driver.vehicleType || 'Not specified'}</ThemedText>
                </View>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="speedometer-outline" size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Model</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>{driver.vehicleModel || 'Not specified'}</ThemedText>
                </View>
              </View>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="document-text-outline" size={22} color={Colors.light.primary} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>License Plate</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>{driver.licenseNumber || 'Not specified'}</ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>

          {/* Menu Items */}
          <ThemedView style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={handleViewDocuments}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.light.primary} />
                </View>
                <ThemedText type="default" style={styles.menuText}>Documents</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleViewWithdrawals}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="wallet-outline" size={20} color={Colors.light.primary} />
                </View>
                <ThemedText type="default" style={styles.menuText}>Withdrawals</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="settings-outline" size={20} color={Colors.light.primary} />
                </View>
                <ThemedText type="default" style={styles.menuText}>Settings</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons name="log-out-outline" size={20} color={Colors.light.error} />
                </View>
                <ThemedText type="default" style={[styles.menuText, { color: Colors.light.error }]}>Logout</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  profilePhone: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  statCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsCard: {
    width: '100%',
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  earningsIllustrationContainer: {
    width: 100,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  earningsInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    textAlign: 'center',
    width: '100%',
  },
  sectionCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'left',
  },
  infoList: {
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
    textAlign: 'left',
  },
  infoValue: {
    fontSize: 15,
    textAlign: 'left',
  },
  menuSection: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
  },
});

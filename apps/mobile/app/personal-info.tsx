import { ProfileAvatar } from '@/components/ProfileAvatar';
import { AddressSelectionSheet } from '@/components/ui/AddressSelectionSheet';
import {
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
} from '@/store/customerApi';
import { CustomerAddress } from '@/types/customer';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

const houseIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 10L10 3L17 10V17C17 17.5523 16.5523 18 16 18H4C3.44772 18 3 17.5523 3 17V10Z" fill="#707070"/>
  <rect x="7" y="12" width="6" height="6" fill="#707070"/>
</svg>`;

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isAddressSheetVisible, setIsAddressSheetVisible] = useState(false);
  const [addressSheetMode, setAddressSheetMode] = useState<'home' | 'work' | null>(null);
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | undefined>();

  // Fetch profile data from API
  const { data: profileData, isLoading } = useGetCustomerProfileQuery(undefined, {
    skip: false,
  });

  const [updateProfile] = useUpdateCustomerProfileMutation();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState<CustomerAddress | undefined>();

  // Initialize form from API data
  useEffect(() => {
    if (profileData?.data) {
      setName(profileData.data.name || '');
      setEmail(profileData.data.email || '');
      setPhone(profileData.data.phone || '');
      setAddress(profileData.data.address);
      setSelectedProfileImage(profileData.data.picture);
    }
  }, [profileData]);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Name is required.',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        name: name.trim(),
      };

      if (email.trim()) {
        updateData.email = email.trim();
      }

      if (phone.trim()) {
        updateData.phone = phone.trim();
      }

      if (selectedProfileImage && selectedProfileImage !== profileData?.data?.picture) {
        updateData.picture = selectedProfileImage;
      }

      if (address) {
        updateData.address = address;
      }

      await updateProfile(updateData).unwrap();
      
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal information has been updated successfully.',
        duration: 3000,
      });
      
      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        'Failed to update profile. Please try again.';
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageSelected = (imageUri: string) => {
    setSelectedProfileImage(imageUri);
  };

  const handleAddressSelect = (selectedAddress: CustomerAddress) => {
    setAddress(selectedAddress);
    setIsAddressSheetVisible(false);
    setAddressSheetMode(null);
  };

  const handleEditAddress = (mode: 'home' | 'work') => {
    setAddressSheetMode(mode);
    setIsAddressSheetVisible(true);
  };

  const formatAddress = (addr?: CustomerAddress): string => {
    if (!addr) return 'No address';
    const parts = [addr.street, addr.city, addr.state, addr.postal_code].filter(Boolean);
    return parts.join(', ') || 'No address';
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: 'Personal Info',
          }}
        />
        <SafeAreaView style={styles.mainContainer}>
          <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Personal Info',
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
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#094327" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text style={styles.mainTitle}>Personal Info</Text>

          {/* Profile Picture Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <ProfileAvatar
                size={80}
                onImageSelected={handleProfileImageSelected}
                selectedImageUri={selectedProfileImage}
              />
            </View>
            <Text style={styles.profileHint}>Tap to change profile picture</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Address Section */}
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Address</Text>
            <TouchableOpacity
              style={styles.addressItem}
              onPress={() => handleEditAddress('home')}
              activeOpacity={0.7}
            >
              <View style={styles.addressItemLeft}>
                <View style={styles.addressIcon}>
                  <SvgXml xml={houseIconSVG} width={20} height={20} />
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>Home</Text>
                  <Text style={styles.addressText}>{formatAddress(address)}</Text>
                </View>
              </View>
              <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Address Selection Sheet */}
        {addressSheetMode && (
          <AddressSelectionSheet
            isVisible={isAddressSheetVisible}
            onClose={() => {
              setIsAddressSheetVisible(false);
              setAddressSheetMode(null);
            }}
            onSelectAddress={handleAddressSelect}
            selectedAddress={address}
            addressLabel={addressSheetMode}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    flex: 1,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  profileHint: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  formSection: {
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 16,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  addressText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
});


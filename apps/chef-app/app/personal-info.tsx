import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ProfileUpdateOTPModal } from '@/components/ui/ProfileUpdateOTPModal';
import { AvailabilityCalendar } from '@/components/ui/AvailabilityCalendar';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useProfile } from '@/hooks/useProfile';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToast } from '../lib/ToastContext';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

type TabType = 'chef' | 'kitchen' | 'availability';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { chef, user, sessionToken: authSessionToken, isAuthenticated } = useChefAuth();
  const [activeTab, setActiveTab] = useState<TabType>('chef');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Chef Settings state
  const [selectedProfileImage, setSelectedProfileImage] = useState<string | undefined>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [profileData, setProfileData] = useState<any>(null);
  const [city, setCity] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number]>([0, 0]);

  // Kitchen Settings state
  const [kitchenName, setKitchenName] = useState('');
  const [kitchenAddress, setKitchenAddress] = useState('');
  const [kitchenImages, setKitchenImages] = useState<string[]>([]);
  const [isEditingKitchen, setIsEditingKitchen] = useState(false);
  const [isUploadingKitchenImage, setIsUploadingKitchenImage] = useState(false);

  // Availability Settings state
  const [isAvailable, setIsAvailable] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [availableHours, setAvailableHours] = useState<Record<string, Array<{ start: string; end: string }>>>({});
  const [unavailableDates, setUnavailableDates] = useState<number[]>([]);
  const [maxOrdersPerDay, setMaxOrdersPerDay] = useState(10);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(7);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [timePickerState, setTimePickerState] = useState<{
    visible: boolean;
    day: string | null;
    rangeIndex: number | null;
    field: 'start' | 'end' | null;
  }>({ visible: false, day: null, rangeIndex: null, field: null });

  // OTP Modal state
  const [isOTPModalVisible, setIsOTPModalVisible] = useState(false);
  const [otpModalType, setOtpModalType] = useState<'phone' | 'email'>('phone');
  const [pendingPhone, setPendingPhone] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // Track original values to detect changes
  const originalEmail = useRef<string>('');
  const originalPhone = useRef<string>('');

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
    loadToken();
  }, [authSessionToken]);

  // Get kitchen ID and details
  const kitchenId = useQuery(
    api.queries.kitchens.getKitchenByChefId,
    chef?._id ? { chefId: chef._id } : 'skip'
  );

  const kitchenDetails = useQuery(
    api.queries.kitchens.getKitchenDetails,
    kitchenId ? { kitchenId } : 'skip'
  );

  const kitchenDoc = useQuery(
    api.queries.kitchens.getKitchenById,
    kitchenId ? { kitchenId } : 'skip'
  );

  // Mutations
  const updateChef = useMutation(api.mutations.chefs.update);
  const updateAvailability = useMutation(api.mutations.chefs.updateAvailability);
  const saveOnboardingDraft = useMutation(api.mutations.chefs.saveOnboardingDraft);
  const createKitchen = useMutation(api.mutations.kitchens.createKitchen);
  const updateKitchen = useMutation(api.mutations.kitchens.updateKitchen);
  const {
    getCustomerProfile,
    updateCustomerProfile,
    uploadProfileImage,
    sendPhoneEmailOTP,
    verifyPhoneEmailOTP,
    isLoading: profileLoading,
  } = useProfile();

  // Load chef and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Get user profile
        const result = await getCustomerProfile();
        if (result.success && result.data?.user) {
          setProfileData({ data: { user: result.data.user } });
          const user = result.data.user;
          setName(user.name || '');
          const userEmail = user.email || '';
          const userPhone = user.phone || user.phone_number || '';
          setEmail(userEmail);
          setPhone(userPhone);
          originalEmail.current = userEmail;
          originalPhone.current = userPhone;
          
          const imageUrl = user.picture || user.avatar;
          const absoluteImageUrl = getAbsoluteImageUrl(imageUrl);
          setSelectedProfileImage(absoluteImageUrl);
        }

        // Get chef data
        if (chef) {
          setBio(chef.bio || '');
          setSpecialties(chef.specialties || []);
          setCity(chef.location?.city || '');
          setCoordinates(chef.location?.coordinates as [number, number] || [0, 0]);
          setIsAvailable(chef.isAvailable || false);
          setAvailableDays(chef.availableDays || []);
          setAvailableHours((chef.availableHours as any) || {});
          setUnavailableDates((chef.unavailableDates as any) || []);
          setMaxOrdersPerDay(chef.maxOrdersPerDay || 10);
          setAdvanceBookingDays(chef.advanceBookingDays || 7);
          setSpecialInstructions(chef.specialInstructions || '');
          if (chef.profileImage) {
            const chefImageUrl = getAbsoluteImageUrl(chef.profileImage);
            if (!selectedProfileImage) {
              setSelectedProfileImage(chefImageUrl);
            }
          }
        }

        // Get kitchen data
        if (kitchenDetails) {
          setKitchenName(kitchenDetails.kitchenName || '');
          setKitchenAddress(kitchenDetails.address || '');
        }

        // Load kitchen images
        if (kitchenDoc?.images) {
          const loadImageUrls = async () => {
            const imageUrls = await Promise.all(
              kitchenDoc.images!.map(img => getImageUrl(img))
            );
            setKitchenImages(imageUrls);
          };
          loadImageUrls();
        } else if (chef?.onboardingDraft?.kitchenName) {
          setKitchenName(chef.onboardingDraft.kitchenName);
          setKitchenAddress(chef.onboardingDraft.kitchenAddress || '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [chef, kitchenDetails, kitchenDoc, isAuthenticated, getCustomerProfile]);

  const getImageUrl = async (imageIdOrUrl: string): Promise<string> => {
    if (imageIdOrUrl.startsWith('http://') || imageIdOrUrl.startsWith('https://')) {
      return imageIdOrUrl;
    }
    try {
      const convex = getConvexClient();
      const url = await convex.storage.getUrl(imageIdOrUrl as any);
      return url || imageIdOrUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return imageIdOrUrl;
    }
  };

  const uploadImage = async (imageUri: string): Promise<string | null> => {
    try {
      const convex = getConvexClient();
      const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': blob.type || 'image/jpeg',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      const storageId = uploadResult.storageId || uploadResult;
      const fileUrl = await convex.storage.getUrl(storageId);
      return fileUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSaveChefSettings = async () => {
    if (!name.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Name is required.',
        duration: 3000,
      });
      return;
    }

    // Check if phone or email has changed
    const emailChanged = email.trim() !== originalEmail.current;
    const phoneChanged = phone.trim() !== originalPhone.current;

    // If phone or email changed, trigger OTP verification
    if (emailChanged || phoneChanged) {
      if (emailChanged) {
        setOtpModalType('email');
        setPendingEmail(email.trim());
        setIsOTPModalVisible(true);
      } else if (phoneChanged) {
        setOtpModalType('phone');
        setPendingPhone(phone.trim());
        setIsOTPModalVisible(true);
      }
      return;
    }

    // No phone/email changes, proceed with normal save
    await performSaveChefSettings();
  };

  const performSaveChefSettings = async () => {
    if (!chef?._id || !sessionToken) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Chef profile not found',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = selectedProfileImage;

      // Check if selectedProfileImage is a local URI that needs to be uploaded
      const currentPicture = profileData?.data?.user?.picture || profileData?.data?.user?.avatar || chef.profileImage;
      const isLocalUri = selectedProfileImage && 
        selectedProfileImage !== currentPicture &&
        (selectedProfileImage.startsWith('file://') || 
         selectedProfileImage.startsWith('content://') ||
         selectedProfileImage.startsWith('ph://') ||
         selectedProfileImage.startsWith('assets-library://'));

      // If it's a local URI, upload it first
      if (isLocalUri) {
        try {
          let imageType = 'image/jpeg';
          if (selectedProfileImage.includes('.png')) {
            imageType = 'image/png';
          } else if (selectedProfileImage.includes('.webp')) {
            imageType = 'image/webp';
          }

          const uploadResult = await uploadProfileImage(selectedProfileImage, imageType);
          imageUrl = uploadResult.data?.profile_image_url || uploadResult.data?.profile_image;
          
          if (!imageUrl) {
            throw new Error('Failed to get image URL from upload response');
          }
        } catch (uploadError: any) {
          console.error('Error uploading profile image:', uploadError);
          showToast({
            type: 'error',
            title: 'Upload Failed',
            message: uploadError?.message || 'Failed to upload profile image. Please try again.',
            duration: 4000,
          });
          setIsSaving(false);
          return;
        }
      }

      // Update user profile (name, email, phone)
      const updateData: any = {
        name: name.trim(),
      };

      if (email.trim() && email.trim() === originalEmail.current) {
        updateData.email = email.trim();
      }

      if (phone.trim() && phone.trim() === originalPhone.current) {
        updateData.phone = phone.trim();
      }

      if (imageUrl && imageUrl !== currentPicture) {
        updateData.picture = imageUrl;
      }

      await updateCustomerProfile(updateData);

      // Update chef profile (bio, specialties, profileImage, location)
      const chefUpdates: any = {
        bio: bio.trim(),
        specialties: specialties,
      };

      if (imageUrl && imageUrl !== chef.profileImage) {
        chefUpdates.profileImage = imageUrl;
      }

      // Update location if city or coordinates changed
      if (city.trim() && coordinates[0] !== 0 && coordinates[1] !== 0) {
        chefUpdates.location = {
          city: city.trim(),
          coordinates: coordinates,
        };
      }

      await updateChef({
        chefId: chef._id,
        updates: chefUpdates,
        sessionToken,
      });

      showToast({
        type: 'success',
        title: 'Success',
        message: 'Chef settings updated successfully',
        duration: 3000,
      });

      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: error?.message || 'Failed to update profile. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveKitchenSettings = async () => {
    if (!kitchenAddress.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Kitchen address is required.',
        duration: 3000,
      });
      return;
    }

    if (!user?._id || !sessionToken) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please sign in to update kitchen settings',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    setIsUploadingKitchenImage(true);
    try {
      // Upload images if there are any local URIs
      let uploadedImageUrls: string[] = [];
      if (kitchenImages.length > 0) {
        for (const imageUri of kitchenImages) {
          if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
            uploadedImageUrls.push(imageUri);
          } else {
            const imageUrl = await uploadImage(imageUri);
            if (imageUrl) {
              uploadedImageUrls.push(imageUrl);
            }
          }
        }
      }

      // Save kitchen name to onboarding draft
      if (chef?._id && sessionToken && kitchenName.trim()) {
        try {
          await saveOnboardingDraft({
            chefId: chef._id,
            draft: {
              ...(chef.onboardingDraft || {}),
              kitchenName: kitchenName.trim(),
              kitchenAddress: kitchenAddress.trim(),
            },
            sessionToken,
          });
        } catch (error) {
          console.error('Error saving kitchen name:', error);
        }
      }

      if (kitchenId) {
        await updateKitchen({
          kitchenId,
          address: kitchenAddress.trim(),
          images: uploadedImageUrls,
        });
      } else {
        await createKitchen({
          owner_id: user._id,
          address: kitchenAddress.trim(),
          certified: false,
          images: uploadedImageUrls,
        });
      }

      showToast({
        type: 'success',
        title: 'Success',
        message: 'Kitchen settings updated successfully',
        duration: 3000,
      });

      setIsEditingKitchen(false);
    } catch (error: any) {
      console.error('Error saving kitchen:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to save kitchen settings',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
      setIsUploadingKitchenImage(false);
    }
  };

  const handleSendOTP = async (value: string) => {
    const result = await sendPhoneEmailOTP(
      otpModalType,
      otpModalType === 'phone' ? value : undefined,
      otpModalType === 'email' ? value : undefined
    );
    return result.data;
  };

  const handleOTPVerified = async (otp: string) => {
    const value = otpModalType === 'phone' ? pendingPhone : pendingEmail;
    await verifyPhoneEmailOTP(
      otpModalType,
      otp,
      otpModalType === 'phone' ? value : undefined,
      otpModalType === 'email' ? value : undefined
    );

    if (otpModalType === 'phone') {
      originalPhone.current = pendingPhone;
    } else {
      originalEmail.current = pendingEmail;
    }

    const refreshedResult = await getCustomerProfile();
    if (refreshedResult.success && refreshedResult.data?.user) {
      setProfileData({ data: { user: refreshedResult.data.user } });
    }

    setIsOTPModalVisible(false);
    await performSaveChefSettings();
  };

  const handleProfileImageSelected = (imageUri: string) => {
    setSelectedProfileImage(imageUri);
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Location permission is needed to get your address.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [lat, lng] = [location.coords.latitude, location.coords.longitude];
      
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (reverseGeocode && reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const fullAddress = [
          addr.streetNumber,
          addr.street,
          addr.city,
          addr.region,
          addr.postalCode,
          addr.country,
        ]
          .filter(Boolean)
          .join(', ');
        
        if (fullAddress) {
          setKitchenAddress(fullAddress);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please enter address manually.');
    }
  };

  const handleKitchenImagePick = async () => {
    if (kitchenImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can upload up to 10 kitchen images.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is needed to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setKitchenImages(prev => [...prev, ...newImages].slice(0, 10));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    }
  };

  const handleRemoveKitchenImage = (index: number) => {
    setKitchenImages(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading || profileLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: 'Edit Profile',
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

  const handleSaveAvailabilitySettings = async () => {
    if (!chef?._id || !sessionToken) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Chef profile not found',
        duration: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateAvailability({
        chefId: chef._id,
        updates: {
          isAvailable,
          availableDays,
          availableHours,
          unavailableDates,
          maxOrdersPerDay,
          advanceBookingDays,
          specialInstructions: specialInstructions.trim(),
        },
        sessionToken,
      });

      showToast({
        type: 'success',
        title: 'Success',
        message: 'Availability settings updated successfully',
        duration: 3000,
      });

      router.back();
    } catch (error: any) {
      console.error('Error updating availability:', error);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: error?.message || 'Failed to update availability settings. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (activeTab === 'chef') {
      handleSaveChefSettings();
    } else if (activeTab === 'kitchen') {
      handleSaveKitchenSettings();
    } else {
      handleSaveAvailabilitySettings();
    }
  };

  const handleToggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
      // Remove time ranges for this day
      const newHours = { ...availableHours };
      delete newHours[day];
      setAvailableHours(newHours);
    } else {
      setAvailableDays([...availableDays, day]);
      // Initialize with default time range if not exists
      if (!availableHours[day] || availableHours[day].length === 0) {
        setAvailableHours({
          ...availableHours,
          [day]: [{ start: '10:00', end: '14:00' }],
        });
      }
    }
  };

  const handleAddTimeRange = (day: string) => {
    const currentRanges = availableHours[day] || [];
    setAvailableHours({
      ...availableHours,
      [day]: [...currentRanges, { start: '17:00', end: '21:00' }],
    });
  };

  const handleRemoveTimeRange = (day: string, index: number) => {
    const currentRanges = availableHours[day] || [];
    if (currentRanges.length > 1) {
      setAvailableHours({
        ...availableHours,
        [day]: currentRanges.filter((_, i) => i !== index),
      });
    } else {
      Alert.alert('Cannot Remove', 'Each day must have at least one time range.');
    }
  };

  const handleTimeChange = (day: string, rangeIndex: number, field: 'start' | 'end', time: Date) => {
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    const currentRanges = [...(availableHours[day] || [])];
    currentRanges[rangeIndex] = {
      ...currentRanges[rangeIndex],
      [field]: timeStr,
    };
    
    setAvailableHours({
      ...availableHours,
      [day]: currentRanges,
    });
    
    setTimePickerState({ visible: false, day: null, rangeIndex: null, field: null });
  };

  const handleCopyWeek = () => {
    Alert.alert(
      'Copy Week',
      'This will copy the current week\'s availability settings to all weeks. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            // The availability settings are already week-based, so this is just a confirmation
            showToast({
              type: 'success',
              title: 'Success',
              message: 'Availability settings apply to all weeks',
              duration: 2000,
            });
          },
        },
      ]
    );
  };

  const formatTimeForDisplay = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getTimeDate = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date;
  };

  const handleUseCurrentLocationForCity = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Location permission is needed to get your city.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [lat, lng] = [location.coords.latitude, location.coords.longitude];
      setCoordinates([lat, lng]);
      
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (reverseGeocode && reverseGeocode.length > 0) {
        const addr = reverseGeocode[0];
        const cityName = addr.city || addr.subAdministrativeArea || addr.administrativeArea || '';
        if (cityName) {
          setCity(cityName);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please enter city manually.');
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Edit Profile',
        }}
      />
      <SafeAreaView style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />

        {/* Header */}
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

        {/* Tabs */}
        <View style={styles.tabsWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === 'chef' && styles.tabActive]}
              onPress={() => setActiveTab('chef')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'chef' && styles.tabTextActive]}>
                Chef Settings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'kitchen' && styles.tabActive]}
              onPress={() => setActiveTab('kitchen')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'kitchen' && styles.tabTextActive]}>
                Kitchen Settings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'availability' && styles.tabActive]}
              onPress={() => setActiveTab('availability')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'availability' && styles.tabTextActive]}>
                Availability
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'chef' && (
            <>
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

              {/* Bio Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about your cooking experience and style..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Location Section */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter your city"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={handleUseCurrentLocationForCity}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location" size={20} color="#094327" />
                  <Text style={styles.locationButtonText}>Use Current Location</Text>
                </TouchableOpacity>
              </View>

              {/* Specialties Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Specialties</Text>
                <View style={styles.specialtiesContainer}>
                  {specialties.map((specialty, index) => (
                    <View key={index} style={styles.specialtyChip}>
                      <Text style={styles.specialtyText}>{specialty}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveSpecialty(index)}
                        style={styles.removeSpecialtyButton}
                      >
                        <Ionicons name="close" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <View style={styles.addSpecialtyContainer}>
                  <TextInput
                    style={styles.addSpecialtyInput}
                    value={newSpecialty}
                    onChangeText={setNewSpecialty}
                    placeholder="Add a specialty"
                    placeholderTextColor="#9CA3AF"
                    onSubmitEditing={handleAddSpecialty}
                  />
                  <TouchableOpacity
                    style={styles.addSpecialtyButton}
                    onPress={handleAddSpecialty}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color="#094327" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          
          {activeTab === 'kitchen' && (
            <>
              <Text style={styles.mainTitle}>Kitchen Settings</Text>

              {/* Kitchen Status */}
              {kitchenDetails && (
                <View style={styles.statusCard}>
                  <Text style={styles.statusLabel}>Kitchen Status</Text>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusText}>
                      {kitchenDetails.certified ? 'Certified' : 'Not Certified'}
                    </Text>
                    {kitchenDetails.certified && (
                      <Ionicons name="checkmark-circle" size={20} color="#0B9E58" />
                    )}
                  </View>
                </View>
              )}

              {/* Kitchen Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Kitchen Name</Text>
                <TextInput
                  style={styles.input}
                  value={kitchenName}
                  onChangeText={setKitchenName}
                  placeholder="Enter your kitchen name"
                  placeholderTextColor="#9CA3AF"
                  editable={isEditingKitchen || !kitchenId}
                />
              </View>

              {/* Kitchen Address */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Kitchen Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={kitchenAddress}
                  onChangeText={setKitchenAddress}
                  placeholder="Enter your full kitchen address"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  editable={isEditingKitchen || !kitchenId}
                />
                {(isEditingKitchen || !kitchenId) && (
                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={handleUseCurrentLocation}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location" size={20} color="#094327" />
                    <Text style={styles.locationButtonText}>Use Current Location</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Kitchen Images */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Kitchen Images</Text>
                {(isEditingKitchen || !kitchenId) ? (
                  <>
                    <Text style={styles.fieldHint}>Add up to 10 images of your kitchen</Text>
                    <View style={styles.imagesContainer}>
                      {kitchenImages.map((imageUri, index) => (
                        <View key={index} style={styles.imageWrapper}>
                          <Image source={{ uri: imageUri }} style={styles.image} />
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => handleRemoveKitchenImage(index)}
                          >
                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      
                      {kitchenImages.length < 10 && (
                        <TouchableOpacity
                          style={styles.addImageButton}
                          onPress={handleKitchenImagePick}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={32} color="#6B7280" />
                          <Text style={styles.addImageText}>Add Image</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    {kitchenImages.length > 0 ? (
                      <View style={styles.imagesContainer}>
                        {kitchenImages.map((imageUri, index) => (
                          <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri: imageUri }} style={styles.image} />
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.emptyImagesText}>No kitchen images added yet</Text>
                    )}
                    <TouchableOpacity
                      style={styles.editKitchenButton}
                      onPress={() => setIsEditingKitchen(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.editKitchenButtonText}>Edit Kitchen Settings</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Certification Info */}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color="#6B7280" />
                <Text style={styles.infoText}>
                  Kitchen certification is managed by Cribnosh. Contact support if you need to update your certification status.
                </Text>
              </View>
            </>
          )}
          
          {activeTab === 'availability' && (
            <>
              <Text style={styles.mainTitle}>Availability Settings</Text>

              {/* Availability Toggle */}
              <View style={styles.fieldContainer}>
                <View style={styles.toggleContainer}>
                  <Text style={styles.fieldLabel}>Available for Orders</Text>
                  <TouchableOpacity
                    style={[styles.toggle, isAvailable && styles.toggleActive]}
                    onPress={() => setIsAvailable(!isAvailable)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.toggleThumb, isAvailable && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.fieldHint}>
                  When enabled, customers can place orders with you
                </Text>
              </View>

              {/* Available Days */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Available Days</Text>
                <Text style={styles.fieldHint}>Select the days you're available to take orders</Text>
                <View style={styles.daysContainer}>
                  {daysOfWeek.map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayChip, isSelected && styles.dayChipActive]}
                        onPress={() => handleToggleDay(day)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dayChipText, isSelected && styles.dayChipTextActive]}>
                          {day.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Time Ranges for Selected Days */}
              {availableDays.map((day) => {
                const timeRanges = availableHours[day] || [];
                return (
                  <View key={day} style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>{day} Hours</Text>
                    <Text style={styles.fieldHint}>Set time ranges for {day}</Text>
                    {timeRanges.map((range, index) => (
                      <View key={index} style={styles.timeRangeContainer}>
                        <TouchableOpacity
                          style={styles.timePickerButton}
                          onPress={() => setTimePickerState({ visible: true, day, rangeIndex: index, field: 'start' })}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="time-outline" size={20} color="#094327" />
                          <Text style={styles.timePickerText}>{formatTimeForDisplay(range.start)}</Text>
                        </TouchableOpacity>
                        <Text style={styles.timeRangeSeparator}>to</Text>
                        <TouchableOpacity
                          style={styles.timePickerButton}
                          onPress={() => setTimePickerState({ visible: true, day, rangeIndex: index, field: 'end' })}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="time-outline" size={20} color="#094327" />
                          <Text style={styles.timePickerText}>{formatTimeForDisplay(range.end)}</Text>
                        </TouchableOpacity>
                        {timeRanges.length > 1 && (
                          <TouchableOpacity
                            style={styles.removeTimeRangeButton}
                            onPress={() => handleRemoveTimeRange(day, index)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.addTimeRangeButton}
                      onPress={() => handleAddTimeRange(day)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add-circle-outline" size={20} color="#094327" />
                      <Text style={styles.addTimeRangeText}>Add Another Time Range</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Unavailable Dates */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Unavailable Dates</Text>
                <Text style={styles.fieldHint}>Mark specific dates as unavailable (holidays, personal days)</Text>
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => setShowCalendar(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color="#094327" />
                  <Text style={styles.calendarButtonText}>
                    {unavailableDates.length > 0
                      ? `${unavailableDates.length} date${unavailableDates.length !== 1 ? 's' : ''} marked`
                      : 'Select Unavailable Dates'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Copy Week */}
              <View style={styles.fieldContainer}>
                <TouchableOpacity
                  style={styles.copyWeekButton}
                  onPress={handleCopyWeek}
                  activeOpacity={0.7}
                >
                  <Ionicons name="copy-outline" size={20} color="#094327" />
                  <Text style={styles.copyWeekButtonText}>Copy Week Settings</Text>
                </TouchableOpacity>
                <Text style={styles.fieldHint}>
                  Copy current availability settings to apply to all weeks
                </Text>
              </View>

              {/* Max Orders Per Day */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Max Orders Per Day</Text>
                <Text style={styles.fieldHint}>Maximum number of orders you can accept per day</Text>
                <TextInput
                  style={styles.input}
                  value={maxOrdersPerDay.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (!isNaN(num) && num > 0) {
                      setMaxOrdersPerDay(num);
                    }
                  }}
                  placeholder="10"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>

              {/* Advance Booking Days */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Advance Booking Days</Text>
                <Text style={styles.fieldHint}>How many days in advance customers can book orders</Text>
                <TextInput
                  style={styles.input}
                  value={advanceBookingDays.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (!isNaN(num) && num > 0) {
                      setAdvanceBookingDays(num);
                    }
                  }}
                  placeholder="7"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                />
              </View>

              {/* Special Instructions */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Special Instructions</Text>
                <Text style={styles.fieldHint}>Any special instructions for customers (e.g., delivery notes, preparation time)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={specialInstructions}
                  onChangeText={setSpecialInstructions}
                  placeholder="Add any special instructions for customers..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </>
          )}
        </ScrollView>

        {/* OTP Verification Modal */}
        <ProfileUpdateOTPModal
          isVisible={isOTPModalVisible}
          onClose={() => setIsOTPModalVisible(false)}
          type={otpModalType}
          currentValue={otpModalType === 'phone' ? originalPhone.current : originalEmail.current}
          newValue={otpModalType === 'phone' ? pendingPhone : pendingEmail}
          onSendOTP={handleSendOTP}
          onOTPVerified={handleOTPVerified}
        />

        {/* Availability Calendar Modal */}
        <AvailabilityCalendar
          visible={showCalendar}
          unavailableDates={unavailableDates}
          onDatesChange={setUnavailableDates}
          onClose={() => setShowCalendar(false)}
        />

        {/* Time Picker */}
        {timePickerState.visible && timePickerState.day && timePickerState.rangeIndex !== null && timePickerState.field && (
          <DateTimePicker
            value={getTimeDate(availableHours[timePickerState.day]?.[timePickerState.rangeIndex]?.[timePickerState.field] || '10:00')}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              if (Platform.OS === 'android') {
                setTimePickerState({ visible: false, day: null, rangeIndex: null, field: null });
              }
              if (selectedTime && timePickerState.day && timePickerState.rangeIndex !== null && timePickerState.field) {
                handleTimeChange(timePickerState.day, timePickerState.rangeIndex, timePickerState.field, selectedTime);
              }
            }}
            onTouchCancel={() => setTimePickerState({ visible: false, day: null, rangeIndex: null, field: null })}
          />
        )}
        {Platform.OS === 'ios' && timePickerState.visible && (
          <View style={styles.timePickerModal}>
            <View style={styles.timePickerModalContent}>
              <View style={styles.timePickerModalHeader}>
                <TouchableOpacity
                  onPress={() => setTimePickerState({ visible: false, day: null, rangeIndex: null, field: null })}
                >
                  <Text style={styles.timePickerModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.timePickerModalTitle}>Select Time</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (timePickerState.day && timePickerState.rangeIndex !== null && timePickerState.field) {
                      const currentTime = availableHours[timePickerState.day]?.[timePickerState.rangeIndex]?.[timePickerState.field] || '10:00';
                      handleTimeChange(timePickerState.day, timePickerState.rangeIndex, timePickerState.field, getTimeDate(currentTime));
                    }
                  }}
                >
                  <Text style={styles.timePickerModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              {timePickerState.day && timePickerState.rangeIndex !== null && timePickerState.field && (
                <DateTimePicker
                  value={getTimeDate(availableHours[timePickerState.day]?.[timePickerState.rangeIndex]?.[timePickerState.field] || '10:00')}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  onChange={(event, selectedTime) => {
                    if (selectedTime && timePickerState.day && timePickerState.rangeIndex !== null && timePickerState.field) {
                      const hours = String(selectedTime.getHours()).padStart(2, '0');
                      const minutes = String(selectedTime.getMinutes()).padStart(2, '0');
                      const timeStr = `${hours}:${minutes}`;
                      
                      const currentRanges = [...(availableHours[timePickerState.day] || [])];
                      currentRanges[timePickerState.rangeIndex] = {
                        ...currentRanges[timePickerState.rangeIndex],
                        [timePickerState.field]: timeStr,
                      };
                      
                      setAvailableHours({
                        ...availableHours,
                        [timePickerState.day]: currentRanges,
                      });
                    }
                  }}
                />
              )}
            </View>
          </View>
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
    borderBottomColor: '#E5E7EB',
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
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FAFFFA',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 100,
    height: 36,
  },
  tabActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#6B7280',
    lineHeight: 18,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    flexGrow: 1,
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
    marginTop: 16,
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
  fieldHint: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    marginBottom: 12,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specialtyText: {
    fontSize: 12,
    color: '#094327',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  removeSpecialtyButton: {
    padding: 2,
  },
  addSpecialtyContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addSpecialtyInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addSpecialtyButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#094327',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  imageWrapper: {
    width: '47%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F9FAFB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  addImageButton: {
    width: '47%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addImageText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  emptyImagesText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    fontStyle: 'italic',
    marginTop: 12,
  },
  editKitchenButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#094327',
    alignSelf: 'flex-start',
  },
  editKitchenButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: '#FFFFFF',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#094327',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  dayChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 70,
    alignItems: 'center',
  },
  dayChipActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#6B7280',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingVertical: 8,
  },
  timePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timePickerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter',
  },
  timeRangeSeparator: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  removeTimeRangeButton: {
    padding: 4,
  },
  addTimeRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  addTimeRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#094327',
    fontFamily: 'Inter',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter',
  },
  copyWeekButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 8,
  },
  copyWeekButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#094327',
    fontFamily: 'Inter',
  },
  timePickerModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  timePickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  timePickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
  },
  timePickerModalCancel: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  timePickerModalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
  },
});

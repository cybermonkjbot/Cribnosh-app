import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { useUpdateDriverProfileMutation } from '../store/driverApi';
import { logger } from '../utils/Logger';
// Note: FuelType removed - vehicle types are now handled differently in Cribnosh

export default function VehicleScreen() {
  const router = useRouter();
  const { driver } = useDriverAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleType: driver?.vehicleType || '',
    vehicleModel: driver?.vehicleModel || '',
    vehicleYear: driver?.vehicleYear || '',
    licensePlate: driver?.licensePlate || '',
    vehicleColor: driver?.vehicleColor || '',
    vehicleCapacity: driver?.vehicleCapacity || '',
    insuranceProvider: driver?.insuranceProvider || '',
    insuranceExpiry: driver?.insuranceExpiry || '',
  });

  // RTK Query mutations
  const [updateDriverProfile, { isLoading: isUpdating }] = useUpdateDriverProfileMutation();

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!driver?._id) {
      Alert.alert('Error', 'Driver information not found');
      return;
    }

    // Basic validation
    if (!formData.vehicleType.trim()) {
      Alert.alert('Error', 'Vehicle type is required');
      return;
    }

    if (!formData.vehicleModel.trim()) {
      Alert.alert('Error', 'Vehicle model is required');
      return;
    }

    if (!formData.licensePlate.trim()) {
      Alert.alert('Error', 'License plate is required');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateDriverProfile({
        vehicleType: formData.vehicleType.trim(),
        vehicleModel: formData.vehicleModel.trim(),
        vehicleYear: formData.vehicleYear.trim(),
        licensePlate: formData.licensePlate.trim(),
        vehicleColor: formData.vehicleColor.trim(),
        vehicleCapacity: formData.vehicleCapacity.trim(),
        insuranceProvider: formData.insuranceProvider.trim(),
        insuranceExpiry: formData.insuranceExpiry.trim(),
      }).unwrap();

      if (result.success) {
        Alert.alert('Success', 'Vehicle information updated successfully!');
        setIsEditing(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to update vehicle information');
      }
    } catch (error: any) {
      logger.error('Error updating vehicle information:', error);
      Alert.alert('Error', error?.data?.message || 'Failed to update vehicle information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original driver data
    if (driver) {
      setFormData({
        vehicleType: driver.vehicleType || '',
        vehicleModel: driver.vehicleModel || '',
        vehicleYear: driver.vehicleYear || '',
        licensePlate: driver.licensePlate || '',
        vehicleColor: driver.vehicleColor || '',
        vehicleCapacity: driver.vehicleCapacity || '',
        insuranceProvider: driver.insuranceProvider || '',
        insuranceExpiry: driver.insuranceExpiry || '',
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const vehicleTypes = [
    'Sedan',
    'SUV',
    'Truck',
    'Van',
    'Pickup',
    'Motorcycle',
    'Other'
  ];

  // Note: Fuel types removed - not applicable to Cribnosh meal delivery
  const fuelTypesToShow: string[] = [];

  const renderInputField = (
    label: string,
    field: string,
    value: string,
    placeholder: string,
    options?: string[]
  ) => (
    <View style={styles.inputSection}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      {options ? (
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {
            Alert.alert(
              `Select ${label}`,
              '',
              options.map(option => ({
                text: option,
                onPress: () => handleInputChange(field, option)
              }))
            );
          }}
        >
          <ThemedText style={[styles.selectButtonText, !value && styles.placeholderText]}>
            {value || placeholder}
          </ThemedText>
          <Ionicons name="chevron-down" size={20} color={Colors.light.icon} />
        </TouchableOpacity>
      ) : (
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.light.icon}
          value={value}
          onChangeText={(text) => handleInputChange(field, text)}
          editable={isEditing}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Vehicle Information</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Vehicle Overview */}
        <ThemedView style={styles.section}>
          <View style={styles.overviewHeader}>
            <Ionicons name="car" size={32} color={Colors.light.primary} />
            <View style={styles.overviewInfo}>
              <ThemedText type="subtitle" style={styles.overviewTitle}>
                {formData.vehicleType || 'Vehicle Type'}
              </ThemedText>
              <ThemedText style={styles.overviewSubtitle}>
                {formData.vehicleModel || 'Model'} • {formData.licensePlate || 'License Plate'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Vehicle Details */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Vehicle Details</ThemedText>
            {!isEditing && (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Ionicons name="create" size={16} color={Colors.light.primary} />
                <ThemedText style={styles.editButtonText}>Edit</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {renderInputField('Vehicle Type', 'vehicleType', formData.vehicleType, 'Select vehicle type', vehicleTypes)}
          {renderInputField('Vehicle Model', 'vehicleModel', formData.vehicleModel, 'Enter vehicle model')}
          {renderInputField('Vehicle Year', 'vehicleYear', formData.vehicleYear, 'Enter year (e.g., 2020)')}
          {renderInputField('License Plate', 'licensePlate', formData.licensePlate, 'Enter license plate number')}
          {renderInputField('Vehicle Color', 'vehicleColor', formData.vehicleColor, 'Enter vehicle color')}
          {renderInputField('Vehicle Capacity', 'vehicleCapacity', formData.vehicleCapacity, 'Enter capacity (liters)')}
          {/* Fuel Type removed - not applicable to Cribnosh meal delivery */}
        </ThemedView>

        {/* Insurance Information */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Insurance Information</ThemedText>
          {renderInputField('Insurance Provider', 'insuranceProvider', formData.insuranceProvider, 'Enter insurance company')}
          {renderInputField('Insurance Expiry', 'insuranceExpiry', formData.insuranceExpiry, 'Enter expiry date (YYYY-MM-DD)')}
        </ThemedView>

        {/* Action Buttons */}
        {isEditing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              <ThemedText style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Information */}
        <ThemedView style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.light.primary} />
            <ThemedText style={styles.infoTitle}>Important Information</ThemedText>
          </View>
          <ThemedText style={styles.infoText}>
            • Keep your vehicle information up to date for accurate order matching{'\n'}
            • Vehicle capacity affects the types of orders you can accept{'\n'}
            • Insurance information must be current and valid{'\n'}
            • Changes may require re-verification by our team
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
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
    color: Colors.light.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary + '20',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
    marginLeft: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewInfo: {
    marginLeft: 16,
    flex: 1,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  selectButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  placeholderText: {
    color: Colors.light.icon,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.background,
  },
  infoSection: {
    backgroundColor: Colors.light.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
  },
});

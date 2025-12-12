import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SuperButton } from '@/components/ui/SuperButton';
import { useToast } from '@/lib/ToastContext';
import { useFamilyProfile } from '@/hooks/useFamilyProfile';
import { AlertTriangle, Plus, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';

interface Allergy {
  name: string;
  type: 'allergy' | 'intolerance';
  severity: 'mild' | 'moderate' | 'severe';
}

interface DietaryPreferences {
  preferences: string[];
  religious_requirements: string[];
  health_driven: string[];
}

const DIETARY_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten-Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
];

const RELIGIOUS_OPTIONS = [
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
];

const HEALTH_OPTIONS = [
  { value: 'low_sodium', label: 'Low Sodium' },
  { value: 'low_fat', label: 'Low Fat' },
  { value: 'low_calorie', label: 'Low Calorie' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'high_protein', label: 'High Protein' },
];

const COMMON_ALLERGIES = [
  'Peanuts', 'Tree Nuts', 'Milk', 'Eggs', 'Fish', 'Shellfish', 'Soy', 'Wheat',
  'Sesame', 'Mustard', 'Celery', 'Lupin', 'Molluscs', 'Sulphites',
];

export default function MemberPreferencesScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();
  const { getFamilyProfile } = useFamilyProfile();
  const [familyProfileData, setFamilyProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch family profile from Convex
  const fetchFamilyProfile = useCallback(async () => {
    try {
      const result = await getFamilyProfile();
      if (result.success) {
        setFamilyProfileData({
          data: result.data,
        });
      }
    } catch (error: any) {
      console.error('Error fetching family profile:', error);
    }
  }, [getFamilyProfile]);

  useEffect(() => {
    fetchFamilyProfile();
  }, [fetchFamilyProfile]);

  const member = familyProfileData?.data?.family_members.find((m) => m.id === id);
  const [parentControlled, setParentControlled] = useState(true);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [dietaryPrefs, setDietaryPrefs] = useState<DietaryPreferences>({
    preferences: [],
    religious_requirements: [],
    health_driven: [],
  });

  // UI state
  const [showAddAllergy, setShowAddAllergy] = useState(false);
  const [newAllergyName, setNewAllergyName] = useState('');
  const [newAllergyType, setNewAllergyType] = useState<'allergy' | 'intolerance'>('allergy');
  const [newAllergySeverity, setNewAllergySeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [expandedSections, setExpandedSections] = useState({
    allergies: true,
    dietary: true,
    religious: false,
    health: false,
  });

  useEffect(() => {
    if (member) {
      // Load existing preferences from member data
      // For now, we'll initialize with empty array
      
      // Load parent controlled setting
      // This would come from familyMemberPreferences table
      // For now, defaulting to true
    }
  }, [member]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const addAllergy = () => {
    if (!newAllergyName.trim()) {
      showToast({
        type: 'error',
        title: 'Invalid Input',
        message: 'Please enter an allergy name',
        duration: 3000,
      });
      return;
    }

    const newAllergy: Allergy = {
      name: newAllergyName.trim(),
      type: newAllergyType,
      severity: newAllergySeverity,
    };

    setAllergies(prev => [...prev, newAllergy]);
    setNewAllergyName('');
    setNewAllergyType('allergy');
    setNewAllergySeverity('moderate');
    setShowAddAllergy(false);
  };

  const removeAllergy = (index: number) => {
    setAllergies(prev => prev.filter((_, i) => i !== index));
  };



  const toggleDietaryOption = (value: string, category: 'preferences' | 'religious_requirements' | 'health_driven') => {
    setDietaryPrefs(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleSubmit = async () => {
    if (!member || !id) return;

    try {
      setIsLoading(true);

      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      // Prepare allergies array
      const allergiesArray = allergies.map((allergy) => ({
        name: allergy.name,
        type: allergy.type,
        severity: allergy.severity,
      }));

      // Prepare dietary preferences object
      const dietaryPrefsObject = {
        preferences: dietaryPrefs.preferences,
        religious_requirements: dietaryPrefs.religious_requirements,
        health_driven: dietaryPrefs.health_driven,
      };

      const result = await convex.action(api.actions.users.customerUpdateMemberPreferences, {
        sessionToken,
        member_id: String(id),
        allergies: allergiesArray.length > 0 ? allergiesArray : undefined,
        dietary_preferences: dietaryPrefsObject,
        parent_controlled: parentControlled,
      });

      if (result.success === false) {
        throw new Error(result.error || 'Failed to update preferences');
      }

      showToast({
        type: 'success',
        title: 'Preferences Updated',
        message: 'Member preferences have been updated successfully.',
        duration: 3000,
      });

      router.back();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: error?.message || 'Failed to update preferences. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Preferences',
        }}
      />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        <ScreenHeader title="Preferences" onBack={() => router.back()} />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.description}>
            Manage allergy and dietary preferences for {member?.name || 'this member'}
          </Text>

          {/* Parent Controlled Toggle */}
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Parent Controlled</Text>
            <Text style={styles.settingDescription}>
              When enabled, you control all preferences for this member. The member cannot change these preferences on their own.
            </Text>
            <TouchableOpacity
              style={[styles.toggle, parentControlled && styles.toggleActive]}
              onPress={() => setParentControlled(!parentControlled)}
            >
              <Text style={[styles.toggleText, !parentControlled && styles.toggleTextInactive]}>
                {parentControlled ? 'Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Allergies Section */}
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('allergies')}
            >
              <View style={styles.sectionHeaderLeft}>
                <AlertTriangle size={20} color="#094327" />
                <Text style={styles.sectionTitle}>Allergies & Intolerances</Text>
              </View>
              {expandedSections.allergies ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>

            {expandedSections.allergies && (
              <View style={styles.sectionContent}>
                {allergies.length > 0 && (
                  <View style={styles.allergiesList}>
                    {allergies.map((allergy, index) => (
                      <View key={index} style={styles.allergyItem}>
                        <View style={styles.allergyInfo}>
                          <Text style={styles.allergyName}>{allergy.name}</Text>
                          <View style={styles.allergyTags}>
                            <View style={styles.tag}>
                              <Text style={styles.tagText}>{allergy.type}</Text>
                            </View>
                            <View style={styles.tag}>
                              <Text style={styles.tagText}>{allergy.severity}</Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeAllergy(index)}
                          style={styles.removeButton}
                        >
                          <X size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {!showAddAllergy ? (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddAllergy(true)}
                  >
                    <Plus size={20} color="#094327" />
                    <Text style={styles.addButtonText}>Add Allergy</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.addAllergyForm}>
                    <TextInput
                      style={styles.input}
                      placeholder="Allergy name"
                      value={newAllergyName}
                      onChangeText={setNewAllergyName}
                      placeholderTextColor="#9CA3AF"
                    />
                    <View style={styles.row}>
                      <TouchableOpacity
                        style={[styles.typeButton, newAllergyType === 'allergy' && styles.typeButtonActive]}
                        onPress={() => setNewAllergyType('allergy')}
                      >
                        <Text style={[styles.typeButtonText, newAllergyType === 'allergy' && styles.typeButtonTextActive]}>
                          Allergy
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typeButton, newAllergyType === 'intolerance' && styles.typeButtonActive]}
                        onPress={() => setNewAllergyType('intolerance')}
                      >
                        <Text style={[styles.typeButtonText, newAllergyType === 'intolerance' && styles.typeButtonTextActive]}>
                          Intolerance
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.row}>
                      {(['mild', 'moderate', 'severe'] as const).map(severity => (
                        <TouchableOpacity
                          key={severity}
                          style={[styles.severityButton, newAllergySeverity === severity && styles.severityButtonActive]}
                          onPress={() => setNewAllergySeverity(severity)}
                        >
                          <Text style={[styles.severityButtonText, newAllergySeverity === severity && styles.severityButtonTextActive]}>
                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.row}>
                      <TouchableOpacity
                        style={[styles.cancelButton, styles.formButton]}
                        onPress={() => {
                          setShowAddAllergy(false);
                          setNewAllergyName('');
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveButton, styles.formButton]}
                        onPress={addAllergy}
                      >
                        <Text style={styles.saveButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.commonAllergies}>
                  <Text style={styles.commonAllergiesLabel}>Quick Add:</Text>
                  <View style={styles.commonAllergiesList}>
                    {COMMON_ALLERGIES.map(allergyName => (
                      <TouchableOpacity
                        key={allergyName}
                        style={styles.commonAllergyChip}
                        onPress={() => {
                          if (!allergies.find(a => a.name.toLowerCase() === allergyName.toLowerCase())) {
                            setAllergies(prev => [...prev, {
                              name: allergyName,
                              type: 'allergy',
                              severity: 'moderate',
                            }]);
                          }
                        }}
                      >
                        <Text style={styles.commonAllergyText}>{allergyName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Dietary Preferences Section */}
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('dietary')}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>Dietary Preferences</Text>
              </View>
              {expandedSections.dietary ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>

            {expandedSections.dietary && (
              <View style={styles.sectionContent}>
                {DIETARY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.optionItem}
                    onPress={() => toggleDietaryOption(option.value, 'preferences')}
                  >
                    <View style={styles.checkbox}>
                      {dietaryPrefs.preferences.includes(option.value) && (
                        <View style={styles.checkboxInner} />
                      )}
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Religious Requirements Section */}
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('religious')}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>Religious Requirements</Text>
              </View>
              {expandedSections.religious ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>

            {expandedSections.religious && (
              <View style={styles.sectionContent}>
                {RELIGIOUS_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.optionItem}
                    onPress={() => toggleDietaryOption(option.value, 'religious_requirements')}
                  >
                    <View style={styles.checkbox}>
                      {dietaryPrefs.religious_requirements.includes(option.value) && (
                        <View style={styles.checkboxInner} />
                      )}
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Health-Driven Preferences Section */}
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('health')}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>Health-Driven Preferences</Text>
              </View>
              {expandedSections.health ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>

            {expandedSections.health && (
              <View style={styles.sectionContent}>
                {HEALTH_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.optionItem}
                    onPress={() => toggleDietaryOption(option.value, 'health_driven')}
                  >
                    <View style={styles.checkbox}>
                      {dietaryPrefs.health_driven.includes(option.value) && (
                        <View style={styles.checkboxInner} />
                      )}
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
        <SuperButton
          title={isLoading ? 'Updating...' : 'Save Preferences'}
          onPress={handleSubmit}
          backgroundColor="#094327"
          textColor="white"
        />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
  },
  description: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLabel: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  settingDescription: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  toggle: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#094327',
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  toggleTextInactive: {
    color: '#6B7280',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  allergiesList: {
    marginBottom: 16,
  },
  allergyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  allergyInfo: {
    flex: 1,
  },
  allergyName: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  allergyTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter',
    textTransform: 'capitalize',
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#094327',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  addAllergyForm: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  typeButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  severityButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  severityButtonActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  severityButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  severityButtonTextActive: {
    color: '#FFFFFF',
  },
  formButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  saveButton: {
    backgroundColor: '#094327',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  commonAllergies: {
    marginTop: 16,
  },
  commonAllergiesLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  commonAllergiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commonAllergyChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commonAllergyText: {
    color: '#094327',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#094327',
  },
  optionLabel: {
    color: '#111827',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FAFFFA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

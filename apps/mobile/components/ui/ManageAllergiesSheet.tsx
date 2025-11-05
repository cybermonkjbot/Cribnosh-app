import { useGetAllergiesQuery, useUpdateAllergiesMutation } from '@/store/customerApi';
import { AlertTriangle } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../../lib/ToastContext';
import { BottomSheetBase } from '../BottomSheetBase';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface ManageAllergiesSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

interface PredefinedAllergen {
  name: string;
  description?: string;
}

const PREDEFINED_ALLERGENS: PredefinedAllergen[] = [
  { name: 'Dairy', description: 'Milk, cheese, yogurt, and other dairy products' },
  { name: 'Eggs', description: 'Both egg whites and egg yolks' },
  { name: 'Gluten', description: 'Found in wheat, barley, rye, and some oats' },
  { name: 'Peanuts', description: 'All peanut products and derivatives' },
  { name: 'Tree Nuts', description: 'Almonds, walnuts, cashews, and other tree nuts' },
  { name: 'Soy', description: 'Soybeans and soy-based products' },
  { name: 'Fish', description: 'All types of fish and fish products' },
  { name: 'Shellfish', description: 'Shrimp, crab, lobster, and other shellfish' },
];

interface AllergenState {
  name: string;
  type: 'allergy' | 'intolerance';
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export function ManageAllergiesSheet({
  isVisible,
  onClose,
}: ManageAllergiesSheetProps) {
  const { showToast } = useToast();
  const snapPoints = useMemo(() => ['85%', '95%'], []);

  const { data: allergiesData, isLoading } = useGetAllergiesQuery(undefined, {
    skip: !isVisible,
  });

  const [updateAllergies, { isLoading: isSaving }] = useUpdateAllergiesMutation();

  // State for predefined allergens
  const [allergenStates, setAllergenStates] = useState<Map<string, AllergenState>>(new Map());

  // State for custom allergens
  const [customAllergens, setCustomAllergens] = useState<AllergenState[]>([]);
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<'allergy' | 'intolerance'>('allergy');
  const [customSeverity, setCustomSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');

  // Initialize from API data
  useEffect(() => {
    if (allergiesData?.data) {
      const newStates = new Map<string, AllergenState>();
      const newCustom: AllergenState[] = [];

      allergiesData.data.forEach((allergy) => {
        const predefined = PREDEFINED_ALLERGENS.find(
          (p) => p.name.toLowerCase() === allergy.name.toLowerCase()
        );

        if (predefined) {
          newStates.set(allergy.name, {
            name: allergy.name,
            type: allergy.type,
            severity: allergy.severity,
            notes: allergy.notes,
          });
        } else {
          newCustom.push({
            name: allergy.name,
            type: allergy.type,
            severity: allergy.severity,
            notes: allergy.notes,
          });
        }
      });

      setAllergenStates(newStates);
      setCustomAllergens(newCustom);
    }
  }, [allergiesData]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const toggleAllergen = (allergenName: string) => {
    setAllergenStates((prev) => {
      const newStates = new Map(prev);
      if (newStates.has(allergenName)) {
        newStates.delete(allergenName);
      } else {
        newStates.set(allergenName, {
          name: allergenName,
          type: 'allergy',
          severity: 'moderate',
        });
      }
      return newStates;
    });
  };

  const updateAllergenState = (
    allergenName: string,
    field: 'type' | 'severity',
    value: 'allergy' | 'intolerance' | 'mild' | 'moderate' | 'severe'
  ) => {
    setAllergenStates((prev) => {
      const newStates = new Map(prev);
      const current = newStates.get(allergenName);
      if (current) {
        newStates.set(allergenName, {
          ...current,
          [field]: value,
        });
      }
      return newStates;
    });
  };

  const addCustomAllergen = () => {
    if (!customName.trim()) {
      showToast({
        type: 'error',
        title: 'Invalid Input',
        message: 'Please enter a custom allergen name',
        duration: 3000,
      });
      return;
    }

    const newAllergen: AllergenState = {
      name: customName.trim(),
      type: customType,
      severity: customSeverity,
    };

    setCustomAllergens((prev) => [...prev, newAllergen]);
    setCustomName('');
    setCustomType('allergy');
    setCustomSeverity('moderate');
  };

  const removeCustomAllergen = (index: number) => {
    setCustomAllergens((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCustomAllergen = (
    index: number,
    field: 'type' | 'severity',
    value: 'allergy' | 'intolerance' | 'mild' | 'moderate' | 'severe'
  ) => {
    setCustomAllergens((prev) =>
      prev.map((allergen, i) =>
        i === index ? { ...allergen, [field]: value } : allergen
      )
    );
  };

  const handleSave = async () => {
    try {
      const allAllergies: AllergenState[] = [
        ...Array.from(allergenStates.values()),
        ...customAllergens,
      ];

      const payload = {
        allergies: allAllergies.map((a) => ({
          name: a.name,
          type: a.type,
          severity: a.severity,
          notes: a.notes,
        })),
      };

      await updateAllergies(payload).unwrap();

      showToast({
        type: 'success',
        title: 'Allergies Updated',
        message: 'Your allergies have been saved successfully.',
        duration: 3000,
      });

      onClose();
    } catch (error: any) {
      const errorMessage =
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        'Failed to update allergies. Please try again.';
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMessage,
        duration: 4000,
      });
    }
  };

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
          <Text style={styles.title}>Manage Allergies</Text>
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
            {/* Predefined Allergens Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Common Allergens</Text>
              <Text style={styles.sectionDescription}>
                Select from common allergens and set their severity level
              </Text>

              {PREDEFINED_ALLERGENS.map((allergen) => {
                const isSelected = allergenStates.has(allergen.name);
                const state = allergenStates.get(allergen.name);

                return (
                  <View key={allergen.name} style={styles.allergenCard}>
                    <TouchableOpacity
                      style={styles.allergenHeader}
                      onPress={() => toggleAllergen(allergen.name)}
                    >
                      <View style={styles.checkboxContainer}>
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxChecked,
                          ]}
                        >
                          {isSelected && (
                            <View style={styles.checkboxInner} />
                          )}
                        </View>
                        <View style={styles.allergenInfo}>
                          <Text style={styles.allergenName}>{allergen.name}</Text>
                          {allergen.description && (
                            <Text style={styles.allergenDescription}>
                              {allergen.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {isSelected && state && (
                      <View style={styles.allergenControls}>
                        {/* Type Selector */}
                        <View style={styles.selectorGroup}>
                          <Text style={styles.selectorLabel}>Type:</Text>
                          <View style={styles.selectorButtons}>
                            <TouchableOpacity
                              style={[
                                styles.selectorButton,
                                state.type === 'allergy' && styles.selectorButtonActive,
                              ]}
                              onPress={() => updateAllergenState(allergen.name, 'type', 'allergy')}
                            >
                              <Text
                                style={[
                                  styles.selectorButtonText,
                                  state.type === 'allergy' && styles.selectorButtonTextActive,
                                ]}
                              >
                                Allergy
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.selectorButton,
                                state.type === 'intolerance' && styles.selectorButtonActive,
                              ]}
                              onPress={() =>
                                updateAllergenState(allergen.name, 'type', 'intolerance')
                              }
                            >
                              <Text
                                style={[
                                  styles.selectorButtonText,
                                  state.type === 'intolerance' && styles.selectorButtonTextActive,
                                ]}
                              >
                                Intolerance
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Severity Selector */}
                        <View style={styles.selectorGroup}>
                          <Text style={styles.selectorLabel}>Severity:</Text>
                          <View style={styles.selectorButtons}>
                            {(['mild', 'moderate', 'severe'] as const).map((severity) => (
                              <TouchableOpacity
                                key={severity}
                                style={[
                                  styles.selectorButton,
                                  state.severity === severity && styles.selectorButtonActive,
                                ]}
                                onPress={() =>
                                  updateAllergenState(allergen.name, 'severity', severity)
                                }
                              >
                                <Text
                                  style={[
                                    styles.selectorButtonText,
                                    state.severity === severity &&
                                      styles.selectorButtonTextActive,
                                  ]}
                                >
                                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Custom Allergens Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Allergens</Text>
              <View style={styles.warningBox}>
                <AlertTriangle size={20} color="#FF9800" />
                <Text style={styles.warningText}>
                  Note: Our AI systems work better with predefined options and might not be as
                  accurate for custom allergens
                </Text>
              </View>

              {/* Add Custom Allergen Form */}
              <View style={styles.customForm}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Enter custom allergen name"
                  placeholderTextColor="#9CA3AF"
                  value={customName}
                  onChangeText={setCustomName}
                />
                <View style={styles.customControls}>
                  <View style={styles.selectorGroup}>
                    <Text style={styles.selectorLabel}>Type:</Text>
                    <View style={styles.selectorButtons}>
                      <TouchableOpacity
                        style={[
                          styles.selectorButton,
                          customType === 'allergy' && styles.selectorButtonActive,
                        ]}
                        onPress={() => setCustomType('allergy')}
                      >
                        <Text
                          style={[
                            styles.selectorButtonText,
                            customType === 'allergy' && styles.selectorButtonTextActive,
                          ]}
                        >
                          Allergy
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.selectorButton,
                          customType === 'intolerance' && styles.selectorButtonActive,
                        ]}
                        onPress={() => setCustomType('intolerance')}
                      >
                        <Text
                          style={[
                            styles.selectorButtonText,
                            customType === 'intolerance' && styles.selectorButtonTextActive,
                          ]}
                        >
                          Intolerance
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.selectorGroup}>
                    <Text style={styles.selectorLabel}>Severity:</Text>
                    <View style={styles.selectorButtons}>
                      {(['mild', 'moderate', 'severe'] as const).map((severity) => (
                        <TouchableOpacity
                          key={severity}
                          style={[
                            styles.selectorButton,
                            customSeverity === severity && styles.selectorButtonActive,
                          ]}
                          onPress={() => setCustomSeverity(severity)}
                        >
                          <Text
                            style={[
                              styles.selectorButtonText,
                              customSeverity === severity && styles.selectorButtonTextActive,
                            ]}
                          >
                            {severity.charAt(0).toUpperCase() + severity.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addCustomAllergen}
                  disabled={!customName.trim()}
                >
                  <Text style={styles.addButtonText}>Add Custom Allergen</Text>
                </TouchableOpacity>
              </View>

              {/* Custom Allergens List */}
              {customAllergens.map((allergen, index) => (
                <View key={index} style={styles.customAllergenCard}>
                  <View style={styles.customAllergenHeader}>
                    <Text style={styles.customAllergenName}>{allergen.name}</Text>
                    <TouchableOpacity
                      onPress={() => removeCustomAllergen(index)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.allergenControls}>
                    <View style={styles.selectorGroup}>
                      <Text style={styles.selectorLabel}>Type:</Text>
                      <View style={styles.selectorButtons}>
                        <TouchableOpacity
                          style={[
                            styles.selectorButton,
                            allergen.type === 'allergy' && styles.selectorButtonActive,
                          ]}
                          onPress={() => updateCustomAllergen(index, 'type', 'allergy')}
                        >
                          <Text
                            style={[
                              styles.selectorButtonText,
                              allergen.type === 'allergy' && styles.selectorButtonTextActive,
                            ]}
                          >
                            Allergy
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.selectorButton,
                            allergen.type === 'intolerance' && styles.selectorButtonActive,
                          ]}
                          onPress={() => updateCustomAllergen(index, 'type', 'intolerance')}
                        >
                          <Text
                            style={[
                              styles.selectorButtonText,
                              allergen.type === 'intolerance' && styles.selectorButtonTextActive,
                            ]}
                          >
                            Intolerance
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.selectorGroup}>
                      <Text style={styles.selectorLabel}>Severity:</Text>
                      <View style={styles.selectorButtons}>
                        {(['mild', 'moderate', 'severe'] as const).map((severity) => (
                          <TouchableOpacity
                            key={severity}
                            style={[
                              styles.selectorButton,
                              allergen.severity === severity && styles.selectorButtonActive,
                            ]}
                            onPress={() => updateCustomAllergen(index, 'severity', severity)}
                          >
                            <Text
                              style={[
                                styles.selectorButtonText,
                                allergen.severity === severity &&
                                  styles.selectorButtonTextActive,
                              ]}
                            >
                              {severity.charAt(0).toUpperCase() + severity.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Save Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  sectionDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 16,
  },
  allergenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  allergenHeader: {
    width: '100%',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkboxChecked: {
    borderColor: '#094327',
    backgroundColor: '#094327',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  allergenInfo: {
    flex: 1,
  },
  allergenName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  allergenDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 4,
  },
  allergenControls: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectorGroup: {
    marginBottom: 12,
  },
  selectorLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 8,
  },
  selectorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectorButtonActive: {
    borderColor: '#094327',
    backgroundColor: '#E6FFE8',
  },
  selectorButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  selectorButtonTextActive: {
    color: '#094327',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#92400E',
  },
  customForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customControls: {
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#094327',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  customAllergenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customAllergenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customAllergenName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#FF3B30',
  },
  footer: {
    paddingVertical: 24,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});


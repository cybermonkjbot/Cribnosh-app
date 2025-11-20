import { usePreferences } from '@/hooks/usePreferences';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
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

interface DietaryPreferencesSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

interface PreferenceOption {
  value: string;
  label: string;
  description?: string;
}

const DIETARY_PREFERENCES: PreferenceOption[] = [
  { value: 'vegetarian', label: 'Vegetarian', description: 'No meat or fish' },
  { value: 'vegan', label: 'Vegan', description: 'No animal products' },
  { value: 'gluten_free', label: 'Gluten-Free', description: 'No gluten-containing foods' },
  { value: 'keto', label: 'Keto', description: 'Low-carb, high-fat diet' },
  { value: 'paleo', label: 'Paleo', description: 'Prehistoric human diet' },
];

const RELIGIOUS_REQUIREMENTS: PreferenceOption[] = [
  { value: 'halal', label: 'Halal', description: 'Permissible under Islamic law' },
  { value: 'kosher', label: 'Kosher', description: 'Permissible under Jewish law' },
];

const HEALTH_DRIVEN: PreferenceOption[] = [
  { value: 'low_sodium', label: 'Low Sodium', description: 'Reduced salt content' },
  { value: 'low_fat', label: 'Low Fat', description: 'Reduced fat content' },
  { value: 'low_calorie', label: 'Low Calorie', description: 'Reduced calorie content' },
  { value: 'low_carb', label: 'Low Carb', description: 'Reduced carbohydrate content' },
  { value: 'high_protein', label: 'High Protein', description: 'Increased protein content' },
];

export function DietaryPreferencesSheet({
  isVisible,
  onClose,
}: DietaryPreferencesSheetProps) {
  const { showToast } = useToast();
  const snapPoints = useMemo(() => ['85%', '95%'], []);
  const { getDietaryPreferences, updateDietaryPreferences, isLoading: isSaving } = usePreferences();

  // State for selected preferences
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedReligious, setSelectedReligious] = useState<string[]>([]);
  const [selectedHealth, setSelectedHealth] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load preferences when sheet becomes visible
  useEffect(() => {
    if (isVisible) {
      loadPreferences();
    }
  }, [isVisible]);

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const result = await getDietaryPreferences();
      if (result.success && result.data) {
        setSelectedPreferences(result.data.preferences || []);
        setSelectedReligious(result.data.religious_requirements || []);
        setSelectedHealth(result.data.health_driven || []);
      }
    } catch (error) {
      // Error already handled in hook
    } finally {
      setIsLoadingData(false);
    }
  }, [getDietaryPreferences]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const togglePreference = (value: string, category: 'preferences' | 'religious' | 'health') => {
    if (category === 'preferences') {
      setSelectedPreferences((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else if (category === 'religious') {
      setSelectedReligious((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    } else {
      setSelectedHealth((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
      );
    }
  };

  const isSelected = (value: string, category: 'preferences' | 'religious' | 'health') => {
    if (category === 'preferences') {
      return selectedPreferences.includes(value);
    } else if (category === 'religious') {
      return selectedReligious.includes(value);
    } else {
      return selectedHealth.includes(value);
    }
  };

  const handleSave = async () => {
    try {
      await updateDietaryPreferences({
        preferences: selectedPreferences,
        religious_requirements: selectedReligious,
        health_driven: selectedHealth,
      });

      onClose();
    } catch (error) {
      // Error already handled in hook
    }
  };

  if (!isVisible) {
    return null;
  }

  const renderPreferenceSection = (
    title: string,
    options: PreferenceOption[],
    category: 'preferences' | 'religious' | 'health'
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {options.map((option) => {
        const selected = isSelected(option.value, category);
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.preferenceCard, selected && styles.preferenceCardSelected]}
            onPress={() => togglePreference(option.value, category)}
          >
            <View style={styles.preferenceContent}>
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
                  {selected && <View style={styles.checkboxInner} />}
                </View>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>{option.label}</Text>
                  {option.description && (
                    <Text style={styles.preferenceDescription}>{option.description}</Text>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

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
          <Text style={styles.title}>Dietary Requirements</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        {isLoadingData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderPreferenceSection('Dietary Preferences', DIETARY_PREFERENCES, 'preferences')}
            {renderPreferenceSection(
              'Religious Requirements',
              RELIGIOUS_REQUIREMENTS,
              'religious'
            )}
            {renderPreferenceSection('Health-Driven Options', HEALTH_DRIVEN, 'health')}

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
    marginBottom: 16,
  },
  preferenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  preferenceCardSelected: {
    borderColor: '#094327',
    backgroundColor: '#F0FDF4',
  },
  preferenceContent: {
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
  preferenceInfo: {
    flex: 1,
  },
  preferenceLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  preferenceDescription: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 4,
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


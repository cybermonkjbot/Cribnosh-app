import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Check icon SVG
const checkIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L7 13L4 10" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const RELATIONSHIPS = [
  'Spouse',
  'Partner',
  'Child',
  'Parent',
  'Sibling',
  'Other Family',
  'Friend',
  'Other',
];

interface RelationshipSelectionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  selectedRelationship: string;
  onSelectRelationship: (relationship: string) => void;
}

export function RelationshipSelectionSheet({
  isVisible,
  onClose,
  selectedRelationship,
  onSelectRelationship,
}: RelationshipSelectionSheetProps) {
  const snapPoints = useMemo(() => ['50%', '75%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const handleRelationshipPress = useCallback((relationship: string) => {
    onSelectRelationship(relationship);
    onClose();
  }, [onSelectRelationship, onClose]);

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
          <Text style={styles.title}>Select Relationship</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.optionsContainer}>
          {RELATIONSHIPS.map((relationship) => {
            const isSelected = selectedRelationship === relationship;
            return (
              <TouchableOpacity
                key={relationship}
                style={[
                  styles.optionItem,
                  isSelected && styles.optionItemSelected,
                ]}
                onPress={() => handleRelationshipPress(relationship)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {relationship}
                </Text>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <SvgXml xml={checkIconSVG} width={20} height={20} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
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
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  optionsContainer: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionItemSelected: {
    backgroundColor: '#F4FFF5',
    borderColor: '#094327',
    borderWidth: 2,
  },
  optionText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 8,
  },
});


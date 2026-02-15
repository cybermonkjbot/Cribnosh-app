import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface HelpCategorySheetProps {
  isVisible: boolean;
  onClose: () => void;
  category: {
    title: string;
    content: string;
    sections?: {
      title: string;
      content: string;
    }[];
  } | null;
}

export function HelpCategorySheet({
  isVisible,
  onClose,
  category,
}: HelpCategorySheetProps) {
  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible || !category) {
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
      containerStyle={{
        zIndex: 9999,
      }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{category.title}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close"
            accessibilityHint="Closes the help category details"
          >
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.description}>{category.content}</Text>

          {category.sections && category.sections.length > 0 && (
            <View style={styles.sectionsContainer}>
              {category.sections.map((section, index) => (
                <View key={index} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionContent}>{section.content}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  description: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 24,
  },
  sectionsContainer: {
    gap: 24,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  sectionContent: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
});


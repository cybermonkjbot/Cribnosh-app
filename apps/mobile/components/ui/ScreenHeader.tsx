import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface ScreenHeaderProps {
  title?: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <SvgXml xml={backArrowSVG} width={24} height={24} />
      </TouchableOpacity>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <View style={styles.rightContainer}>
        {rightAction || <View style={styles.headerSpacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerSpacer: {
    width: 40,
  },
});


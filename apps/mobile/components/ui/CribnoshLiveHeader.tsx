import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CribnoshLiveIndicator } from './CribnoshLiveIndicator';

interface CribnoshLiveHeaderProps {
  kitchenTitle: string;
  viewers: number;
}

export function CribnoshLiveHeader({
  kitchenTitle,
  viewers,
}: CribnoshLiveHeaderProps) {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {kitchenTitle}
          </Text>
          <View style={styles.viewersContainer}>
            <View style={styles.viewersBadge}>
              <Text style={styles.viewersText}>{viewers} Viewers</Text>
            </View>
          </View>
          <View style={styles.indicatorContainer}>
            <CribnoshLiveIndicator />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // flex-row
    alignItems: 'flex-start', // items-start
    justifyContent: 'space-between', // justify-between
    borderRadius: 12, // rounded-xl
    overflow: 'hidden', // overflow-hidden
    paddingHorizontal: 8, // px-2
    paddingVertical: 6, // py-1.5
    width: '100%', // w-full
    backgroundColor: 'transparent', // bg-transparent
  },
  content: {
    flexDirection: 'row', // flex-row
    alignItems: 'flex-start', // items-start
    flex: 1, // flex-1
    minWidth: 0, // min-w-0
  },
  textContainer: {
    flex: 1, // flex-1
    flexDirection: 'column', // flex-col
    alignItems: 'flex-start', // items-start
    justifyContent: 'center', // justify-center
    minWidth: 0, // min-w-0
    gap: 2, // gap-y-0.5
  },
  title: {
    fontFamily: 'Inter', // font-inter
    fontWeight: '600', // font-semibold
    fontSize: 20, // text-[20px]
    lineHeight: 24, // leading-[24px]
    color: '#E6FFE8', // text-[#E6FFE8]
    marginBottom: 0, // mb-0
    marginTop: 4, // mt-1
    textAlign: 'left', // text-left
    width: '100%', // w-full
  },
  viewersContainer: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    width: '100%', // w-full
    marginTop: 2, // mt-0.5
    marginBottom: 2, // mb-0.5
  },
  viewersBadge: {
    backgroundColor: '#9CA3AF', // bg-gray-400
    borderRadius: 16, // rounded-2xl
    paddingHorizontal: 12, // px-3
    paddingVertical: 2, // py-0.5
    alignSelf: 'flex-start', // self-start
  },
  viewersText: {
    color: '#FFFFFF', // text-white
    fontFamily: 'Inter', // font-inter
    fontWeight: '400', // font-normal
    fontSize: 15, // text-[15px]
    lineHeight: 18, // leading-[18px]
  },
  indicatorContainer: {
    marginTop: 2, // mt-0.5
  },
});


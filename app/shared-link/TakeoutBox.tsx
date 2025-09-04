import { Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface TakeoutBoxProps {
  size?: number;
  rotation?: number;
}

export default function TakeoutBox({ size = width * 0.7, rotation = 15 }: TakeoutBoxProps) {
  return (
    <View style={[styles.container, { width: size, height: size, transform: [{ rotate: `${rotation}deg` }] }]}>
      {/* Main Box Container */}
      <View style={styles.boxContainer}>
        {/* Box Body */}
        <View style={styles.boxBody}>
          {/* Left Side */}
          <View style={styles.side}>
            <View style={styles.patternRow}>
              <View style={styles.icon} />
              <View style={styles.icon} />
              <View style={styles.icon} />
            </View>
            <View style={styles.patternRow}>
              <View style={styles.icon} />
              <View style={styles.icon} />
              <View style={styles.icon} />
            </View>
            <View style={styles.patternRow}>
              <View style={styles.icon} />
              <View style={styles.icon} />
              <View style={styles.icon} />
            </View>
          </View>
          
          {/* Front Side */}
          <View style={styles.frontSide}>
            <Text style={styles.brandText}>Cribnosh</Text>
            <Text style={styles.brandSubtext}>Friends</Text>
          </View>
          
          {/* Right Side */}
          <View style={styles.side}>
            <View style={styles.patternRow}>
              <View style={styles.icon} />
              <View style={styles.icon} />
              <View style={styles.icon} />
            </View>
            <View style={styles.patternRow}>
              <View style={styles.icon} />
              <View style={styles.icon} />
              <View style={styles.icon} />
            </View>
            <View style={styles.patternRow}>
              <View style={styles.icon} />
              <View style={styles.icon} />
              <View style={styles.icon} />
            </View>
          </View>
        </View>
        
        {/* Box Lid */}
        <View style={styles.lid}>
          <Text style={styles.lidText}>Cribnosh</Text>
          <View style={styles.lidPattern}>
            <View style={styles.lidIcon} />
            <View style={styles.lidIcon} />
            <View style={styles.lidIcon} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  boxBody: {
    width: '100%',
    height: '70%',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  side: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  frontSide: {
    flex: 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 2,
  },
  icon: {
    width: 8,
    height: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
  brandText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    textAlign: 'center',
  },
  brandSubtext: {
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 2,
  },
  lid: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  lidText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  lidPattern: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
    width: '60%',
  },
  lidIcon: {
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
});

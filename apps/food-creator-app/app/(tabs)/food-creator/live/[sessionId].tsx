import { LiveStreamDashboard } from '@/components/ui/LiveStreamDashboard';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { Id } from '@/convex/_generated/dataModel';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const { foodCreator } = useFoodCreatorAuth();
  const cameraRef = useRef<any>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  // const [hasPermission, setHasPermission] = useState<boolean | null>(null); // Removed locally managed state

  const sessionId = params.sessionId as Id<'liveSessions'> | undefined;

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const hasPermission = permission?.granted;

  const handleEndStream = () => {
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  const handleFlipCamera = () => {
    setCameraType(prev => prev === 'back' ? 'front' : 'back');
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="light-content" />
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.errorContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorText}>Camera Permission Required</Text>
              <Text style={styles.errorSubtext}>
                Please enable camera access in your device settings to go live.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.errorContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorText}>Invalid Session</Text>
              <Text style={styles.errorSubtext}>
                No live session found. Please start a new live stream.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
      >
        {/* Top Controls */}
        <SafeAreaView style={styles.topControls}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={handleFlipCamera}>
            <View style={styles.flipIcon}>
              <View style={styles.flipIconInner} />
            </View>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Live Stream Dashboard Overlay */}
        <LiveStreamDashboard
          sessionId={sessionId}
          onEndStream={handleEndStream}
        />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTextContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});


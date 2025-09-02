import { CameraView } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Camera control icons
const flipCameraIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const flashIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 2L5 12H11L9 22L19 10H13L15 2H9Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const flashOffIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 2L5 12H11L9 22L19 10H13L15 2H9Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2 2L22 22" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const captureButtonSVG = `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="40" cy="40" r="36" stroke="#FFFFFF" stroke-width="4"/>
  <circle cx="40" cy="40" r="28" fill="#FFFFFF"/>
</svg>`;

type CameraType = 'front' | 'back';
type FlashMode = 'off' | 'on' | 'auto';

export default function CameraModalScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  React.useEffect(() => {
    (async () => {
      const { Camera } = await import('expo-camera');
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleFlipCamera = () => {
    setCameraType((current: CameraType) => 
      current === 'back' ? 'front' : 'back'
    );
  };

  const handleFlashToggle = () => {
    setFlashMode((current: FlashMode) => 
      current === 'off' ? 'on' : 'off'
    );
  };

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        // Handle captured photo here
        console.log('Photo captured:', photo);
      } catch (error) {
        console.error('Error capturing photo:', error);
      }
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Camera',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }} 
      />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          flash={flashMode}
        >
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <SvgXml xml={closeIconSVG} width={24} height={24} />
            </TouchableOpacity>
            
            <View style={styles.topRightControls}>
              <TouchableOpacity style={styles.controlButton} onPress={handleFlashToggle}>
                <SvgXml 
                  xml={flashMode === 'off' ? flashOffIconSVG : flashIconSVG} 
                  width={24} 
                  height={24} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton} onPress={handleFlipCamera}>
                <SvgXml xml={flipCameraIconSVG} width={24} height={24} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Left side - Gallery or other options could go here */}
            <View style={styles.leftControls} />
            
            {/* Center - Capture Button */}
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <SvgXml xml={captureButtonSVG} width={80} height={80} />
            </TouchableOpacity>
            
            {/* Right side - Additional options could go here */}
            <View style={styles.rightControls} />
          </View>
        </CameraView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  leftControls: {
    width: 80,
    height: 80,
  },
  captureButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightControls: {
    width: 80,
    height: 80,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});

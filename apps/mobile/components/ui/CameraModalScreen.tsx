import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Skia } from '@shopify/react-native-skia';
import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Radio } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { CribNoshLogo } from './CribNoshLogo';

const { width, height } = Dimensions.get('window');

// GLSL Shader for Food Filter
// Inputs: image, saturation, temperature, vignette, contrast
const foodFilterShader = Skia.RuntimeEffect.Make(`
uniform shader image;
uniform float saturation;
uniform float temperature;
uniform float vignette;
uniform float contrast;
uniform float2 resolution;

const float3 W = float3(0.2125, 0.7154, 0.0721);

half4 main(float2 pos) {
  half4 color = image.eval(pos);
  
  // 1. Contrast
  color.rgb = ((color.rgb - 0.5) * (1.0 + contrast)) + 0.5;
  
  // 2. Saturation
  float3 intensity = float3(dot(color.rgb, W));
  color.rgb = mix(intensity, color.rgb, 1.0 + saturation);
  
  // 3. Temperature (Warm/Cool)
  // Simple approximation: boost R/G for warm, B for cool
  if (temperature > 0.0) {
    color.r += temperature * 0.1;
    color.g += temperature * 0.05;
  } else {
    color.b -= temperature * 0.1;
  }
  
  // 4. Vignette
  float2 uv = pos / resolution;
  uv *=  1.0 - uv.yx;
  float vig = uv.x*uv.y * 15.0; // strength
  vig = pow(vig, vignette * 0.5); // falloff
  if (vignette > 0.0) {
      color.rgb *= min(1.0, vig + (1.0-vignette)); 
  }

  return color;
}
`)!;

interface CameraModalScreenProps {
  onClose: () => void;
}

// Icons
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

export function CameraModalScreen({ onClose }: CameraModalScreenProps) {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const device = useCameraDevice(cameraPosition);
  const [flash, setFlash] = useState<'off' | 'on'>('off');

  const [selectedFilterCode, setSelectedFilterCode] = useState<string>('normal');
  const activeFilters = useQuery(api.filters.listActive);

  const cameraRef = useRef<Camera>(null);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [lastRecordedVideo, setLastRecordedVideo] = useState<string | null>(null);
  const [showVideoPreview, setShowVideoPreview] = useState<boolean>(false);
  const [showLiveStreamSetup, setShowLiveStreamSetup] = useState<boolean>(false);

  // Shader Uniforms
  const satVal = useSharedValue(0);
  const tempVal = useSharedValue(0);
  const vigVal = useSharedValue(0);
  const conVal = useSharedValue(0);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Update uniforms when filter changes
  useEffect(() => {
    if (!activeFilters) return;
    const filter = activeFilters.find((f: { code: string }) => f.code === selectedFilterCode);
    if (filter) {
      satVal.value = filter.saturation ?? 0;
      tempVal.value = filter.temperature ?? 0;
      vigVal.value = filter.vignette ?? 0;
      conVal.value = filter.contrast ?? 0;
    } else {
      // Default / Normal
      satVal.value = 0;
      tempVal.value = 0;
      vigVal.value = 0;
      conVal.value = 0;
    }
  }, [selectedFilterCode, activeFilters]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: flash,
        enableShutterSound: true,
      });
      setLastCapturedPhoto(photo.path);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFlipCamera = () => {
    setCameraPosition(p => p === 'back' ? 'front' : 'back');
  };

  if (!device || !hasPermission) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        video={true}
        audio={true}
      />

      {/* Controls Overlay */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <SvgXml xml={closeIconSVG} width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <CribNoshLogo size={80} variant="white" />
        </View>
        <View style={styles.topRightControls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}>
            <SvgXml xml={flash === 'off' ? flashOffIconSVG : flashIconSVG} width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleFlipCamera}>
            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter List */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          {activeFilters?.map((filter: { _id: string; code: string; iconUrl?: string; name: string }) => (
            <TouchableOpacity
              key={filter._id}
              style={[styles.filterButton, selectedFilterCode === filter.code && styles.filterButtonActive]}
              onPress={() => setSelectedFilterCode(filter.code)}
            >
              {filter.iconUrl ? (
                <Image source={{ uri: filter.iconUrl }} style={[styles.filterIcon, selectedFilterCode === filter.code && styles.filterIconActive]} contentFit="cover" />
              ) : (
                <Text style={[styles.filterEmoji, selectedFilterCode === filter.code && styles.filterEmojiActive]}>{filter.name.charAt(0)}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.galleryButton}>
          <Ionicons name="images" size={32} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCapture}
        >
          <SvgXml xml={captureButtonSVG} width={80} height={80} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.goLiveButton} onPress={() => setShowLiveStreamSetup(true)}>
          <Radio size={20} color="#FFFFFF" />
          <Text style={styles.goLiveButtonText}>Go Live</Text>
        </TouchableOpacity>
      </View>

      {/* Live Stream Overlay */}
      {showLiveStreamSetup && (
        <LiveStreamSetupOverlay
          onClose={() => setShowLiveStreamSetup(false)}
          onStartLiveStream={(sessionId) => {
            setShowLiveStreamSetup(false);
            onClose();
            router.push(`/live/${sessionId}` as any);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  topControls: { position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  logoContainer: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  topRightControls: { flexDirection: 'row' },
  controlButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  filtersSection: { position: 'absolute', bottom: 140, left: 0, right: 0, zIndex: 10 },
  filtersContainer: { paddingHorizontal: 20, alignItems: 'center' },
  filterButton: { alignItems: 'center', justifyContent: 'center', marginHorizontal: 6, padding: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  filterButtonActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterIcon: { width: 40, height: 40, borderRadius: 20, opacity: 0.7 },
  filterIconActive: { opacity: 1, borderWidth: 2, borderColor: 'white' },
  filterEmoji: { fontSize: 24, opacity: 0.7 },
  filterEmojiActive: { opacity: 1 },
  bottomControls: { position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  galleryButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  captureButton: {},
  goLiveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  goLiveButtonText: { color: 'white', fontWeight: '600', marginLeft: 6 },
  // Missing Overlay Styles
  heroGradientOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: 50
  },
  liveStreamOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'flex-end',
  },
  liveStreamOverlayBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)',
  },
  liveStreamOverlayContent: { flex: 1, zIndex: 101 },
  liveStreamOverlayContentContainer: { padding: 20, paddingTop: 60 },
  liveStreamHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  liveStreamHeaderTitle: { color: 'white', fontSize: 20, fontWeight: '600', flex: 1, textAlign: 'center' },
  startLiveButton: { backgroundColor: '#FF3B30', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  startLiveButtonDisabled: { backgroundColor: '#666', opacity: 0.5 },
  startLiveButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  liveStreamInputContainer: { marginBottom: 20 },
  liveStreamInputLabel: { color: 'white', fontSize: 14, fontWeight: '500', marginBottom: 8 },
  liveStreamTitleInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: 'white', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  liveStreamDescriptionInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: 'white', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', minHeight: 100, textAlignVertical: 'top' },
  liveStreamTagInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, color: 'white', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  mealSelectButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  mealSelectButtonText: { color: 'white', fontSize: 16, flex: 1 },
  mealSelectHint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 6 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  tagText: { color: 'white', fontSize: 14 },
  mealPickerContainer: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', maxHeight: 200, overflow: 'hidden' },
  mealPickerScrollView: { maxHeight: 200 },
  mealPickerLoading: { padding: 20, alignItems: 'center', gap: 8 },
  mealPickerLoadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  mealPickerEmpty: { padding: 20, alignItems: 'center' },
  mealPickerEmptyText: { color: 'white', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  mealPickerEmptySubtext: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  mealPickerItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', gap: 12 },
  mealPickerItemSelected: { backgroundColor: 'rgba(255,59,48,0.2)' },
  mealPickerItemImage: { width: 50, height: 50, borderRadius: 8 },
  mealPickerItemContent: { flex: 1, gap: 4 },
  mealPickerItemName: { color: 'white', fontSize: 16, fontWeight: '500' },
  mealPickerItemDescription: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  mealPickerItemPrice: { color: '#FF3B30', fontSize: 14, fontWeight: '600' },
});

// Resurrected Live Stream Component
import { useAuthContext } from '@/contexts/AuthContext';
import { useFoodCreators } from '@/hooks/useFoodCreators';
import { X } from 'lucide-react-native';
import { ActivityIndicator, Alert, TextInput } from 'react-native';

interface LiveStreamSetupOverlayProps {
  onClose: () => void;
  onStartLiveStream: (sessionId: string) => void;
}

function LiveStreamSetupOverlay({ onClose, onStartLiveStream }: LiveStreamSetupOverlayProps) {
  const { isAuthenticated } = useAuthContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedMealName, setSelectedMealName] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const isMountedRef = useRef(true);

  const { getFoodCreatorMeals, startLiveSession } = useFoodCreators();
  const [meals, setMeals] = useState<any[]>([]);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const loadMeals = async () => {
        try {
          if (!isMountedRef.current) return;
          setIsLoadingMeals(true);
          const result = await getFoodCreatorMeals(100, 0);
          if (isMountedRef.current && result.success) {
            setMeals(result.data?.meals || []);
          }
        } catch {
          // ignore
        } finally {
          if (isMountedRef.current) setIsLoadingMeals(false);
        }
      };
      loadMeals();
    }
  }, [isAuthenticated, getFoodCreatorMeals]);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleStartLiveStream = async () => {
    if (!isAuthenticated || !title.trim() || !selectedMealId) return;

    try {
      if (!isMountedRef.current) return;
      setIsStarting(true);
      const channelName = `live_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const result = await startLiveSession({
        channelName,
        title: title.trim(),
        description: description.trim(),
        mealId: selectedMealId,
        tags,
      });

      if (isMountedRef.current && result.success) {
        onStartLiveStream(result.data.sessionId || result.data.session?.sessionId || '');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start stream');
    } finally {
      if (isMountedRef.current) setIsStarting(false);
    }
  };

  return (
    <View style={styles.liveStreamOverlay}>
      <TouchableOpacity style={styles.liveStreamOverlayBackdrop} activeOpacity={1} onPress={onClose} disabled={isStarting} />
      <ScrollView style={styles.liveStreamOverlayContent} contentContainerStyle={styles.liveStreamOverlayContentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.liveStreamHeader}>
          <TouchableOpacity onPress={onClose} disabled={isStarting}><X size={24} color="white" /></TouchableOpacity>
          <Text style={styles.liveStreamHeaderTitle}>Start Live Stream</Text>
          <TouchableOpacity onPress={handleStartLiveStream} disabled={isStarting || !title.trim() || !selectedMealId} style={[styles.startLiveButton, (isStarting || !title.trim() || !selectedMealId) && styles.startLiveButtonDisabled]}>
            {isStarting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.startLiveButtonText}>Start Live</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.liveStreamInputContainer}>
          <Text style={styles.liveStreamInputLabel}>Live Stream Title *</Text>
          <TextInput style={styles.liveStreamTitleInput} placeholder="What are you cooking?" placeholderTextColor="#999" value={title} onChangeText={setTitle} maxLength={100} editable={!isStarting} />
        </View>

        <View style={styles.liveStreamInputContainer}>
          <Text style={styles.liveStreamInputLabel}>Meal *</Text>
          <TouchableOpacity style={styles.mealSelectButton} onPress={() => setShowMealPicker(!showMealPicker)} disabled={isStarting || isLoadingMeals}>
            <Text style={styles.mealSelectButtonText}>{selectedMealName || 'Select a Meal'}</Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
          {showMealPicker && (
            <View style={styles.mealPickerContainer}>
              <ScrollView style={styles.mealPickerScrollView} nestedScrollEnabled>
                {isLoadingMeals ? <ActivityIndicator size="small" color="white" /> : meals.map(meal => (
                  <TouchableOpacity key={meal._id} style={[styles.mealPickerItem, selectedMealId === meal._id && styles.mealPickerItemSelected]} onPress={() => { setSelectedMealId(meal._id); setSelectedMealName(meal.name); setShowMealPicker(false); }}>
                    {meal.image && <Image source={{ uri: meal.image }} style={styles.mealPickerItemImage} contentFit="cover" />}
                    <View style={styles.mealPickerItemContent}>
                      <Text style={styles.mealPickerItemName}>{meal.name}</Text>
                      <Text style={styles.mealPickerItemDescription} numberOfLines={1}>{meal.description}</Text>
                      <Text style={styles.mealPickerItemPrice}>£{meal.price}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.liveStreamInputContainer}>
          <Text style={styles.liveStreamInputLabel}>Description</Text>
          <TextInput style={styles.liveStreamDescriptionInput} placeholder="Details..." placeholderTextColor="#999" value={description} onChangeText={setDescription} multiline />
        </View>
      </ScrollView>
    </View>
  );
}

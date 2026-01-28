import { useFeatureFlag } from '@/context/FeatureFlagContext';
import { createContext, ReactNode, useContext, useState } from 'react';

// Emotion types for the Shake to Eat feature
export type EmotionType = 'hungry' | 'tired' | 'excited' | 'sad' | 'neutral' | 'stressed';

// Emotion configuration with colors, animations, and personality
interface EmotionConfig {
  key: EmotionType;
  label: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  animationSpeed: 'slow' | 'normal' | 'fast';
  personality: 'energetic' | 'calm' | 'playful' | 'cozy' | 'adventurous';
  soundEffect?: string;
  hapticPattern?: 'light' | 'medium' | 'heavy';
}

// Emotion configurations with Cribnosh brand colors
const EMOTION_CONFIGS: Record<EmotionType, EmotionConfig> = {
  hungry: {
    key: 'hungry',
    label: 'Hungry',
    emoji: '😋',
    primaryColor: '#FF3B30', // Cribnosh red
    secondaryColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
    textColor: '#11181C',
    animationSpeed: 'fast',
    personality: 'energetic',
    soundEffect: 'hungry_growl',
    hapticPattern: 'medium',
  },
  tired: {
    key: 'tired',
    label: 'Tired',
    emoji: '🥱',
    primaryColor: '#8B5CF6', // Purple for sleepy vibes
    secondaryColor: '#A78BFA',
    backgroundColor: '#F8F7FF',
    textColor: '#11181C',
    animationSpeed: 'slow',
    personality: 'calm',
    soundEffect: 'gentle_yawn',
    hapticPattern: 'light',
  },
  excited: {
    key: 'excited',
    label: 'Excited',
    emoji: '🥳',
    primaryColor: '#F59E0B', // Golden excitement
    secondaryColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
    textColor: '#11181C',
    animationSpeed: 'fast',
    personality: 'playful',
    soundEffect: 'party_popper',
    hapticPattern: 'heavy',
  },
  sad: {
    key: 'sad',
    label: 'Sad',
    emoji: '💔',
    primaryColor: '#6B7280', // Muted gray
    secondaryColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    textColor: '#11181C',
    animationSpeed: 'slow',
    personality: 'cozy',
    soundEffect: 'gentle_comfort',
    hapticPattern: 'light',
  },
  neutral: {
    key: 'neutral',
    label: 'Neutral',
    emoji: '😶‍🌫️',
    primaryColor: '#22c55e', // Cribnosh green
    secondaryColor: '#4ADE80',
    backgroundColor: '#F0FDF4',
    textColor: '#11181C',
    animationSpeed: 'normal',
    personality: 'adventurous',
    soundEffect: 'curious_chime',
    hapticPattern: 'medium',
  },
  stressed: {
    key: 'stressed',
    label: 'Stressed',
    emoji: '😰',
    primaryColor: '#EF4444', // Stress red
    secondaryColor: '#F87171',
    backgroundColor: '#FEF2F2',
    textColor: '#11181C',
    animationSpeed: 'fast',
    personality: 'energetic',
    soundEffect: 'calming_waves',
    hapticPattern: 'medium',
  },
};

interface EmotionsUIContextType {
  // Current emotion state
  currentEmotion: EmotionType;
  setCurrentEmotion: (emotion: EmotionType) => void;

  // Emotion configuration
  getEmotionConfig: (emotion: EmotionType) => EmotionConfig;
  currentEmotionConfig: EmotionConfig;

  // Animation helpers
  getAnimationConfig: (emotion: EmotionType) => {
    duration: number;
    easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
    scale: number;
  };

  // Color helpers
  getEmotionColors: (emotion: EmotionType) => {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };

  // Personality-based styling
  getPersonalityStyle: (emotion: EmotionType) => {
    borderRadius: number;
    shadowOpacity: number;
    transform: { scale: number; rotate: string };
  };
}

const EmotionsUIContext = createContext<EmotionsUIContextType | undefined>(undefined);

interface EmotionsUIProviderProps {
  children: ReactNode;
}

export function EmotionsUIProvider({ children }: EmotionsUIProviderProps) {
  const { isEnabled } = useFeatureFlag();
  const [internalEmotion, setInternalEmotion] = useState<EmotionType>('neutral');

  const setCurrentEmotion = (emotion: EmotionType) => {
    // Feature Flag Check: Emotion Engine (Phase 2)
    if (!isEnabled('ENABLE_EMOTION_SEARCH')) {
      // If disabled, always force neutral
      setInternalEmotion('neutral');
      return;
    }
    setInternalEmotion(emotion);
  };

  const currentEmotion = isEnabled('ENABLE_EMOTION_SEARCH') ? internalEmotion : 'neutral';

  const getEmotionConfig = (emotion: EmotionType): EmotionConfig => {
    return EMOTION_CONFIGS[emotion];
  };

  const getAnimationConfig = (emotion: EmotionType) => {
    const config = getEmotionConfig(emotion);
    const speedMap = {
      slow: { duration: 800, easing: 'ease-out' as const, scale: 0.95 },
      normal: { duration: 500, easing: 'ease-in-out' as const, scale: 1.0 },
      fast: { duration: 300, easing: 'ease-in' as const, scale: 1.05 },
    };
    return speedMap[config.animationSpeed];
  };

  const getEmotionColors = (emotion: EmotionType) => {
    const config = getEmotionConfig(emotion);
    return {
      primary: config.primaryColor,
      secondary: config.secondaryColor,
      background: config.backgroundColor,
      text: config.textColor,
    };
  };

  const getPersonalityStyle = (emotion: EmotionType) => {
    const config = getEmotionConfig(emotion);
    const personalityMap = {
      energetic: { borderRadius: 20, shadowOpacity: 0.3, transform: { scale: 1.02, rotate: '0deg' } },
      calm: { borderRadius: 16, shadowOpacity: 0.1, transform: { scale: 0.98, rotate: '0deg' } },
      playful: { borderRadius: 24, shadowOpacity: 0.4, transform: { scale: 1.05, rotate: '2deg' } },
      cozy: { borderRadius: 12, shadowOpacity: 0.05, transform: { scale: 0.95, rotate: '-1deg' } },
      adventurous: { borderRadius: 18, shadowOpacity: 0.2, transform: { scale: 1.0, rotate: '0deg' } },
    };
    return personalityMap[config.personality];
  };

  const value: EmotionsUIContextType = {
    currentEmotion,
    setCurrentEmotion,
    getEmotionConfig,
    currentEmotionConfig: getEmotionConfig(currentEmotion),
    getAnimationConfig,
    getEmotionColors,
    getPersonalityStyle,
  };

  return (
    <EmotionsUIContext.Provider value={value}>
      {children}
    </EmotionsUIContext.Provider>
  );
}

export function useEmotionsUI() {
  const context = useContext(EmotionsUIContext);
  if (context === undefined) {
    throw new Error('useEmotionsUI must be used within an EmotionsUIProvider');
  }
  return context;
}

// Export emotion configs for direct use
export { EMOTION_CONFIGS };

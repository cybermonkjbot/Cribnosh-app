# 🍽️ Cribnosh: Shake to Eat — Production Feature

A delightful, Duolingo-style food discovery experience that uses device shake detection, emotion-based UI theming, and animated transitions to create a magical food recommendation journey.

## ✨ Features

### 🎯 Core Experience
- **Sustained Shake Detection**: Requires continuous shaking for 3+ seconds to trigger, preventing accidental activations
- **Shake Detection**: Uses Expo sensors for reliable shake detection with configurable sensitivity
- **Emotion-Driven UI**: Dynamic theming based on user's emotional state
- **Animated Mood Picker**: Playful emotion selection with bounce animations
- **Gacha Meal Spinner**: Slot machine-style meal category selection
- **Magic Portal Transition**: Mystical transition with particle effects
- **AI Chat Integration**: Seamless launch into AI-powered food recommendations

### 🎨 Design Philosophy
- **Duolingo-inspired**: Playful, rewarding, and emotionally engaging
- **Cribnosh Brand**: Uses your signature red (`#FF3B30`) and green (`#22c55e`) colors
- **NativeWind Styling**: Consistent with your existing design system
- **Expo-Only**: No external dependencies, pure Expo implementation

## 🏗️ Architecture

### Component Structure
```
ShakeToEatFlow (Main Orchestrator)
├── AnimatedMoodButton (Emotion Selection)
├── GachaMealSpinner (Meal Category Selection)
├── NoshMagicPortal (Transition Animation)
└── useShakeDetection (Sensor Hook)
    ├── Sustained Shake Detection (3+ seconds)
    ├── Progress Tracking
    └── Cooldown Management
```

### State Management
- **EmotionsUIContext**: Centralized emotion-based theming
- **Flow State Machine**: Manages step transitions (idle → intro → mood-picker → spinning → portal → ai-chat)
- **Local Component State**: Individual component animations and interactions

## 📦 Dependencies

### Required (Already Installed)
- `expo-sensors` - Shake detection
- `expo-haptics` - Haptic feedback
- `expo-av` - Audio support (future)
- `react-native-reanimated` - Smooth animations
- `expo-linear-gradient` - Gradient effects
- `nativewind` - Styling

### No External Dependencies
- Pure Expo implementation
- No `react-native-shake` or `lottie-react-native` needed
- Custom animations using Reanimated

## 🚀 Quick Start

### 1. Integration
```tsx
import { ShakeToEatFlow } from '@/components/ui/ShakeToEatFlow';

function YourComponent() {
  const [isVisible, setIsVisible] = useState(false);
  
  const handleAIChatLaunch = (prompt: string) => {
    // Launch your AI chat with the generated prompt
    console.log('AI Prompt:', prompt);
  };

  return (
    <ShakeToEatFlow
      isVisible={isVisible}
      onClose={() => setIsVisible(false)}
      onAIChatLaunch={handleAIChatLaunch}
    />
  );
}
```

### 2. Demo Page
Visit `/shake-to-eat-demo` to test the complete experience.

## 🎭 Emotion System

### Available Emotions
- **😋 Hungry** - Energetic, fast animations, red theme
- **🥱 Tired** - Calm, slow animations, purple theme
- **🥳 Excited** - Playful, fast animations, golden theme
- **💔 Sad** - Cozy, slow animations, muted theme
- **😶‍🌫️ Neutral** - Adventurous, normal animations, green theme
- **😰 Stressed** - Energetic, fast animations, stress red theme

### Emotion Configuration
Each emotion includes:
- **Colors**: Primary, secondary, background, text
- **Animation Speed**: slow, normal, fast
- **Personality**: energetic, calm, playful, cozy, adventurous
- **Haptic Pattern**: light, medium, heavy
- **Sound Effects**: (future implementation)

## 🍽️ Meal Categories

### Available Categories
1. **Comfort Food** - Warm, hearty dishes
2. **Quick Bites** - Fast, satisfying snacks
3. **Indulgent Treats** - Decadent desserts
4. **Energizing Meals** - Nutritious power foods
5. **Spicy Adventures** - Bold, flavorful dishes
6. **Cozy Beverages** - Warm, soothing drinks
7. **Fresh & Crisp** - Light, refreshing dishes
8. **Hearty Classics** - Traditional favorites

### Emotion Mapping
Each meal category is mapped to suitable emotions for intelligent recommendations.

## 🎮 User Experience Flow

### 1. Shake Detection
- Device shake triggers the experience
- Haptic feedback confirms activation
- 3-second cooldown prevents accidental triggers

### 2. Intro Animation
- Smooth modal entrance with spring animation
- Cribnosh branding with gradient effects
- Clear call-to-action

### 3. Mood Selection
- Horizontal grid of animated emotion buttons
- Each emotion has unique colors and animations
- Bounce effects on selection

### 4. Meal Spinner
- Gacha-style slot machine animation
- 3-second spinning duration
- Random selection with emotion weighting
- Celebration animation on reveal

### 5. Magic Portal
- Full-screen overlay with particle effects
- Swirling animations around central portal
- 3-second mystical transition
- Emotion and meal-specific theming

### 6. AI Chat Launch
- Generated prompt: `"I'm feeling {mood}. Surprise me with something to eat like {mealCategory}. Make it fun and crave-worthy."`
- Seamless transition to your AI chat component

## 🎨 Customization

### Colors
```tsx
// Update emotion colors in EmotionsUIContext.tsx
const EMOTION_CONFIGS = {
  hungry: {
    primaryColor: '#FF3B30', // Your Cribnosh red
    secondaryColor: '#FF6B6B',
    // ... other colors
  }
};
```

### Animations
```tsx
// Adjust animation speeds in EmotionsUIContext.tsx
const speedMap = {
  slow: { duration: 800, easing: 'ease-out', scale: 0.95 },
  normal: { duration: 500, easing: 'ease-in-out', scale: 1.0 },
  fast: { duration: 300, easing: 'ease-in', scale: 1.05 },
};
```

### Shake Sensitivity
```tsx
// Configure in useShakeDetection hook
const { isShaking, sustainedShakeProgress, isSustainedShaking } = useShakeDetection(onShake, {
  threshold: 15,                    // Lower = more sensitive
  cooldownMs: 3000,                // Time between sustained shakes
  sensitivity: 'medium',           // 'low' | 'medium' | 'high'
  sustainedShakeDuration: 3000,    // Duration in ms for sustained shake (3 seconds)
  debug: false                     // Enable for debugging
});
```

## 🔧 Technical Details

### Performance Optimizations
- **Reanimated 3**: All animations use native driver
- **Memoized Components**: Prevents unnecessary re-renders
- **Efficient State Management**: Minimal state updates
- **Lazy Loading**: Components load only when needed

### Accessibility
- **Haptic Feedback**: Confirms user interactions
- **Visual Feedback**: Clear state indicators
- **Touch Targets**: Minimum 44px touch areas
- **Color Contrast**: WCAG compliant color combinations

### Error Handling
- **Sensor Permissions**: Graceful fallback if sensors unavailable
- **Animation Interruptions**: Proper cleanup on component unmount
- **State Recovery**: Automatic reset on errors

## 🚀 Future Enhancements

### Planned Features
- **Sound Effects**: Audio feedback for each emotion
- **Mascot Integration**: Animated character guidance
- **Reward System**: Points and achievements
- **Social Sharing**: Share meal discoveries
- **Personalization**: Learn from user preferences

### Technical Improvements
- **Offline Support**: Cache meal categories locally
- **Analytics**: Track user engagement and preferences
- **A/B Testing**: Test different animation styles
- **Performance Monitoring**: Track animation frame rates

## 🐛 Troubleshooting

### Common Issues

**Shake not detected:**
- Check device permissions for sensors
- Adjust sensitivity in `useShakeDetection`
- Ensure device supports accelerometer

**Animations laggy:**
- Verify Reanimated 3 is properly configured
- Check for heavy operations in animation callbacks
- Monitor device performance

**Modal not showing:**
- Ensure `isVisible` prop is properly managed
- Check z-index and positioning
- Verify component is mounted

### Sustained Shake Detection
The shake detection now requires **continuous shaking for 3 seconds** before triggering the callback. This prevents accidental activations and provides better user control.

**Key Features:**
- **Progress Tracking**: Real-time progress indicator (0-100%)
- **Interruption Handling**: Resets if shaking stops before completion
- **Visual Feedback**: Shows sustained shake state and progress
- **Cooldown Period**: Prevents rapid successive activations

**Usage:**
```tsx
const { 
  isShaking,              // Current shake state
  isSustainedShaking,     // Whether in sustained shake mode
  sustainedShakeProgress, // Progress from 0 to 1
  shakeCount              // Total completed shakes
} = useShakeDetection(onShake, {
  sustainedShakeDuration: 3000 // 3 seconds
});
```

### Debug Mode
```tsx
// Enable debug logging
const { isShaking, shakeCount, sustainedShakeProgress } = useShakeDetection(onShake, {
  debug: true // Add this to see shake detection logs
});
```

## 📱 Platform Support

- **iOS**: Full support with native animations
- **Android**: Full support with native animations
- **Web**: Limited (no shake detection, but manual trigger works)

## 🎯 Integration Examples

### With Existing AI Chat
```tsx
function MainScreen() {
  const [showShakeToEat, setShowShakeToEat] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleAIChatLaunch = (prompt: string) => {
    setAiPrompt(prompt);
    setShowAIChat(true);
    setShowShakeToEat(false);
  };

  return (
    <>
      <YourMainContent />
      <ShakeToEatFlow
        isVisible={showShakeToEat}
        onClose={() => setShowShakeToEat(false)}
        onAIChatLaunch={handleAIChatLaunch}
      />
      <YourAIChat
        isVisible={showAIChat}
        initialPrompt={aiPrompt}
        onClose={() => setShowAIChat(false)}
      />
    </>
  );
}
```

### With Navigation
```tsx
import { useRouter } from 'expo-router';

function ShakeToEatWithNavigation() {
  const router = useRouter();

  const handleAIChatLaunch = (prompt: string) => {
    router.push({
      pathname: '/ai-chat',
      params: { prompt: encodeURIComponent(prompt) }
    });
  };

  return (
    <ShakeToEatFlow
      isVisible={true}
      onClose={() => router.back()}
      onAIChatLaunch={handleAIChatLaunch}
    />
  );
}
```

---

**Ready to create magical food discovery experiences! 🍽️✨** 
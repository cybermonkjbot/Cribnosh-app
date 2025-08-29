# Generating Suggestions Loader

A full-screen animated loader component that displays while AI is generating personalized suggestions, with smooth transitions to the AIChatDrawer.

## Features

- **Full Screen Modal**: Covers the entire screen with a beautiful gradient background
- **Animated Mascot**: Shows different emotions as the AI progresses through different stages
- **Progressive Loading States**: Displays 4 different loading messages with smooth transitions
- **Progress Indicators**: Visual dots showing current progress through the generation process
- **Smooth Animations**: Fade in/out, scale, and rotation animations using Reanimated
- **AI Branding**: Uses CribNosh red color and consistent design language

## Loading States

The loader progresses through these states automatically:

1. **"Analyzing your preferences..."** - Mascot shows 'excited' emotion
2. **"Scanning available options..."** - Mascot shows 'hungry' emotion  
3. **"Crafting personalized suggestions..."** - Mascot shows 'satisfied' emotion
4. **"Almost ready with your recommendations!"** - Mascot shows 'happy' emotion

## Usage

### Basic Implementation

```tsx
import { GeneratingSuggestionsLoader } from './components/ui/GeneratingSuggestionsLoader';
import { AIChatDrawer } from './components/ui/AIChatDrawer';

const [showLoader, setShowLoader] = useState(false);
const [showChat, setShowChat] = useState(false);

const handleStartGenerating = () => {
  setShowLoader(true);
  setShowChat(false);
};

const handleLoaderComplete = () => {
  setShowLoader(false);
  setShowChat(true);
};

const handleCloseChat = () => {
  setShowChat(false);
};

return (
  <>
    <TouchableOpacity onPress={handleStartGenerating}>
      <Text>Generate AI Suggestions</Text>
    </TouchableOpacity>

    <GeneratingSuggestionsLoader
      isVisible={showLoader}
      onComplete={handleLoaderComplete}
    />

    <AIChatDrawer
      isVisible={showChat}
      onClose={handleCloseChat}
    />
  </>
);
```

### Integration with Existing Components

```tsx
// In your main component or screen
const [isGenerating, setIsGenerating] = useState(false);
const [showAIChat, setShowAIChat] = useState(false);

const handleGenerateSuggestions = async () => {
  setIsGenerating(true);
  
  // Your AI generation logic here
  // await generateAISuggestions();
  
  // The loader will automatically complete after ~6 seconds
  // and call onComplete, which will show the chat
};

const handleLoaderComplete = () => {
  setIsGenerating(false);
  setShowAIChat(true);
};

return (
  <>
    {/* Your existing content */}
    
    <GeneratingSuggestionsLoader
      isVisible={isGenerating}
      onComplete={handleLoaderComplete}
    />
    
    <AIChatDrawer
      isVisible={showAIChat}
      onClose={() => setShowAIChat(false)}
    />
  </>
);
```

## Props

### GeneratingSuggestionsLoader

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isVisible` | `boolean` | Yes | Controls whether the loader is displayed |
| `onComplete` | `() => void` | Yes | Callback function called when loading completes |

## Customization

### Timing

The loader automatically progresses through states every 1.5 seconds. To customize:

```tsx
// In the GeneratingSuggestionsLoader component
const progressInterval = setInterval(() => {
  // Change 1500 to your desired interval
}, 1500);
```

### Loading States

To modify the loading messages or emotions:

```tsx
const loadingStates: LoadingState[] = [
  { 
    text: 'Your custom message...',
    emotion: 'excited' as const
  },
  // Add more states as needed
];
```

### Colors

The component uses your app's color scheme:

- **Background**: Home page gradient (`#f8e6f0` to `#faf2e8`)
- **Progress Dots**: CribNosh red (`#dc2626`)
- **Text**: Dark gray (`#1A202C`)

## Animation Details

### Entrance Animation
- **Duration**: 500ms
- **Effects**: Fade in + scale from 0.8 to 1.0

### State Transitions
- **Duration**: 400ms
- **Effects**: Fade in + slide up from 20px

### Completion Animation
- **Duration**: 500ms
- **Effects**: Fade out + scale to 0.8

### Continuous Rotation
- **Duration**: 2 seconds per rotation
- **Effect**: Continuous 360° rotation for visual interest

## Dependencies

- `react-native-reanimated` (v3+)
- `expo-blur` for the blur effect
- `expo-linear-gradient` for the background gradient
- `../Mascot` component for the animated mascot

## Best Practices

1. **Show Loader First**: Always show the loader before the AIChatDrawer
2. **Handle Completion**: Use the `onComplete` callback to transition to the chat
3. **Prevent Back Button**: The loader prevents Android back button from closing during generation
4. **Consistent Timing**: The loader takes ~6 seconds total, plan your AI generation accordingly
5. **Error Handling**: Consider adding error states if AI generation fails

## Demo Component

Use `GeneratingSuggestionsDemo` to test the complete flow:

```tsx
import { GeneratingSuggestionsDemo } from './components/ui/GeneratingSuggestionsDemo';

// In your app
<GeneratingSuggestionsDemo />
```

This provides a complete working example of the loader → chat transition flow.

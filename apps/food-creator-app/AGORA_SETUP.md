# Agora Live Streaming Setup

This app uses Agora SDK for live video streaming functionality. Follow these steps to set up and use live streaming.

## Prerequisites

1. **Agora Account**: Sign up at https://console.agora.io/
2. **Agora App ID and Certificate**: Get these from your Agora console
3. **Expo Dev Client**: Agora requires native code, so you need a dev client build (not Expo Go)

## Installation

1. **Install dependencies** (already added to package.json):
   ```bash
   bun install
   ```

2. **Configure Environment Variables**:
   Add these to your Convex environment variables:
   - `AGORA_APP_ID`: Your Agora App ID
   - `AGORA_APP_CERTIFICATE`: Your Agora App Certificate

   You can set these in your Convex dashboard under Settings > Environment Variables.

3. **Rebuild the app** (required for native modules):
   ```bash
   # For iOS
   npx expo prebuild
   npx expo run:ios

   # For Android
   npx expo prebuild
   npx expo run:android
   ```

## How It Works

1. **Starting a Stream**:
   - When a food creator starts a live stream, the app:
     - Creates a live session in Convex
     - Generates a unique channel name
     - Gets an Agora broadcaster token from the backend
     - Initializes the Agora SDK
     - Connects to the Agora channel and starts publishing the camera feed

2. **Streaming Flow**:
   - Camera feed is captured using `expo-camera`
   - Agora SDK handles the video encoding and streaming
   - Viewers can join using the same channel name with a subscriber token

3. **Camera Controls**:
   - Flip camera button switches both the Expo camera view and Agora stream
   - The stream automatically uses the device's camera

## Troubleshooting

### "Agora SDK not available" Error
- Make sure `react-native-agora` is installed: `bun add react-native-agora`
- Rebuild the app after installing: `npx expo prebuild && npx expo run:ios`

### Stream Not Starting
- Check that `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are set in Convex
- Verify your Agora account is active
- Check device camera permissions

### Camera Not Working
- Ensure camera permissions are granted
- Try restarting the app
- Check that you're using a dev client build (not Expo Go)

## Notes

- The Agora SDK requires native code, so this won't work in Expo Go
- You must use `expo-dev-client` and rebuild the app
- The streaming uses Agora's RTC (Real-Time Communication) protocol
- Video quality and bitrate are automatically optimized by Agora


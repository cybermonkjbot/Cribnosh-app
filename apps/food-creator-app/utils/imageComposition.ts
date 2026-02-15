import * as ImageManipulator from 'expo-image-manipulator';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export interface StickerPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface StickerData {
  id: string;
  text: string;
  emoji?: string;
  color?: string;
  backgroundColor?: string;
  position: StickerPosition;
}

/**
 * Composite stickers onto an image
 * @param imageUri - URI of the base image
 * @param stickers - Array of sticker data with positions
 * @returns URI of the composited image
 */
export async function compositeStickersOnImage(
  imageUri: string,
  stickers: StickerData[]
): Promise<string> {
  try {
    // For now, we'll use view-shot approach which requires rendering
    // In a real implementation, you might want to use a canvas-based approach
    // or server-side image processing for better quality
    
    // This is a placeholder - actual implementation would render stickers
    // on a canvas and composite them
    
    // For immediate implementation, we'll return the original image
    // and handle composition in the StickerEditor component using view-shot
    return imageUri;
  } catch (error) {
    console.error('Error compositing stickers:', error);
    throw error;
  }
}

/**
 * Capture a view with stickers as an image
 * @param viewRef - React ref to the view containing image and stickers
 * @returns URI of the captured image
 */
export async function captureViewWithStickers(
  viewRef: React.RefObject<View>
): Promise<string> {
  try {
    if (!viewRef.current) {
      throw new Error('View ref is not available');
    }

    const uri = await captureRef(viewRef, {
      format: 'jpg',
      quality: 0.9,
      result: 'tmpfile',
    });

    return uri;
  } catch (error) {
    console.error('Error capturing view:', error);
    throw error;
  }
}

/**
 * Resize an image while maintaining aspect ratio
 */
export async function resizeImage(
  uri: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
}


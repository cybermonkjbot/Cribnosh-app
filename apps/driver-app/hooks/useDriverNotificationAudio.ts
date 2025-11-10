import { useAudioPlayer } from 'expo-audio';

/**
 * Custom hook for driver order notification audio
 * This hook manages the audio player for driver order notifications
 */
export function useDriverNotificationAudio() {
  const audioPlayer = useAudioPlayer(require('../assets/sounds/order-notification.mp3'));

  const playNewOrder = () => {
    audioPlayer.play();
  };

  const replayNotification = () => {
    audioPlayer.seekTo(0);
    audioPlayer.play();
  };

  const playUrgentOrder = () => {
    // Play the notification sound twice for urgent orders
    audioPlayer.play();
    setTimeout(() => {
      audioPlayer.seekTo(0);
      audioPlayer.play();
    }, 500);
  };

  return {
    audioPlayer,
    playNewOrder,
    replayNotification,
    playUrgentOrder,
  };
}

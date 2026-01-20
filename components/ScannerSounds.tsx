import { useAudioPlayer } from 'expo-audio';

export function useScannerSounds() {
  const successPlayer = useAudioPlayer(
    require('@/assets/sounds/beep-sound.wav'),
  );
  const errorPlayer = useAudioPlayer(
    require('@/assets/sounds/invalid-selection-39351.mp3'),
  );
  const warningPlayer = useAudioPlayer(
    require('@/assets/sounds/warning-sound.wav'),
  );

  const playSound = async (player: ReturnType<typeof useAudioPlayer>) => {
    try {
      player.seekTo(0);
      player.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  return {
    playSuccess: () => playSound(successPlayer),
    playError: () => playSound(errorPlayer),
    playWarning: () => playSound(warningPlayer),
  };
}

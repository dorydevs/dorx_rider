import { useEffect } from 'react';
import { Platform } from 'react-native';

interface UseWebDialogKeysOptions {
  onEnter?: () => void;
  onDismiss?: () => void;
}

/**
 * Web-only keyboard shortcuts for transient dialog-like UI (e.g. the scan
 * result alert): Enter triggers `onEnter` (typically a retry action), Esc
 * triggers `onDismiss`. No-ops on native (Platform.OS !== 'web'), matching
 * the guard style used elsewhere in this app for web-specific behavior.
 */
export function useWebDialogKeys({ onEnter, onDismiss }: UseWebDialogKeysOptions) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && onEnter) {
        onEnter();
      } else if (event.key === 'Escape' && onDismiss) {
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, onDismiss]);
}

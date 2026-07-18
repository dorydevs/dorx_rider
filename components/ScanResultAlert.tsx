import { useWebDialogKeys } from '@/hooks/useWebDialogKeys';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type ScanAlertColor = 'green' | 'red' | 'orange' | 'yellow' | 'blue';

interface ScanResultAlertProps {
  visible: boolean;
  loading?: boolean;
  loadingText?: string;
  color: ScanAlertColor;
  message: string;
  /** Optional scanned code/order number shown above the message. Pass
   * `undefined` from the caller to hide it for a given state. */
  code?: string;
  /** Optional retry action — renders a small outline button. Omitted by
   * default so existing call sites are unaffected. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Optional dismiss action, also wired to Esc on web via useWebDialogKeys. */
  onDismiss?: () => void;
}

const TONE: Record<ScanAlertColor, { accent: string; bg: string }> = {
  green: { accent: '#00BF63', bg: '#00BF6315' },
  red: { accent: '#EF4444', bg: '#EF444412' },
  orange: { accent: '#F59E0B', bg: '#F59E0B15' },
  yellow: { accent: '#F59E0B', bg: '#F59E0B15' },
  blue: { accent: '#64748B', bg: '#64748B12' },
};

const ICON: Record<ScanAlertColor, keyof typeof Ionicons.glyphMap> = {
  green: 'checkmark-circle',
  red: 'close-circle',
  orange: 'alert-circle',
  yellow: 'alert-circle',
  blue: 'information-circle',
};

/**
 * Single-weight scan result card shown after a barcode is read: a tinted
 * background (no border/shadow stack) with a colored icon + message, or a
 * loading row while the scan is being validated. Reused across every
 * scanner screen — pass the screen's own `alertColor` string directly as
 * `color`. Animates in on `visible=true` and plays a fade+slide exit before
 * unmounting on `visible=false` (each screen's own auto-hide `setTimeout`
 * duration is untouched — this only wraps the transition, it doesn't change
 * when `visible` flips).
 */
export function ScanResultAlert({
  visible,
  loading = false,
  loadingText = 'Scanning…',
  color,
  message,
  code,
  onRetry,
  retryLabel,
  onDismiss,
}: ScanResultAlertProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (shouldRender) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShouldRender(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useWebDialogKeys({ onEnter: onRetry, onDismiss });

  if (!shouldRender) return null;

  const { accent, bg } = TONE[color] ?? TONE.green;
  const icon = ICON[color] ?? 'information-circle';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: bg,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator size="small" color={accent} />
          <Text style={[styles.message, { color: accent }]}>
            {loadingText}
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {code ? <Text style={styles.code}>{code}</Text> : null}
          <View style={styles.row}>
            <Ionicons name={icon} size={20} color={accent} />
            <Text style={[styles.message, { color: accent }]}>{message}</Text>
          </View>
          {onRetry ? (
            <TouchableOpacity
              onPress={onRetry}
              activeOpacity={0.75}
              style={[styles.retryButton, { borderColor: accent }]}
            >
              <Text style={[styles.retryText, { color: accent }]}>
                {retryLabel ?? 'Retry'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  content: {
    alignItems: 'center',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  code: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  message: {
    fontSize: 15,
    fontWeight: '700',
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

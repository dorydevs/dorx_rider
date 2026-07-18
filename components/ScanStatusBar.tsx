import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ScanStatusBarProps {
  loading: boolean;
  readyText?: string;
  processingText?: string;
}

/**
 * Slim centered status pill shown above/below the camera view while idle
 * between scans. Minimalist by design: a single colored dot + one line of
 * text, background tint only (no border/shadow/micro-label stack).
 */
export function ScanStatusBar({
  loading,
  readyText = 'Ready to scan',
  processingText = 'Processing…',
}: ScanStatusBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.pill, loading && styles.pillLoading]}>
        <View style={[styles.dot, loading && styles.dotLoading]} />
        <Text style={[styles.text, loading && styles.textLoading]}>
          {loading ? processingText : readyText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginTop: 14,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#00BF6315',
  },
  pillLoading: {
    backgroundColor: '#F59E0B15',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00BF63',
  },
  dotLoading: {
    backgroundColor: '#F59E0B',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  textLoading: {
    color: '#B45309',
  },
});

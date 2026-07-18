import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ScanInstructionBannerProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

/**
 * Contextual "what to scan" instruction card shown above the camera on
 * scanner screens that need it (e.g. mid-mile operator QR flows). Mirrors
 * the app's standard card chrome (white surface, thin border, soft shadow)
 * rather than a saturated color banner, per the minimalist direction.
 */
export function ScanInstructionBanner({
  icon,
  title,
  subtitle,
}: ScanInstructionBannerProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconChip}>{icon}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00BF6315',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
});

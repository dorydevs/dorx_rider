import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type ScanStatsTone = 'brand' | 'warning' | 'error';

interface ScanStatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  tone?: ScanStatsTone;
}

const TONE: Record<ScanStatsTone, { accent: string; tint: string }> = {
  brand: { accent: '#00BF63', tint: '#00BF6315' },
  warning: { accent: '#F59E0B', tint: '#F59E0B15' },
  error: { accent: '#EF4444', tint: '#EF444412' },
};

/**
 * Neutral (non color-block) stats/summary card used at the bottom of every
 * scanner screen — covers both the "running count" use case (pending items,
 * session total scanned, operators scanned) and the "result detail" use
 * case (destination barangay/city/region, routing info, linked item count)
 * via the same {icon, label, value, subtext?} shape. `tone` only colors the
 * icon chip + value text, keeping the card itself a restrained white
 * surface consistent with the rest of the app's card language.
 */
export function ScanStatsCard({
  icon,
  label,
  value,
  subtext,
  tone = 'brand',
}: ScanStatsCardProps) {
  const { accent, tint } = TONE[tone];

  return (
    <View style={styles.card}>
      <View style={[styles.iconChip, { backgroundColor: tint }]}>{icon}</View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: accent }]} numberOfLines={2}>
          {value}
        </Text>
        {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
});

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export interface ScanDetailCardProps {
  visible: boolean;
  waybillNumber: string;
  parcelStatus: string;
  statusTone?: 'brand' | 'warning';
  senderName?: string;
  receiverName?: string;
  destination?: string;
  scanTime?: string;
}

interface DetailRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconBg?: string;
  iconColor?: string;
  valueColor?: string;
}

function DetailRow({
  icon,
  label,
  value,
  iconBg = '#F1F5F9',
  iconColor = '#64748B',
  valueColor = '#0F172A',
}: DetailRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

/**
 * Multi-field "Scan Result Card" — modeled on the infoCard/infoRow/divider
 * pattern from Dorx-Operator's `midmile-scan-success.tsx`, extracted into a
 * reusable component. Renders only on a successful scan, alongside (not
 * replacing) `ScanResultAlert`. Fade + slide-up entrance on mount when
 * `visible` becomes true; no exit animation (the caller simply stops
 * rendering it).
 */
export function ScanDetailCard({
  visible,
  waybillNumber,
  parcelStatus,
  statusTone = 'brand',
  senderName,
  receiverName,
  destination,
  scanTime,
}: ScanDetailCardProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, anim]);

  if (!visible) return null;

  const statusColor = statusTone === 'warning' ? '#F59E0B' : '#00BF63';
  const statusBg = statusTone === 'warning' ? '#F59E0B15' : '#00BF6315';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <DetailRow
        icon="barcode-outline"
        label="Waybill Number"
        value={waybillNumber}
      />
      <View style={styles.divider} />
      <DetailRow
        icon="information-circle-outline"
        label="Status"
        value={parcelStatus}
        iconBg={statusBg}
        iconColor={statusColor}
        valueColor={statusColor}
      />
      {senderName ? (
        <>
          <View style={styles.divider} />
          <DetailRow icon="person-outline" label="Sender" value={senderName} />
        </>
      ) : null}
      {receiverName ? (
        <>
          <View style={styles.divider} />
          <DetailRow
            icon="person-outline"
            label="Receiver"
            value={receiverName}
          />
        </>
      ) : null}
      {destination ? (
        <>
          <View style={styles.divider} />
          <DetailRow
            icon="location-outline"
            label="Destination"
            value={destination}
          />
        </>
      ) : null}
      {scanTime ? (
        <>
          <View style={styles.divider} />
          <DetailRow icon="time-outline" label="Scanned At" value={scanTime} />
        </>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: -16,
  },
});

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface InboundTopCardProps {
  username?: string;
  barangay?: string;
  city?: string;
  province?: string;
  title: string;
  totalCount: number;
  isLoading?: boolean;
}

export function InboundTopCard({
  username,
  barangay,
  city,
  province,
  title,
  totalCount,
  isLoading = false,
}: InboundTopCardProps) {
  return (
    <LinearGradient
      colors={['#00BF63', '#009950']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.topCard}
    >
      {/* Decorative depth shapes */}
      <View pointerEvents="none" style={styles.decorCircleLarge} />
      <View pointerEvents="none" style={styles.decorCircleSmall} />

      <View style={styles.headerRow}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={22} color="#00BF63" />
          </View>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {username}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color="rgba(255,255,255,0.75)"
            />
            <Text style={styles.address} numberOfLines={1}>
              {barangay}, {city}, {province}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color="#00BF63"
              style={styles.statLoader}
            />
          ) : (
            <Text style={styles.statText}>{totalCount}</Text>
          )}
        </View>
        <View style={styles.statIconContainer}>
          <Ionicons name="cube" size={22} color="#00BF63" />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topCard: {
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#00BF63',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  decorCircleLarge: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -60,
    right: -40,
  },
  decorCircleSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -30,
    left: -20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  address: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  statText: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLoader: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#00BF6315',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

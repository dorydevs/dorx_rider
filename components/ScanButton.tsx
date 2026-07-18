import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ScanButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

export function ScanButton({
  onPress,
  disabled = false,
  loading = false,
  label = 'Start Scanning',
}: ScanButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isInactive = disabled || loading;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress}
          disabled={isInactive}
          activeOpacity={0.85}
          onPressIn={() => !isInactive && animateTo(0.97)}
          onPressOut={() => !isInactive && animateTo(1)}
          style={[styles.scanBtn, isInactive && styles.scanBtnDisabled]}
        >
          {loading ? (
            <View style={styles.iconContainer}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <View style={styles.iconContainer}>
              <Ionicons name="qr-code" size={22} color="#fff" />
            </View>
          )}
          <Text style={styles.scanText}>
            {loading ? 'Loading...' : label}
          </Text>
          {!isInactive && (
            <View style={styles.chevronContainer}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  scanBtn: {
    backgroundColor: '#00BF63',
    borderRadius: 16,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingLeft: 8,
    paddingRight: 16,
    shadowColor: '#00BF63',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  scanBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

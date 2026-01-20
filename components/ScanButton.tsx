import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

interface ScanButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function ScanButton({
  onPress,
  disabled = false,
  loading = false,
}: ScanButtonProps) {
  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        buttonColor="#334155"
        textColor="#fff"
        icon="qrcode-scan"
        onPress={onPress}
        disabled={disabled || loading}
        style={styles.scanBtn}
        loading={loading}
      >
        Scan
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 18,
    marginBottom: 8,
  },
  scanBtn: {
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface BarcodeScannerProps {
  onScan: (data: { data: string }) => void;
  scanned: boolean;
}

type CameraStatus =
  | 'requesting-permission'
  | 'permission-denied'
  | 'initializing'
  | 'active'
  | 'not-found';

const SCANNER_HEIGHT = 300;
const FRAME_MARGIN_H = 16;
// Top margin is taller than the bottom so the frame clears the status badge
// pinned at top:12 (badge is ~30px tall) instead of overlapping it.
const FRAME_MARGIN_TOP = 56;
const FRAME_MARGIN_BOTTOM = 24;
const FRAME_CORNER_SIZE = 28;
const FRAME_CORNER_THICKNESS = 3;
// The scan line's travel range is derived from the same frame margins so it
// stays visually contained inside the corner-bracket box instead of
// sweeping its own independent (and mismatched) range.
const SCAN_LINE_INSET = 6;
const SCAN_LINE_TOP = FRAME_MARGIN_TOP + SCAN_LINE_INSET;
const SCAN_LINE_BOTTOM = SCANNER_HEIGHT - FRAME_MARGIN_BOTTOM - SCAN_LINE_INSET;

export function BarcodeScanner({ onScan, scanned }: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [mountError, setMountError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const frameOpacity = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(1)).current;

  const status: CameraStatus = !permission
    ? 'requesting-permission'
    : !permission.granted
      ? 'permission-denied'
      : mountError
        ? 'not-found'
        : cameraReady
          ? 'active'
          : 'initializing';

  useEffect(() => {
    if (scanned) return;

    scanLinePosition.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLinePosition, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLinePosition, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [scanned, scanLinePosition]);

  // One-shot fade-in for the corner scan-frame once the camera view mounts.
  useEffect(() => {
    if (status === 'active' || status === 'initializing') {
      Animated.timing(frameOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      frameOpacity.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status === 'active' || status === 'initializing']);

  // Cross-fade the status badge whenever the camera transitions from
  // initializing to active.
  useEffect(() => {
    if (cameraReady) {
      badgeOpacity.setValue(0.35);
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [cameraReady, badgeOpacity]);

  const handleRetryMount = () => {
    setMountError(false);
    setCameraReady(false);
    setRetryKey((prev) => prev + 1);
  };

  const handlePermissionAction = () => {
    if (permission?.canAskAgain === false) {
      Linking.openSettings();
    } else {
      requestPermission();
    }
  };

  if (status === 'requesting-permission') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00BF63" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (status === 'permission-denied') {
    const canAskAgain = permission?.canAskAgain !== false;
    return (
      <View style={styles.stateContainer}>
        <View style={styles.stateIconWrap}>
          <Ionicons name="camera-outline" size={36} color="#00BF63" />
        </View>
        <Text style={styles.stateTitle}>Camera Access Needed</Text>
        <Text style={styles.stateMessage}>
          {canAskAgain
            ? 'Allow camera access to scan waybills and QR codes.'
            : 'Camera access was denied. Enable it in your device Settings to continue scanning.'}
        </Text>
        <TouchableOpacity
          style={styles.stateButton}
          onPress={handlePermissionAction}
          activeOpacity={0.85}
        >
          <Text style={styles.stateButtonText}>
            {canAskAgain ? 'Grant Permission' : 'Open Settings'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'not-found') {
    return (
      <View style={styles.stateContainer}>
        <View style={[styles.stateIconWrap, styles.stateIconWrapError]}>
          <Ionicons name="camera-outline" size={36} color="#EF4444" />
        </View>
        <Text style={styles.stateTitle}>Camera Unavailable</Text>
        <Text style={styles.stateMessage}>
          We couldn&apos;t start the camera on this device. Please try again.
        </Text>
        <TouchableOpacity
          style={styles.stateButton}
          onPress={handleRetryMount}
          activeOpacity={0.85}
        >
          <Text style={styles.stateButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        key={retryKey}
        onBarcodeScanned={scanned ? undefined : onScan}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'code128', 'code39'],
          interval: 100,
        }}
        autofocus="on"
        focusable={true}
        style={styles.scanner}
        onCameraReady={() => setCameraReady(true)}
        onMountError={() => setMountError(true)}
      />

      {/* Camera hardware status badge */}
      <Animated.View style={[styles.statusBadge, { opacity: badgeOpacity }]}>
        {status === 'initializing' ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.statusBadgeText}>Starting camera…</Text>
          </>
        ) : (
          <>
            <View style={styles.statusBadgeDot} />
            <Text style={styles.statusBadgeText}>Camera active</Text>
          </>
        )}
      </Animated.View>

      {/* Corner-bracket scan frame */}
      <Animated.View
        pointerEvents="none"
        style={[styles.frameLayer, { opacity: frameOpacity }]}
      >
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />
      </Animated.View>

      {!scanned && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.scanLine,
            {
              transform: [
                {
                  translateY: scanLinePosition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [SCAN_LINE_TOP, SCAN_LINE_BOTTOM],
                  }),
                },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
    color: '#64748B',
  },
  stateContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  stateIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#00BF6315',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stateIconWrapError: {
    backgroundColor: '#EF444412',
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  stateButton: {
    backgroundColor: '#00BF63',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  scannerContainer: {
    marginTop: 12,
    marginHorizontal: 10,
    height: SCANNER_HEIGHT,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#000',
  },
  scanner: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00BF63',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  frameLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: FRAME_CORNER_SIZE,
    height: FRAME_CORNER_SIZE,
    borderColor: '#00BF63',
  },
  cornerTopLeft: {
    top: FRAME_MARGIN_TOP,
    left: FRAME_MARGIN_H,
    borderTopWidth: FRAME_CORNER_THICKNESS,
    borderLeftWidth: FRAME_CORNER_THICKNESS,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: FRAME_MARGIN_TOP,
    right: FRAME_MARGIN_H,
    borderTopWidth: FRAME_CORNER_THICKNESS,
    borderRightWidth: FRAME_CORNER_THICKNESS,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: FRAME_MARGIN_BOTTOM,
    left: FRAME_MARGIN_H,
    borderBottomWidth: FRAME_CORNER_THICKNESS,
    borderLeftWidth: FRAME_CORNER_THICKNESS,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: FRAME_MARGIN_BOTTOM,
    right: FRAME_MARGIN_H,
    borderBottomWidth: FRAME_CORNER_THICKNESS,
    borderRightWidth: FRAME_CORNER_THICKNESS,
    borderBottomRightRadius: 8,
  },
  scanLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#00BF63',
    shadowColor: '#00BF63',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FRAME_SIZE = 256;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;
const FRAME_TOP_RATIO = 0.2;

interface BarcodeScannerProps {
  onScan: (data: { data: string }) => void;
  scanned: boolean;
  isProcessing?: boolean;
}

export function BarcodeScanner({
  onScan,
  scanned,
  isProcessing,
}: BarcodeScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [containerLayout, setContainerLayout] = useState({
    width: 0,
    height: 0,
  });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    scanLoop.start();
    return () => scanLoop.stop();
  }, []);

  useEffect(() => {
    if (isProcessing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isProcessing]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permissionIconBg}>
          <Ionicons name="camera-off-outline" size={48} color="#22c55e" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Allow camera access to scan barcodes and QR codes
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { width, height } = containerLayout;
  const frameLeft = width > 0 ? (width - FRAME_SIZE) / 2 : 80;
  const frameTop = height > 0 ? height * FRAME_TOP_RATIO : 100;
  const hasLayout = width > 0 && height > 0;

  const statusText = isProcessing
    ? "Processing..."
    : scanned
      ? "Camera Locked"
      : "Ready to Scan";
  const statusColor = isProcessing
    ? "#f59e0b"
    : scanned
      ? "#ef4444"
      : "#22c55e";

  return (
    <View
      style={styles.scannerWrapper}
      onLayout={(e) =>
        setContainerLayout({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
    >
      <CameraView
        facing="back"
        onBarcodeScanned={scanned ? undefined : onScan}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "code128", "code39"],
        }}
        style={StyleSheet.absoluteFillObject}
      />

      {hasLayout && (
        <>
          {/* Dark overlay: top */}
          <View
            style={[
              styles.overlayPanel,
              { top: 0, left: 0, right: 0, height: frameTop },
            ]}
          />
          {/* Dark overlay: bottom */}
          <View
            style={[
              styles.overlayPanel,
              {
                top: frameTop + FRAME_SIZE,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
          />
          {/* Dark overlay: left */}
          <View
            style={[
              styles.overlayPanel,
              {
                top: frameTop,
                left: 0,
                width: frameLeft,
                height: FRAME_SIZE,
              },
            ]}
          />
          {/* Dark overlay: right */}
          <View
            style={[
              styles.overlayPanel,
              {
                top: frameTop,
                left: frameLeft + FRAME_SIZE,
                right: 0,
                height: FRAME_SIZE,
              },
            ]}
          />

          {/* Scan frame with green corner brackets */}
          <View
            style={{
              position: "absolute",
              top: frameTop,
              left: frameLeft,
              width: FRAME_SIZE,
              height: FRAME_SIZE,
            }}
          >
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />

            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, FRAME_SIZE - 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>

          {/* Instructions & status pill below the frame */}
          <View
            style={[
              styles.instructionsContainer,
              { top: frameTop + FRAME_SIZE + 32 },
            ]}
          >
            <View style={styles.instructionRow}>
              <Ionicons
                name="barcode-outline"
                size={18}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.instructionText}>
                Place barcode inside the frame
              </Text>
            </View>

            <Animated.View
              style={[
                styles.statusPill,
                {
                  backgroundColor: statusColor,
                  borderColor:
                    statusColor === "#22c55e" ? "#16a34a" : statusColor,
                  opacity: isProcessing ? pulseAnim : 1,
                },
              ]}
            >
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>{statusText}</Text>
            </Animated.View>

            <Text style={styles.holdSteadyText}>
              Hold steady — auto-detects on focus
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scannerWrapper: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "#0a0a0a",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  permissionIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#052e16",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  permissionText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  overlayPanel: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#22c55e",
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  scanLine: {
    position: "absolute",
    left: 6,
    right: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  instructionsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 2,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  statusPillText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  holdSteadyText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "400",
  },
});

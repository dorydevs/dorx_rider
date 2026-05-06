import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FRAME_SIZE = SCREEN_WIDTH * 0.65;
const CORNER_LEN = 32;
const CORNER_W = 4;
const CORNER_R = 8;

export default function RtsFromHub() {
  const router = useRouter();
  const { playSuccess, playError, playWarning } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [scannedData, setScannedData] = useState<string[]>([]);
  const [alertColor, setAlertColor] = useState<"green" | "yellow" | "red">(
    "green",
  );

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const onScan = async (scannedCode: any) => {
    if (scanned) return;
    setScanResultMessage("");
    setScanned(true);
    setData(scannedCode);
  };

  useEffect(() => {
    async function processScan() {
      if (!data) return;

      if (!scannedData.includes(data.data)) {
        setLoadingScan(true);
        setScanResultMessage("");

        try {
          const orderDetail = await axiosInstance(userData.token).get(
            `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data.data}`,
          );

          if (!orderDetail.data) {
            throw new Error(
              "Order not found. Please check the waybill number.",
            );
          }

          // Validate RTS status
          if (orderDetail.data.rtsStatus !== "Received by hub") {
            setScanResultMessage(
              `Cannot scan: Item status is "${orderDetail.data.rtsStatus}". Only items with "Received by hub" status can be scanned.`,
            );
            setAlertColor("yellow");
            playWarning();
            setLoadingScan(false);
            setScanned(false);
            setTimeout(() => {
              setScanResultMessage("");
              setData("");
            }, 4000);
            return;
          }

          // Validate assigned barangay
          const assignedBarangays = userData.assignedBarangays || "[]";
          if (!assignedBarangays.includes(orderDetail.data.senderBarangay)) {
            setScanResultMessage(
              `Cannot scan: Sender barangay "${orderDetail.data.senderBarangay}" is not in your assigned areas.`,
            );
            setAlertColor("yellow");
            playWarning();
            setLoadingScan(false);
            setScanned(false);
            setTimeout(() => {
              setScanResultMessage("");
              setData("");
            }, 4000);
            return;
          }

          // Process the scan
          await axiosInstance(userData.token).put(
            `/api/rts-item-customer/rts-hub-to-so/${orderDetail.data.orderTransactionId}`,
          );

          playSuccess();
          setScannedData((prev) => [...prev, data.data]);
          setScanResultMessage(
            `✓ Item successfully scanned! Destination: ${orderDetail.data.receiverBarangay}`,
          );
          setAlertColor("green");
          setLoadingScan(false);
          setScanned(false);
          setTimeout(() => {
            setScanResultMessage("");
            setData("");
          }, 3000);
        } catch (error: any) {
          console.error("RTS FROM HUB SCANNING ERROR:", error);
          playError();
          setAlertColor("red");
          setLoadingScan(false);
          setScanned(false);

          let errorMessage = "Scanning failed. ";

          if (error.message === "Network Error" || !error.response) {
            errorMessage +=
              "Network connection error. Please check your internet and try again.";
          } else if (error.response?.status === 404) {
            errorMessage +=
              "Order not found. Please verify the waybill number.";
          } else if (error.response?.status === 400) {
            errorMessage +=
              error.response?.data?.message ||
              "Invalid request. Please try again.";
          } else if (error.response?.status === 401) {
            errorMessage += "Session expired. Please log in again.";
          } else if (error.response?.status === 500) {
            errorMessage += "Server error. Please contact support.";
          } else if (error.response?.data?.message) {
            errorMessage += error.response.data.message;
          } else if (error.message) {
            errorMessage += error.message;
          } else {
            errorMessage += "Unknown error occurred. Please try again.";
          }

          setScanResultMessage(errorMessage);
          setTimeout(() => {
            setScanResultMessage("");
            setData("");
          }, 5000);
        }
      } else {
        setScanResultMessage("⚠ This item has already been scanned.");
        setAlertColor("yellow");
        playWarning();
        setScanned(false);
        setLoadingScan(false);
        setTimeout(() => {
          setScanResultMessage("");
          setScanned(false);
          setData("");
        }, 3000);
      }
    }

    if (userData !== null) {
      processScan();
    }
  }, [data, userData]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        } else if (user) {
          setUserData(user);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [user]);

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - 2],
  });
  const isLocked = scanned && !loadingScan;
  const cornerColor = isLocked ? "#ef4444" : "#22c55e";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#22c55e" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>RTS from Hub</Text>
          <Text style={styles.subtitle}>Scan items received from hub</Text>
        </View>
      </View>

      <View style={styles.cameraContainer}>
        <BarcodeScanner
          onScan={onScan}
          scanned={scanned}
          containerStyle={styles.cameraFill}
        />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.dimTop} />
          <View style={styles.dimMiddleRow}>
            <View style={styles.dimSide} />
            <View
              style={[
                styles.frameContainer,
                { width: FRAME_SIZE, height: FRAME_SIZE },
              ]}
            >
              <Animated.View
                style={[
                  styles.corner,
                  styles.cTL,
                  { borderColor: cornerColor, opacity: glowAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.corner,
                  styles.cTR,
                  { borderColor: cornerColor, opacity: glowAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.corner,
                  styles.cBL,
                  { borderColor: cornerColor, opacity: glowAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.corner,
                  styles.cBR,
                  { borderColor: cornerColor, opacity: glowAnim },
                ]}
              />
              {!isLocked && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineY }] },
                  ]}
                />
              )}
              {isLocked && (
                <View style={styles.lockedOverlay}>
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={20} color="#fff" />
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                </View>
              )}
              {loadingScan && (
                <View style={styles.lockedOverlay}>
                  <View
                    style={[
                      styles.lockedBadge,
                      { backgroundColor: "rgba(34,197,94,0.85)" },
                    ]}
                  >
                    <Ionicons name="sync" size={20} color="#fff" />
                    <Text style={styles.lockedText}>Processing…</Text>
                  </View>
                </View>
              )}
            </View>
            <View style={styles.dimSide} />
          </View>
          <View style={styles.dimBottom}>
            <View style={styles.hintRow}>
              <Ionicons name="scan-outline" size={16} color="#a3e635" />
              <Text style={styles.hintText}>
                {loadingScan
                  ? "Fetching details…"
                  : isLocked
                    ? "Camera locked"
                    : "Place barcode inside the frame"}
              </Text>
            </View>
            <View
              style={[
                styles.pill,
                { backgroundColor: isLocked ? "#ef4444" : "#22c55e" },
              ]}
            >
              <View style={styles.pillDot} />
              <Text style={styles.pillText}>
                {loadingScan
                  ? "Processing"
                  : isLocked
                    ? "Locked"
                    : "Ready to Scan"}
              </Text>
            </View>
            {!isLocked && !loadingScan && (
              <Text style={styles.tipText}>
                Hold steady — auto-detects on focus
              </Text>
            )}
          </View>
        </View>
      </View>

      {scanResultMessage && (
        <View
          style={[
            styles.resultBanner,
            alertColor === "green"
              ? styles.resultSuccess
              : alertColor === "yellow"
                ? styles.resultWarning
                : styles.resultError,
          ]}
        >
          <Ionicons
            name={
              alertColor === "green"
                ? "checkmark-circle"
                : alertColor === "yellow"
                  ? "warning"
                  : "close-circle"
            }
            size={20}
            color={
              alertColor === "green"
                ? "#22c55e"
                : alertColor === "yellow"
                  ? "#f59e0b"
                  : "#ef4444"
            }
          />
          <Text
            style={[
              styles.resultText,
              alertColor === "green"
                ? styles.resultSuccessText
                : alertColor === "yellow"
                  ? styles.resultWarningText
                  : styles.resultErrorText,
            ]}
          >
            {scanResultMessage}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 54,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTextContainer: { flex: 1 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  subtitle: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  cameraContainer: { flex: 1, position: "relative", backgroundColor: "#000" },
  cameraFill: {
    flex: 1,
    margin: 0,
    marginTop: 0,
    marginHorizontal: 0,
    height: undefined,
    borderRadius: 0,
  },
  dimTop: { backgroundColor: "rgba(0,0,0,0.72)", flex: 1 },
  dimMiddleRow: { flexDirection: "row" },
  dimSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)" },
  dimBottom: {
    backgroundColor: "rgba(0,0,0,0.72)",
    flex: 1.3,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingBottom: 16,
  },
  frameContainer: { position: "relative" },
  corner: { position: "absolute", width: CORNER_LEN, height: CORNER_LEN },
  cTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderTopLeftRadius: CORNER_R,
  },
  cTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderTopRightRadius: CORNER_R,
  },
  cBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderBottomLeftRadius: CORNER_R,
  },
  cBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderBottomRightRadius: CORNER_R,
  },
  scanLine: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 2,
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.85)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  lockedText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  hintText: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  pillText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  tipText: { color: "#64748b", fontSize: 11, fontWeight: "500" },
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultSuccess: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  resultWarning: { backgroundColor: "#fef9c3", borderColor: "#fde68a" },
  resultError: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  resultText: { flex: 1, fontSize: 13, fontWeight: "600" },
  resultSuccessText: { color: "#16a34a" },
  resultWarningText: { color: "#d97706" },
  resultErrorText: { color: "#dc2626" },
});

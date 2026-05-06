import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { CheckCircle, TriangleAlert, XCircle } from "lucide-react-native";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

export default function HubScreen() {
  const router = useRouter();
  const { playSuccess, playError, playWarning } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [scannedData, setScannedData] = useState<string[]>([]);
  const [alertColor, setAlertColor] = useState("blue");
  const [barangayDestination, setBarangayDestination] = useState("");
  const [remittanceCheckerData, setRemittanceCheckerData] =
    useState<boolean>(false);
  const [remittanceLoading, setRemittanceLoading] = useState<boolean>(false);

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
    console.log("scanned : >> ", scanned);
    setScanResultMessage("");
    setScanned(true);
    setData(scannedCode);
  };

  useEffect(() => {
    async function processScan() {
      if (!data) return;
      if (!scannedData.includes(data)) {
        setLoadingScan(true);

        // scan waybill
        try {
          // validation: order status should be 'Received by branch'
          // recipient barangay must be one of the assigned pickup area of the rider -- removed because pickup area is only applicable in getting the orders from clients
          // waybill status should be != 'In transit'
          // hub transaction origin must be 'Provincial Office'
          const orderDetail = await axiosInstance(userData.token).get(
            `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data.data}&hubTransactionOriginProvince=${true}`,
          );

          if (
            orderDetail.data.orderStatus === "Received by branch" &&
            orderDetail.data.waybillStatus === "In Transit" &&
            orderDetail.data?.hubTransaction.origin === "Provincial Office" &&
            orderDetail.data.receiverCity === userData.storeCity
          ) {
            const scanPayload = {
              orderNumber: data.data,
              status: "Picked up by rider from hub",
            };
            const transactionPayload = {
              status: "picked-up from hub",
              scannedDate: moment().format("YYYY-MM-DD hh:mm:ss"),
              riderId: userData.id,
              orderTransactionId: orderDetail.data.orderTransactionId,
            };

            playSuccess();
            // create rider transaction
            await axiosInstance(userData.token).post(
              `/api/riderTransaction`,
              transactionPayload,
            );
            // update order status
            const scanResponse = await axiosInstance(userData.token).put(
              `/api/orderTransactions/scanWaybill`,
              scanPayload,
            );

            setScannedData((prev) => [...prev, data]);
            setScanResultMessage(scanResponse.data.message);
            setBarangayDestination(orderDetail.data.receiverBarangay);
            setAlertColor("blue");
            setScanned(false);
          } else {
            console.log("NATAWAG? ");
            setScanResultMessage(
              `INVALID \n Item Status : ${orderDetail.data.waybillStatus}`,
            );
            setBarangayDestination("");
            setAlertColor("red");
            playError();
            setScanned(false);
          }
          setLoadingScan(false);
        } catch (error: any) {
          setLoadingScan(false);
          console.log("RIDER HUB SCANNING ERROR:", error);
          playError();
          setAlertColor("red");
          setScanResultMessage(`INVALID ${error}`);
          setScanned(false);
        } finally {
          setLoadingScan(false);
          setTimeout(() => {
            setScanned(false);
            setData("");
          }, 2000);
        }
      } else {
        setScanResultMessage("Already Scanned!");
        setAlertColor("red");
        setScanned(false);
        setLoadingScan(false);
        playError();
        setTimeout(() => {
          setScanned(false);
          setData("");
        }, 2000);
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
      } finally {
        console.log("SUCCESS");
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    const remittanceChecker = async () => {
      try {
        setRemittanceLoading(true);
        const soRemittanceChecker = await axiosInstance(userData.token).get(
          `/api/so_remittance_checker?soId=${userData?.storeId}`,
        );

        if (soRemittanceChecker.data.toRemitData.length !== 0) {
          const today = new Date();
          const hasDateDeliveredNotToday =
            soRemittanceChecker.data.toRemitData.some((item: any) => {
              if (!item?.dateDelivered) return false;
              const deliveredDate = new Date(item.dateDelivered);

              return deliveredDate.toDateString() !== today.toDateString();
            });

          setRemittanceCheckerData(hasDateDeliveredNotToday);
        }

        setRemittanceLoading(false);
      } catch (error) {
        setRemittanceLoading(false);
        console.log("RIDER REMITTANCE CHECKER ERROR:", error);
      }
    };
    if (userData !== null) {
      remittanceChecker();
    }
  }, [userData]);

  console.log("remittanceCheckerData : >> ", remittanceCheckerData);

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - 2],
  });
  const isLocked = scanned && !loadingScan;
  const cornerColor = isLocked ? "#ef4444" : "#22c55e";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#22c55e" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Hub Scanner</Text>
          <Text style={styles.subtitle}>Scan parcels received from hub</Text>
        </View>
        {scannedData.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{scannedData.length}</Text>
          </View>
        )}
      </View>

      {remittanceLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Checking remittance...</Text>
        </View>
      ) : remittanceCheckerData ? (
        <View style={styles.remittanceContainer}>
          <View style={styles.remittanceCard}>
            <View style={styles.remittanceIconCircle}>
              <TriangleAlert size={32} color="#ef4444" strokeWidth={1.8} />
            </View>
            <Text style={styles.remittanceTitle}>Remittance Required</Text>
            <Text style={styles.remittanceMessage}>
              Remittance balance must be remitted before you can scan hub
              parcels.
            </Text>
            <Text style={styles.remittanceSupport}>
              Please contact your Satellite Operator.
            </Text>
          </View>
        </View>
      ) : (
        <>
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

          {scanResultMessage ? (
            <View
              style={[
                styles.resultBanner,
                alertColor === "blue"
                  ? styles.resultSuccess
                  : alertColor === "red"
                    ? styles.resultError
                    : styles.resultSuccess,
              ]}
            >
              {alertColor === "blue" ? (
                <CheckCircle size={20} color="#22c55e" strokeWidth={2} />
              ) : (
                <XCircle size={20} color="#ef4444" strokeWidth={2} />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.resultText,
                    alertColor === "red"
                      ? styles.resultTextError
                      : styles.resultTextSuccess,
                  ]}
                >
                  {scanResultMessage}
                </Text>
                {barangayDestination ? (
                  <Text style={styles.resultSubText}>
                    Destination: {barangayDestination}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </>
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  subtitle: { fontSize: 12, color: "#94a3b8", marginTop: 1 },
  countBadge: {
    backgroundColor: "#22c55e",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 36,
    alignItems: "center",
  },
  countText: { color: "#fff", fontWeight: "700", fontSize: 14 },
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
  resultError: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  resultText: { fontSize: 14, fontWeight: "600" },
  resultTextSuccess: { color: "#15803d" },
  resultTextError: { color: "#ef4444" },
  resultSubText: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#94a3b8" },
  remittanceContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  remittanceCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  remittanceIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  remittanceTitle: { fontSize: 18, fontWeight: "700", color: "#ef4444" },
  remittanceMessage: {
    fontSize: 14,
    textAlign: "center",
    color: "#64748b",
    lineHeight: 20,
  },
  remittanceSupport: {
    fontSize: 13,
    textAlign: "center",
    color: "#94a3b8",
    fontStyle: "italic",
  },
});

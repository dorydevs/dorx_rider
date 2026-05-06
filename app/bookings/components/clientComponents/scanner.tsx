import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomDrawer, {
  BottomDrawerMethods,
} from "react-native-animated-bottom-drawer";

type ClientData = any;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FRAME_SIZE = SCREEN_WIDTH * 0.65;
const CORNER_LEN = 32;
const CORNER_W = 4;
const CORNER_R = 8;

export default function scanClientScheduledParcel() {
  const { playSuccess, playError, playWarning } = useScannerSounds();
  const router = useRouter();
  const { clientData, clientScheduledToPickUpData, ScheduledData } =
    useLocalSearchParams();
  const bottomDrawerRef = useRef<BottomDrawerMethods | null>(null);
  const clientScheduledData: ClientData = ScheduledData
    ? JSON.parse(ScheduledData as string)
    : null;
  const [selectedItem, setSelectedItem] = useState<ClientData | null>(null);
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scannedData, setScannedData] = useState<string[]>([]);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [totalPendingCount, setTotalPendingCount] = useState(
    clientScheduledData.orders.length,
  );
  const [alertColor, setAlertColor] = useState<"green" | "yellow" | "red">(
    "green",
  );
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

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

  const client: ClientData = clientData
    ? JSON.parse(clientData as string)
    : null;

  const clientScheduledToPickUp: ClientData = clientScheduledToPickUpData
    ? JSON.parse(clientScheduledToPickUpData as string)
    : null;

  console.log(clientScheduledData);

  const onScan = async (scannedCode: any) => {
    if (scanned) return;

    setScanned(true);
    setData(scannedCode);
  };

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

  console.log("userInfo : >> ", userData);

  console.log("client : >> ", clientScheduledToPickUp);

  useEffect(() => {
    async function processScan() {
      if (!data) return;

      if (scannedData.includes(data.data)) {
        setScanResultMessage("⚠ This item has already been scanned.");
        setAlertColor("yellow");
        playWarning();
        setTimeout(() => {
          setScanResultMessage("");
          setScanned(false);
          setData("");
        }, 3000);
        return;
      }

      setLoadingScan(true);
      setScanResultMessage("");

      try {
        // Validate order number
        const validationResponse = await axiosInstance(userData?.token).get(
          `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data.data}&clientId=${client.clientId}&pickupAddressId=${clientScheduledToPickUp.pickupAddressId}`,
        );

        if (!validationResponse.data) {
          throw new Error("Order not found. Please check the waybill number.");
        }

        setSelectedItem(validationResponse.data);

        // Validate order status
        if (validationResponse.data.orderStatus !== "Scheduled for Pickup") {
          setScanResultMessage(
            `Cannot scan: Order status is "${validationResponse.data.orderStatus}". Only orders with "Scheduled for Pickup" status can be scanned.`,
          );
          setAlertColor("yellow");
          playWarning();
          setLoadingScan(false);
          setTimeout(() => {
            setScanResultMessage("");
            setScanned(false);
            setData("");
          }, 4000);
          return;
        }

        // Find order transaction
        const orderTransaction = clientScheduledData.orders.find(
          (d: any) => d.orderNumber === data.data,
        );

        if (!orderTransaction) {
          setScanResultMessage(
            "Order not found in scheduled pickup list. Please refresh and try again.",
          );
          setAlertColor("yellow");
          playWarning();
          setLoadingScan(false);
          setTimeout(() => {
            setScanResultMessage("");
            setScanned(false);
            setData("");
          }, 4000);
          return;
        }

        // Prepare payloads
        const scanPayload = {
          orderNumber: data.data,
          status: "Picked up by Rider",
        };

        const transactionPayload = {
          status: "picked-up",
          scannedDate: moment().format("YYYY-MM-DD HH:mm:ss"),
          riderId: userData.id,
          orderTransactionId: validationResponse.data.orderTransactionId,
        };

        // Create rider transaction
        await axiosInstance(userData.token).post(
          `/api/riderTransaction`,
          transactionPayload,
        );

        // Update order status
        const scanResponse = await axiosInstance(userData.token).put(
          `/api/orderTransactions/scanWaybill`,
          scanPayload,
        );

        // Log scanned data for CDS
        await axiosInstance(userData.token).post(`/api/log-scan`, {
          shippingFee: validationResponse.data.receivableFreight,
          transactionType: "inbound",
          wareHouseId: userData.storeId,
          wareHouseType: userData.accountType === 0 ? "store" : "hub-rider",
          orderTransactionId: validationResponse.data.orderTransactionId,
        });

        playSuccess();
        setTotalPendingCount((prev: any) => prev - 1);
        setAlertColor("green");
        setScannedData((prev) => [...prev, data.data]);
        setScanResultMessage(
          scanResponse.data.message ??
            `✓ Successfully scanned! ${totalPendingCount - 1} items remaining.`,
        );
        bottomDrawerRef.current?.open();

        setTimeout(() => {
          setScanned(false);
          setData("");
        }, 2000);
      } catch (error: any) {
        console.error("CLIENT SCANNING ERROR:", error);
        playError();
        setAlertColor("red");

        let errorMessage = "Scanning failed. ";

        if (error.message === "Network Error" || !error.response) {
          errorMessage +=
            "Network connection error. Please check your internet and try again.";
        } else if (error.response?.status === 404) {
          errorMessage +=
            "Order not found or not assigned to this pickup address.";
        } else if (error.response?.status === 400) {
          errorMessage +=
            error.response?.data?.message ||
            "Invalid request. Please check the order details.";
        } else if (error.response?.status === 401) {
          errorMessage += "Session expired. Please log in again.";
        } else if (error.response?.status === 409) {
          errorMessage += "This order has already been processed.";
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
          setScanned(false);
          setData("");
        }, 5000);
      } finally {
        setLoadingScan(false);
      }
    }

    if (userData !== null) {
      processScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, userData]);

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - 2],
  });
  const isLocked = scanned && !loadingScan;
  const cornerColor = isLocked ? "#ef4444" : "#22c55e";

  const bottomDrawerClose = () => {
    if (totalPendingCount === 0) {
      router.back();
    } else {
      bottomDrawerRef.current?.close();
    }
  };

  const TableRow = ({
    label,
    value,
    last,
    accent,
  }: {
    label: string;
    value?: any;
    last?: boolean;
    accent?: boolean;
  }) => (
    <View
      style={[
        styles.tableRow,
        !last && styles.tableRowBorder,
        accent && styles.tableRowAccent,
      ]}
    >
      <Text style={styles.tableLabel}>{label}</Text>
      <Text style={styles.tableValue} numberOfLines={2}>
        {value ?? "—"}
      </Text>
    </View>
  );

  const SectionCard = ({
    icon,
    title,
    children,
  }: {
    icon: string;
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardHeader}>
        <View style={styles.sectionIconBadge}>
          <Ionicons name={icon as any} size={15} color="#22c55e" />
        </View>
        <Text style={styles.sectionCardTitle}>{title}</Text>
      </View>
      <View style={styles.tableCard}>{children}</View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#22c55e" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Client Scanner</Text>
          <Text style={styles.subtitle}>Scan scheduled pickup items</Text>
        </View>
      </View>
      {/* ── Camera with animated overlay ── */}
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
                    : `${totalPendingCount} Items Remaining`}
              </Text>
            </View>
            <Text style={styles.tipText}>
              {scannedData.length} scanned this session
            </Text>
          </View>
        </View>
      </View>

      {/* Result banner */}
      {!!scanResultMessage && (
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
              {
                color:
                  alertColor === "green"
                    ? "#16a34a"
                    : alertColor === "yellow"
                      ? "#d97706"
                      : "#dc2626",
              },
            ]}
          >
            {scanResultMessage}
          </Text>
        </View>
      )}

      {/* Bottom drawer */}
      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={SCREEN_HEIGHT * 0.75}
        enableSnapping={false}
      >
        <View style={[styles.drawerInner, { height: SCREEN_HEIGHT * 0.75 }]}>
          <View style={styles.drawerHandle} />
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedItem && (
              <>
                <SectionCard icon="cube-outline" title="Item Details">
                  <TableRow
                    label="Item Name"
                    value={selectedItem.itemName}
                    accent
                  />
                  <TableRow
                    label="Item Weight"
                    value={selectedItem.itemWeight}
                  />
                  <TableRow
                    label="No. of Items"
                    value={selectedItem.numberOfItem}
                    accent
                  />
                  <TableRow
                    label="Pouch Size"
                    value={selectedItem.pouchesSize}
                  />
                  <TableRow label="Remarks" value={selectedItem.remarks} last />
                </SectionCard>

                <SectionCard icon="cash-outline" title="Fees & Costs">
                  <TableRow
                    label="COD Value"
                    value={`₱ ${selectedItem.codValue ?? "—"}`}
                    accent
                  />
                  <TableRow
                    label="COD Fee"
                    value={`₱ ${selectedItem.codFee ?? "—"}`}
                  />
                  <TableRow
                    label="Item Value"
                    value={`₱ ${selectedItem.itemValue ?? "—"}`}
                    accent
                  />
                  <TableRow
                    label="Valuation Fee"
                    value={`₱ ${selectedItem.valuationFee ?? "—"}`}
                  />
                  <TableRow
                    label="Receivable Freight"
                    value={`₱ ${selectedItem.receivableFreight ?? "—"}`}
                    accent
                  />
                  <TableRow
                    label="Total Shipping Cost"
                    value={`₱ ${selectedItem.totalShippingCost ?? "—"}`}
                    last
                  />
                </SectionCard>

                <SectionCard icon="document-text-outline" title="Order Details">
                  <TableRow
                    label="Waybill Number"
                    value={selectedItem.waybillNumber}
                    accent
                  />
                  <TableRow
                    label="Order Number"
                    value={selectedItem.orderNumber}
                    last
                  />
                </SectionCard>

                <SectionCard icon="person-outline" title="Sender">
                  <TableRow
                    label="Name"
                    value={selectedItem.senderName}
                    accent
                  />
                  <TableRow label="Phone" value={selectedItem.senderPhone} />
                  <TableRow
                    label="Province"
                    value={selectedItem.senderProvince}
                    accent
                  />
                  <TableRow label="City" value={selectedItem.senderCity} />
                  <TableRow
                    label="Barangay"
                    value={selectedItem.senderBarangay}
                    accent
                  />
                  <TableRow
                    label="Address"
                    value={selectedItem.senderAddress}
                    last
                  />
                </SectionCard>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => bottomDrawerClose()}
                >
                  <Text style={styles.closeBtnText}>
                    {totalPendingCount === 0
                      ? "Done — Go Back"
                      : "Continue Scanning"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </BottomDrawer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },

  // Header
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
  title: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  subtitle: { fontSize: 12, color: "#94a3b8", marginTop: 1 },

  // Camera overlay
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

  // Result banner
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

  // Drawer
  drawerInner: { flex: 1 },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  drawerContent: { paddingHorizontal: 14, paddingBottom: 40, gap: 14 },

  // Section card
  sectionCard: { gap: 0 },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Table card
  tableCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tableRowAccent: { backgroundColor: "#f8fafc" },
  tableLabel: { flex: 1, fontSize: 12, fontWeight: "600", color: "#64748b" },
  tableValue: {
    flex: 1.4,
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "right",
  },

  // Close button
  closeBtn: {
    backgroundColor: "#22c55e",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  closeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

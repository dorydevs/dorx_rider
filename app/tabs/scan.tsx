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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomDrawer from "react-native-animated-bottom-drawer";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FRAME_SIZE = SCREEN_WIDTH * 0.65;

export default function RTSIncomingScreen() {
  const router = useRouter();
  const { playSuccess, playError } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [waybillDetails, setWaybillDetails] = useState<any>({});
  const bottomDrawerRef = useRef<any>(null);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Scan line sweeps down
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

    // Corner glow pulse
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

  const TableRow = ({
    label,
    value,
    last,
    accent,
  }: {
    label: string;
    value?: string | number;
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

  const onScan = async (scannedCode: any) => {
    if (scanned) return;
    setScanResultMessage("");
    setScanned(true);
    setData(scannedCode);
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) setUserData(JSON.parse(storedUser));
        else if (user) setUserData(user);
      } catch (e) {}
    };
    loadUserData();
  }, [user]);

  useEffect(() => {
    const handleScan = async () => {
      if (!data) return;
      setLoadingScan(true);
      try {
        const { data: waybillData } = await axiosInstance(userData.token).get(
          `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data.data}`,
        );
        playSuccess();
        setWaybillDetails(waybillData);
        setLoadingScan(false);
        setScanned(false);
        bottomDrawerRef.current?.open();
      } catch {
        playError();
        setLoadingScan(false);
        setScanned(false);
      }
    };
    if (userData) handleScan();
  }, [data, userData]);

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - 2],
  });

  const isLocked = scanned && !loadingScan;
  const cornerColor = isLocked ? "#ef4444" : "#22c55e";

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#22c55e" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Scan Items</Text>
          <Text style={styles.subtitle}>Align barcode within the frame</Text>
        </View>
      </View>

      {/* ── Full-screen camera with overlay ── */}
      <View style={styles.cameraContainer}>
        {/* Camera fills entire block */}
        <BarcodeScanner
          onScan={onScan}
          scanned={scanned}
          containerStyle={styles.cameraFill}
        />

        {/* Overlay sits absolutely on top of camera */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Top dim */}
          <View style={styles.dimTop} />

          {/* Middle row: dim | frame | dim */}
          <View style={styles.dimMiddleRow}>
            <View style={styles.dimSide} />

            {/* Scan frame — transparent window */}
            <View
              style={[
                styles.frameContainer,
                { width: FRAME_SIZE, height: FRAME_SIZE },
              ]}
            >
              {/* Corner TL */}
              <Animated.View
                style={[
                  styles.corner,
                  styles.cTL,
                  { borderColor: cornerColor, opacity: glowAnim },
                ]}
              />
              {/* Corner TR */}
              <Animated.View
                style={[
                  styles.corner,
                  styles.cTR,
                  { borderColor: cornerColor, opacity: glowAnim },
                ]}
              />
              {/* Corner BL */}
              <Animated.View
                style={[
                  styles.corner,
                  styles.cBL,
                  { borderColor: cornerColor, opacity: glowAnim },
                ]}
              />
              {/* Corner BR */}
              <Animated.View
                style={[
                  styles.corner,
                  styles.cBR,
                  { borderColor: cornerColor, opacity: glowAnim },
                ]}
              />

              {/* Scan line */}
              {!isLocked && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    { transform: [{ translateY: scanLineY }] },
                  ]}
                />
              )}

              {/* Locked state */}
              {isLocked && (
                <View style={styles.lockedOverlay}>
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={20} color="#fff" />
                    <Text style={styles.lockedText}>Locked</Text>
                  </View>
                </View>
              )}

              {/* Processing state */}
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

          {/* Bottom dim — hint + status live here */}
          <View style={styles.dimBottom}>
            {/* Hint */}
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

            {/* Status pill */}
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

            {/* Tip */}
            {!isLocked && !loadingScan && (
              <Text style={styles.tipText}>
                Hold steady — auto-detects on focus
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Error banner */}
      {!!scanResultMessage && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.errorText}>{scanResultMessage}</Text>
        </View>
      )}

      {/* Bottom drawer */}
      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={SCREEN_HEIGHT * 0.78}
        enableSnapping={false}
      >
        <View style={[styles.drawerInner, { height: SCREEN_HEIGHT * 0.78 }]}>
          <View style={styles.drawerHandle} />

          {/* Waybill number hero badge */}
          {!!waybillDetails.waybillNumber && (
            <View style={styles.waybillHero}>
              <Text style={styles.waybillHeroLabel}>Waybill No.</Text>
              <Text style={styles.waybillHeroNumber}>
                {waybillDetails.waybillNumber}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      waybillDetails.orderStatus === "Delivered"
                        ? "#dcfce7"
                        : "#fef9c3",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        waybillDetails.orderStatus === "Delivered"
                          ? "#15803d"
                          : "#a16207",
                    },
                  ]}
                >
                  {waybillDetails.orderStatus ?? "—"}
                </Text>
              </View>
            </View>
          )}

          <ScrollView
            style={styles.drawerScroll}
            contentContainerStyle={styles.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            <SectionCard icon="cube-outline" title="Item Details">
              <TableRow label="Item Name" value={waybillDetails.itemName} />
              <TableRow label="Item Weight" value={waybillDetails.itemWeight} />
              <TableRow
                label="No. of Items"
                value={waybillDetails.numberOfItem}
              />
              <TableRow
                label="Pouches Size"
                value={waybillDetails.pouchesSize}
              />
              <TableRow label="Remarks" value={waybillDetails.remarks} last />
            </SectionCard>

            <SectionCard icon="cash-outline" title="Fees & Costs">
              <TableRow
                label="COD Value"
                value={`₱ ${waybillDetails.codValue ?? "—"}`}
                accent
              />
              <TableRow
                label="COD Fee"
                value={`₱ ${waybillDetails.codFee ?? "—"}`}
              />
              <TableRow
                label="Item Value"
                value={`₱ ${waybillDetails.itemValue ?? "—"}`}
                accent
              />
              <TableRow
                label="Valuation Fee"
                value={`₱ ${waybillDetails.valuationFee ?? "—"}`}
              />
              <TableRow
                label="Receivable Freight"
                value={`₱ ${waybillDetails.receivableFreight ?? "—"}`}
                accent
              />
              <TableRow
                label="Total Shipping Cost"
                value={`₱ ${waybillDetails.totalShippingCost ?? "—"}`}
                last
              />
            </SectionCard>

            <SectionCard icon="document-text-outline" title="Order Details">
              <TableRow
                label="Order Number"
                value={waybillDetails.orderNumber}
              />
              <TableRow
                label="Waybill Number"
                value={waybillDetails.waybillNumber}
                last
              />
            </SectionCard>

            <SectionCard icon="person-outline" title="Sender">
              <TableRow label="Name" value={waybillDetails.senderName} accent />
              <TableRow label="Phone" value={waybillDetails.senderPhone} />
              <TableRow
                label="Province"
                value={waybillDetails.senderProvince}
                accent
              />
              <TableRow label="City" value={waybillDetails.senderCity} />
              <TableRow
                label="Barangay"
                value={waybillDetails.senderBarangay}
                accent
              />
              <TableRow
                label="Address"
                value={waybillDetails.senderAddress}
                last
              />
            </SectionCard>

            <SectionCard icon="location-outline" title="Recipient">
              <TableRow
                label="Name"
                value={waybillDetails.receiverName}
                accent
              />
              <TableRow label="Phone" value={waybillDetails.receiverPhone} />
              <TableRow
                label="Province"
                value={waybillDetails.receiverProvince}
                accent
              />
              <TableRow label="City" value={waybillDetails.receiverCity} />
              <TableRow
                label="Barangay"
                value={waybillDetails.receiverBarangay}
                accent
              />
              <TableRow
                label="Address"
                value={waybillDetails.receiverAddress}
                last
              />
            </SectionCard>
          </ScrollView>
        </View>
      </BottomDrawer>
    </View>
  );
}

const CORNER_LEN = 32;
const CORNER_W = 4;
const CORNER_R = 8;

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
  title: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  subtitle: { fontSize: 12, color: "#94a3b8", marginTop: 1 },

  // Camera: fills all remaining space
  cameraContainer: { flex: 1, position: "relative", backgroundColor: "#000" },
  cameraFill: {
    flex: 1,
    margin: 0,
    marginTop: 0,
    marginHorizontal: 0,
    height: undefined,
    borderRadius: 0,
  },

  // Dim overlay regions
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

  // Frame window (transparent)
  frameContainer: { position: "relative" },

  // Corners
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

  // Scan line
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

  // States inside frame
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

  // Bottom hints
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
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

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 12,
    padding: 14,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { fontSize: 13, fontWeight: "600", color: "#ef4444", flex: 1 },

  // Drawer
  drawerInner: {
    flex: 1,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },

  // Waybill hero badge
  waybillHero: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 4,
  },
  waybillHeroLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  waybillHeroNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 0.5,
  },
  statusBadge: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  drawerScroll: { flex: 1 },
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
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowAccent: {
    backgroundColor: "#f8fafc",
  },
  tableLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  tableValue: {
    flex: 1.4,
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "right",
  },
});

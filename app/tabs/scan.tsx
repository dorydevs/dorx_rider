import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Box,
  FileText,
  MapPin,
  ScanLine,
  Send,
  User,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> =
  {
    Pending: { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
    "Picked up by Rider": { bg: "#fff7ed", text: "#c2410c", dot: "#f97316" },
    "Received by branch": { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6" },
    Cancelled: { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
    Printed: { bg: "#ecfeff", text: "#0e7490", dot: "#06b6d4" },
    "Out for Delivery": { bg: "#fefce8", text: "#a16207", dot: "#eab308" },
    Delivered: { bg: "#f0fdf4", text: "#15803d", dot: "#22c55e" },
  };

export default function RTSIncomingScreen() {
  const router = useRouter();

  const { playSuccess, playError } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [waybillDetails, setWaybillDetails] = useState<any>({});

  const bottomDrawerRef = useRef<BottomSheet>(null);

  // ── helpers ──────────────────────────────────────────────
  const val = (v: any) =>
    v !== undefined && v !== null && v !== "" ? String(v) : null;

  const money = (v: any) => {
    const n = parseFloat(v);
    return !isNaN(n) ? `₱ ${n.toFixed(2)}` : null;
  };

  const location = (province: any, city: any, barangay: any) => {
    const parts = [val(barangay), val(city), val(province)].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  };

  const TableRow = ({
    label,
    value,
    highlight,
  }: {
    label: string;
    value?: string | null;
    highlight?: boolean;
  }) => {
    if (!value) return null;
    return (
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>{label}</Text>
        <Text
          style={[styles.tableValue, highlight && styles.tableValueHighlight]}
        >
          {value}
        </Text>
      </View>
    );
  };

  const SectionCard = ({
    icon,
    title,
    color,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    color: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.sectionCard}>
      <View style={[styles.sectionCardHeader, { borderLeftColor: color }]}>
        <View
          style={[styles.sectionIconWrap, { backgroundColor: color + "18" }]}
        >
          {icon}
        </View>
        <Text style={[styles.sectionCardTitle, { color }]}>{title}</Text>
      </View>
      <View style={styles.tableContainer}>{children}</View>
    </View>
  );

  // ── scan / data ────────────────────────────────────────────
  const onScan = async (scannedCode: any) => {
    if (scanned) return;
    setScanned(true);
    setData(scannedCode);
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) setUserData(JSON.parse(storedUser));
        else if (user) setUserData(user);
      } catch (e) {
        console.error("Error loading user data:", e);
      }
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
        bottomDrawerRef.current?.snapToIndex(0);
      } catch (error) {
        playError();
        setLoadingScan(false);
        setScanned(false);
      }
    };
    if (userData !== null) handleScan();
  }, [data, userData]);

  const w = waybillDetails;
  const statusStyle = STATUS_COLORS[w.orderStatus] ?? {
    bg: "#f8fafc",
    text: "#64748b",
    dot: "#94a3b8",
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#22c55e" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Scan Items</Text>
          <Text style={styles.subtitle}>Align barcode within the frame</Text>
        </View>
        <View style={styles.scanIconBadge}>
          <ScanLine size={22} color="#22c55e" strokeWidth={2} />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <BarcodeScanner
          onScan={onScan}
          scanned={scanned}
          isProcessing={loadingScan}
        />
      </View>

      {/* ── BOTTOM SHEET ── */}
      <BottomSheet
        ref={bottomDrawerRef}
        index={-1}
        snapPoints={["55%", "92%"]}
        enablePanDownToClose
        backgroundStyle={{ borderRadius: 20 }}
        handleIndicatorStyle={{ backgroundColor: "#e2e8f0", width: 40 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.drawerContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Waybill identity card */}
          <View style={styles.identityCard}>
            <View style={styles.identityLeft}>
              <Text style={styles.identityOrderLabel}>ORDER NUMBER</Text>
              <Text style={styles.identityOrderValue}>
                {val(w.orderNumber) ?? "—"}
              </Text>
              {val(w.waybillNumber) && (
                <Text style={styles.identityWaybill}>
                  Waybill: {w.waybillNumber}
                </Text>
              )}
            </View>
            {val(w.orderStatus) && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusStyle.bg },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusStyle.dot },
                  ]}
                />
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {w.orderStatus}
                </Text>
              </View>
            )}
          </View>

          {/* Item Details */}
          <SectionCard
            icon={<Box size={14} color="#22c55e" strokeWidth={2.5} />}
            title="Item Details"
            color="#22c55e"
          >
            <TableRow label="Item Name" value={val(w.itemName)} />
            <TableRow
              label="Weight"
              value={val(w.itemWeight) ? `${w.itemWeight} kg` : null}
            />
            <TableRow label="Quantity" value={val(w.numberOfItem)} />
            <TableRow label="Pouch Size" value={val(w.pouchesSize)} />
            <TableRow label="Remarks" value={val(w.remarks)} />
          </SectionCard>

          {/* Fees */}
          <SectionCard
            icon={<FileText size={14} color="#3b82f6" strokeWidth={2.5} />}
            title="Fees & Payment"
            color="#3b82f6"
          >
            <TableRow label="COD Value" value={money(w.codValue)} highlight />
            <TableRow label="COD Fee" value={money(w.codFee)} />
            <TableRow label="Item Value" value={money(w.itemValue)} />
            <TableRow label="Valuation Fee" value={money(w.valuationFee)} />
            <TableRow
              label="Receivable Freight"
              value={money(w.receivableFreight)}
            />
            <TableRow
              label="Total Shipping"
              value={money(w.totalShippingCost)}
              highlight
            />
          </SectionCard>

          {/* Sender */}
          <SectionCard
            icon={<Send size={14} color="#8b5cf6" strokeWidth={2.5} />}
            title="Sender"
            color="#8b5cf6"
          >
            <TableRow label="Name" value={val(w.senderName)} highlight />
            <TableRow label="Phone" value={val(w.senderPhone)} />
            <TableRow label="Address" value={val(w.senderAddress)} />
            <TableRow
              label="Location"
              value={location(w.senderProvince, w.senderCity, w.senderBarangay)}
            />
          </SectionCard>

          {/* Recipient */}
          <SectionCard
            icon={<User size={14} color="#f97316" strokeWidth={2.5} />}
            title="Recipient"
            color="#f97316"
          >
            <TableRow label="Name" value={val(w.receiverName)} highlight />
            <TableRow label="Phone" value={val(w.receiverPhone)} />
            <TableRow label="Address" value={val(w.receiverAddress)} />
            <TableRow
              label="Location"
              value={location(
                w.receiverProvince,
                w.receiverCity,
                w.receiverBarangay,
              )}
            />
          </SectionCard>

          {/* Delivery area */}
          {(val(w.groupArea) || val(w.zone) || val(w.hub)) && (
            <SectionCard
              icon={<MapPin size={14} color="#ef4444" strokeWidth={2.5} />}
              title="Delivery Area"
              color="#ef4444"
            >
              <TableRow label="Group Area" value={val(w.groupArea)} />
              <TableRow label="Zone" value={val(w.zone)} />
              <TableRow label="Hub" value={val(w.hub)} />
            </SectionCard>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#5a8a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#4a7a14",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  scanIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.68)", marginTop: 2 },

  // Drawer
  drawerContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    paddingTop: 4,
  },

  // Identity card
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  identityLeft: { flex: 1 },
  identityOrderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  identityOrderValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 2,
  },
  identityWaybill: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
    flexShrink: 0,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Section cards
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderLeftWidth: 3,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableContainer: {
    paddingHorizontal: 2,
  },

  // Table rows
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  tableLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    flex: 1,
    paddingRight: 8,
  },
  tableValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    flex: 2,
    textAlign: "right",
  },
  tableValueHighlight: {
    color: "#1e293b",
    fontWeight: "700",
  },
});

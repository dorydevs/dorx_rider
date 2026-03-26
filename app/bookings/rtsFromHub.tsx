import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ALERT_COLORS: Record<
  string,
  { border: string; bg: string; text: string }
> = {
  green: { border: "#16a34a", bg: "#22c55e", text: "#ffffff" },
  red: { border: "#dc2626", bg: "#dc2626", text: "#ffffff" },
  yellow: { border: "#d97706", bg: "#f59e0b", text: "#ffffff" },
  orange: { border: "#ea580c", bg: "#f97316", text: "#ffffff" },
};

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
  const [alertColor, setAlertColor] = useState<
    "green" | "yellow" | "red" | "orange"
  >("green");
  const [scanCount, setScanCount] = useState(0);

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
              orderDetail.data.rtsStatus
                ? `Cannot scan: Item status is "${orderDetail.data.rtsStatus}". Only items with "Received by hub" status can be scanned.`
                : "Item is not for return",
            );
            setAlertColor("yellow");
            playWarning();
            setLoadingScan(false);
            setScanned(false);
            setTimeout(() => {
              setScanResultMessage("");
              setData("");
            }, 7000);
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
            }, 7000);
            return;
          }

          // Process the scan
          await axiosInstance(userData.token).put(
            `/api/rts-item-customer/rts-hub-to-so/${orderDetail.data.orderTransactionId}`,
          );

          playSuccess();
          setScannedData((prev) => [...prev, data.data]);
          setScanResultMessage(
            `Item successfully scanned! Destination: ${orderDetail.data.senderBarangay}`,
          );
          setAlertColor("green");
          setScanCount((prev) => prev + 1);
          setLoadingScan(false);
          setScanned(false);
          setTimeout(() => {
            setScanResultMessage("");
            setData("");
          }, 5000);
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
          }, 7000);
        }
      } else {
        setScanResultMessage("This item has already been scanned.");
        setAlertColor("orange");
        playWarning();
        setScanned(false);
        setLoadingScan(false);
        setTimeout(() => {
          setScanResultMessage("");
          setScanned(false);
          setData("");
        }, 10000);
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

  const colors = ALERT_COLORS[alertColor] ?? ALERT_COLORS.green;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>RTS from Hub</Text>
          <Text style={styles.subtitle}>Scan items received from hub</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <BarcodeScanner onScan={onScan} scanned={scanned} />

      {/* SCAN COUNT */}
      <View style={styles.scanCountContainer}>
        <View style={styles.scanCountCard}>
          <Text style={styles.scanCountNumber}>{scanCount}</Text>
          <Text style={styles.scanCountLabel}>
            {scanCount === 1 ? "Item Scanned" : "Items Scanned"}
          </Text>
        </View>
      </View>

      {/* SCANNING STATUS */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: loadingScan
                ? "#f59e0b"
                : scanned
                  ? "#ef4444"
                  : "#22c55e",
            },
          ]}
        />
        <Text style={styles.statusText}>
          {loadingScan
            ? "Processing..."
            : scanned
              ? "Camera Locked"
              : "Ready to Scan"}
        </Text>
      </View>

      {/* SCAN RESULT ALERT */}
      {data && (
        <View
          style={[
            styles.resultAlert,
            { borderColor: colors.border, backgroundColor: colors.bg },
          ]}
        >
          {loadingScan ? (
            <Text style={[styles.resultText, { color: colors.text }]}>
              Scanning...
            </Text>
          ) : (
            <Text style={[styles.resultText, { color: colors.text }]}>
              {scanResultMessage}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTextContainer: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  subtitle: { fontSize: 12, color: "#94A3B8", marginTop: 1 },
  scanCountContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  scanCountCard: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  scanCountNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#22c55e",
  },
  scanCountLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
    marginHorizontal: 40,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
  },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: "600", color: "#15803D" },
  resultAlert: {
    marginTop: 12,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
  },
  resultText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    color: "#ffffff",
  },
});

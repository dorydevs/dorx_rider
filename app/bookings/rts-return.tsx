import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import moment from "moment";
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

export default function RTSIncomingScreen() {
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
  const [totalScannedCount, setTotalScannedCount] = useState(0);

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

  useEffect(() => {
    async function processScan() {
      if (!data) return;

      if (!scannedData.includes(data.data)) {
        setLoadingScan(true);
        setScanResultMessage("");

        try {
          const validationResponse = await axiosInstance(userData.token).get(
            `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data.data}`,
          );

          if (!validationResponse.data) {
            throw new Error(
              "Order not found. Please check the waybill number.",
            );
          }

          // Validate waybill status
          if (validationResponse.data.waybillStatus !== "For Return") {
            setScanResultMessage(
              validationResponse.data.waybillStatus
                ? `Cannot scan: Waybill status is "${validationResponse.data.waybillStatus}". Only items marked "For Return" can be processed.`
                : "Item is not for return",
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

          // Validate RTS status
          if (validationResponse.data.rtsStatus !== "Received by So") {
            setScanResultMessage(
              `Cannot scan: RTS status is "${validationResponse.data.rtsStatus}". Item must be "Received by So" status.`,
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

          // Process return
          const riderRtsItemPayload = {
            scannedDate: moment().format("YYYY-MM-DD HH:mm:ss"),
            origin: "Client",
            operationAccountId: userData.id,
            recipientDetailId: validationResponse.data.recipientDetailId,
            orderTransactionId: validationResponse.data.orderTransactionId,
            orderNumber: data.data,
            senderName: validationResponse.data.senderName,
          };

          await axiosInstance(userData.token).put(
            `/api/orderTransactions/updateWaybillStatus`,
            {
              orderTransactionId: validationResponse.data.orderTransactionId,
              waybillStatus: "Returned",
            },
          );

          await axiosInstance(userData.token).put(
            `/api/rts-item-customer`,
            riderRtsItemPayload,
          );

          setTotalScannedCount((prev) => prev + 1);
          playSuccess();
          setScannedData((prev) => [...prev, data.data]);
          setScanResultMessage(
            `✓ Item successfully returned to ${validationResponse.data.senderName}\nTotal: ${totalScannedCount + 1}`,
          );
          setAlertColor("green");
          setLoadingScan(false);
          setScanned(false);
          setTimeout(() => {
            setScanResultMessage("");
            setData("");
          }, 5000);
        } catch (error: any) {
          console.error("RTS RETURN SCANNING ERROR:", error);
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
              "Invalid request. Item may not be eligible for return.";
          } else if (error.response?.status === 401) {
            errorMessage += "Session expired. Please log in again.";
          } else if (error.response?.status === 409) {
            errorMessage += "This item has already been returned.";
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
        setLoadingScan(false);
        setScanned(false);
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

  const colors = ALERT_COLORS[alertColor] ?? ALERT_COLORS.green;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>RTS Return</Text>
          <Text style={styles.subtitle}>Return RTS items to clients</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1 }}>
        <BarcodeScanner
          onScan={onScan}
          scanned={scanned}
          isProcessing={loadingScan}
        />
      </View>
      <View style={styles.bottomBar}>
        {scanResultMessage !== "" && (
          <View
            style={[
              styles.resultContainer,
              alertColor === "green"
                ? styles.successBg
                : alertColor === "yellow"
                  ? styles.warningBg
                  : styles.errorBg,
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
                    ? "#f39c12"
                    : "#e74c3c"
              }
            />
            <Text
              style={[
                styles.resultText,
                alertColor === "green"
                  ? styles.successColor
                  : alertColor === "yellow"
                    ? styles.warningColor
                    : styles.errorColor,
              ]}
            >
              {scanResultMessage}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  bottomBar: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#5a8a1a",
  },
  headerTextContainer: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
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
  scanCountNumber: { fontSize: 28, fontWeight: "800", color: "#22c55e" },
  scanCountLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  resultContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  errorBg: { backgroundColor: "#fee2e2", borderColor: "#ef4444" },
  successBg: { backgroundColor: "#d1fae5", borderColor: "#22c55e" },
  warningBg: { backgroundColor: "#fef3c7", borderColor: "#f59e0b" },
  resultText: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  errorColor: { color: "#dc2626" },
  successColor: { color: "#16a34a" },
  warningColor: { color: "#d97706" },
});

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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RTSIncomingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
                ? `Cannot scan: Waybill status is "${validationResponse.data.waybillStatus}". Only items marked "For Return" can be processed.` //pag null yung waybillStatus
                : `Cannot scan: This item has no waybill status assigned yet.`, //ito mag papakita
            );
            setAlertColor("yellow");
            playWarning();
            setLoadingScan(false);
            setScanned(false);
            setTimeout(() => {
              setScanResultMessage("");
              setData("");
            }, 6000);
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
            }, 4000);
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
            `✓ Item successfully returned to client! Total: ${totalScannedCount + 1}`,
          );
          setAlertColor("green");
          setLoadingScan(false);
          setScanned(false);
          setTimeout(() => {
            setScanResultMessage("");
            setData("");
          }, 3000);
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
          }, 5000);
        }
      } else {
        setScanResultMessage("⚠ This item has already been scanned.");
        setAlertColor("yellow");
        playWarning();
        setLoadingScan(false);
        setScanned(false);
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

  return (
    <View style={styles.container}>
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
      </View>

      <View style={styles.scannerContainer}>
        <BarcodeScanner onScan={onScan} scanned={scanned} />
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: scanned ? "#ef4444" : "#22c55e" },
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

        {scanResultMessage && (
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
            <View
              style={[
                styles.iconCircle,
                alertColor === "green"
                  ? styles.successCircle
                  : alertColor === "yellow"
                    ? styles.warningCircle
                    : styles.errorCircle,
              ]}
            >
              <Ionicons
                name={
                  alertColor === "green"
                    ? "checkmark"
                    : alertColor === "yellow"
                      ? "warning"
                      : "close"
                }
                size={16}
                color={
                  alertColor === "green"
                    ? "#3B6D11"
                    : alertColor === "yellow"
                      ? "#92400e"
                      : "#A32D2D"
                }
              />
            </View>
            <View style={styles.resultTextWrapper}>
              <Text
                style={[
                  styles.resultLabel,
                  alertColor === "green"
                    ? styles.successColor
                    : alertColor === "yellow"
                      ? styles.warningColor
                      : styles.errorColor,
                ]}
              >
                {alertColor === "green"
                  ? "Scan Successful"
                  : alertColor === "yellow"
                    ? "Scan Warning"
                    : "Scan Failed"}
              </Text>
              <Text style={styles.resultSubText}>{scanResultMessage}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  headerTextContainer: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#2c3e50" },
  subtitle: { fontSize: 13, color: "#7f8c8d", marginTop: 2 },
  scannerContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  bottomBar: {
    paddingHorizontal: 20,
    gap: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: "600", color: "#2c3e50" },
  resultContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    backgroundColor: "#fff",
  },
  errorBg: {
    borderLeftColor: "#E24B4A",
    borderTopColor: "#f5a5a5",
    borderRightColor: "#f5a5a5",
    borderBottomColor: "#f5a5a5",
  },
  successBg: {
    borderLeftColor: "#639922",
    borderTopColor: "#b6d97c",
    borderRightColor: "#b6d97c",
    borderBottomColor: "#b6d97c",
  },
  warningBg: {
    borderLeftColor: "#d97706",
    borderTopColor: "#fcd34d",
    borderRightColor: "#fcd34d",
    borderBottomColor: "#fcd34d",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  errorCircle: { backgroundColor: "#FCEBEB" },
  successCircle: { backgroundColor: "#EAF3DE" },
  warningCircle: { backgroundColor: "#FEF3C7" },
  resultTextWrapper: { flex: 1, gap: 3 },
  resultLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.1 },
  resultSubText: { fontSize: 14, color: "#6b7280" },
  errorColor: { color: "#A32D2D" },
  successColor: { color: "#3B6D11" },
  warningColor: { color: "#92400e" },
  content: { marginTop: 40, justifyContent: "center", alignItems: "center" },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    opacity: 0.8,
  },
  resultAlert: {
    marginTop: 10,
    marginHorizontal: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
});

import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const [alertColor, setAlertColor] = useState<"green" | "yellow" | "red">("green");

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
            throw new Error("Order not found. Please check the waybill number.");
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
          const assignedBarangays = JSON.parse(userData.assignedBarangays || '[]');
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
          setScanResultMessage(`✓ Item successfully scanned! Destination: ${orderDetail.data.receiverBarangay}`);
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
            errorMessage += "Network connection error. Please check your internet and try again.";
          } else if (error.response?.status === 404) {
            errorMessage += "Order not found. Please verify the waybill number.";
          } else if (error.response?.status === 400) {
            errorMessage += error.response?.data?.message || "Invalid request. Please try again.";
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>RTS from Hub</Text>
          <Text style={styles.subtitle}>Scan items received from hub</Text>
        </View>
      </View>

      <View style={styles.scannerContainer}>
        <BarcodeScanner onScan={onScan} scanned={scanned} />
      </View>
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: scanned ? "#ef4444" : "#22c55e" }]} />
        <Text style={styles.statusText}>
          {loadingScan ? "Processing..." : scanned ? "Camera Locked" : "Ready to Scan"}
        </Text>
      </View>
      
      {scanResultMessage && (
        <View style={[
          styles.resultContainer, 
          alertColor === "green" ? styles.successBg : 
          alertColor === "yellow" ? styles.warningBg : 
          styles.errorBg
        ]}>
          <Ionicons 
            name={
              alertColor === "green" ? "checkmark-circle" : 
              alertColor === "yellow" ? "warning" : 
              "close-circle"
            } 
            size={24} 
            color={
              alertColor === "green" ? "#22c55e" : 
              alertColor === "yellow" ? "#f39c12" : 
              "#e74c3c"
            } 
          />
          <Text style={[
            styles.resultText, 
            alertColor === "green" ? styles.successColor : 
            alertColor === "yellow" ? styles.warningColor : 
            styles.errorColor
          ]}>
            {scanResultMessage}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    flexDirection: "row", alignItems: "center", paddingTop: 50,
    paddingBottom: 16, paddingHorizontal: 20, backgroundColor: "#fff"
  },
  headerTextContainer: { flex: 1 },
  backButton: {
    width: 40, height: 40, justifyContent: "center",
    alignItems: "center", marginRight: 8
  },
  title: { fontSize: 22, fontWeight: "700", color: "#2c3e50" },
  subtitle: { fontSize: 13, color: "#7f8c8d", marginTop: 2 },
  scannerContainer: { flex: 1, margin: 20, borderRadius: 16, overflow: "hidden" },
  statusContainer: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, marginHorizontal: 20, marginBottom: 12,
    backgroundColor: "#fff", borderRadius: 12
  },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: "600", color: "#2c3e50" },
  resultContainer: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 20, marginBottom: 12, padding: 16,
    borderRadius: 12, borderWidth: 1.5, shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 4, elevation: 3
  },
  errorBg: { backgroundColor: "#fee2e2", borderColor: "#ef4444" },
  successBg: { backgroundColor: "#d1fae5", borderColor: "#22c55e" },
  warningBg: { backgroundColor: "#fef3c7", borderColor: "#f59e0b" },
  resultText: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  errorColor: { color: "#dc2626" },
  successColor: { color: "#16a34a" },
  warningColor: { color: "#d97706" },
  content: { marginTop: 40, justifyContent: "center", alignItems: "center" },
  description: { fontSize: 16, textAlign: "center", marginTop: 20, opacity: 0.8 },
  resultAlert: {
    marginTop: 10, marginHorizontal: 12, padding: 10,
    borderRadius: 8, borderWidth: 2, alignItems: "center"
  }
});

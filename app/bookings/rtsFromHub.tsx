import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { ScanDetailCard, ScanDetailCardProps } from "@/components/ScanDetailCard";
import { ScanResultAlert } from "@/components/ScanResultAlert";
import { ScanStatsCard } from "@/components/ScanStatsCard";
import { ScanStatusBar } from "@/components/ScanStatusBar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { formatDestination, formatScanTime } from "@/utils/scanFormatting";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import deliveredSocket from "../../helpers/socketConnection";

export default function RtsFromHub() {
  // Auto-connect deliveredSocket when screen is mounted or revisited
  useEffect(() => {
    if (!deliveredSocket.connected) {
      deliveredSocket.connect();
    }
  }, []);

  // Leave socket room when leaving screen
  useEffect(() => {
    return () => {
      // Replace 'dorx123' with your dynamic room if needed
      deliveredSocket.emit("app_leave_room", "dorx123");
    };
  }, []);

  // Socket test function (optional, for UI button or debug)
  const socketTester = () => {
    console.log("Testing Socket Connection...");
    if (!deliveredSocket.connected) {
      deliveredSocket.connect();
    }
    deliveredSocket.emit("join_room", "dorx123");
    deliveredSocket.emit("send_updated_data", {
      roomId: "dorx123",
      transactionType: "Received by So",
    });
  };
  const router = useRouter();
  const { playSuccess, playError, playWarning } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [scannedData, setScannedData] = useState<string[]>([]);
  const [scanCount, setScanCount] = useState(0);
  const [alertColor, setAlertColor] = useState<"green" | "yellow" | "red">(
    "green",
  );
  const [scannedOrderDetails, setScannedOrderDetails] = useState<Omit<
    ScanDetailCardProps,
    "visible"
  > | null>(null);

  const onScan = async (scannedCode: any) => {
    if (scanned) return;
    setScanResultMessage("");
    setScanned(true);
    // Ensure we store the whole object so data.data works in the useEffect
    setData(scannedCode);
  };

  useEffect(() => {
    async function processScan() {
      if (!data || !data.data) return;

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
          if (orderDetail.data.rtsStatus !== "Arrived at Origin Hub") {
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

          const assignedBarangays = Array.isArray(userData.assignedBarangays)
            ? userData.assignedBarangays
            : JSON.parse(userData.assignedBarangays || "[]");

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
            `✓ Scan successful! Sender’s destination: ${orderDetail.data.senderBarangay}`,
          );
          setAlertColor("green");
          setScanCount((prev) => prev + 1);
          setLoadingScan(false);
          setScanned(false);
          const scanInstant = moment();
          setScannedOrderDetails({
            waybillNumber: data.data,
            parcelStatus: orderDetail.data.waybillStatus || orderDetail.data.rtsStatus,
            statusTone: "warning",
            senderName: orderDetail.data.senderName,
            receiverName: orderDetail.data.receiverName,
            destination: formatDestination(
              orderDetail.data.senderBarangay,
              orderDetail.data.senderCity,
              orderDetail.data.senderProvince,
            ),
            scanTime: formatScanTime(scanInstant),
          });
          setTimeout(() => {
            setScanResultMessage("");
            setData("");
            setScannedOrderDetails(null);
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
            errorMessage += error.message || "Unknown error occurred.";
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
          setData("");
        }, 10000);
      }
    }

    if (userData !== null && data !== "") {
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
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <ScreenHeader
        title="RTS from Hub"
        subtitle="Scan items received from hub"
        icon={<Ionicons name="scan-outline" size={20} color="#00BF63" />}
        onBack={() => router.back()}
      />

      <BarcodeScanner onScan={onScan} scanned={scanned} />

      <ScanStatusBar
        loading={loadingScan}
        readyText={scanned ? "Camera Locked" : "Ready to Scan"}
        processingText="Processing…"
      />

      <ScanResultAlert
        visible={!!data}
        loading={loadingScan}
        color={alertColor}
        message={scanResultMessage}
        code={data?.data}
        onRetry={
          alertColor === "red"
            ? () => {
                setData("");
                setScanResultMessage("");
                setScanned(false);
              }
            : undefined
        }
      />

      {scannedOrderDetails ? (
        <ScanDetailCard visible {...scannedOrderDetails} />
      ) : null}

      {/* SCAN COUNT */}
      <ScanStatsCard
        icon={<Ionicons name="checkmark-done-circle" size={22} color="#00BF63" />}
        label={scanCount === 1 ? "Item Scanned" : "Items Scanned"}
        value={scanCount}
      />

      {/* SOCKET TEST BUTTON */}
      <View style={{ alignItems: "center", marginVertical: 8 }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#00BF63",
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 8,
          }}
          onPress={socketTester}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Socket Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
});

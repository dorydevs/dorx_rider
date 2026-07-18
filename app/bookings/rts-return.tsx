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

export default function RTSIncomingScreen() {
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
  const sendUpdatedReturnData = () => {
    console.log("Testing Socket Connection...");
    if (!deliveredSocket.connected) {
      deliveredSocket.connect();
    }
    deliveredSocket.emit("join_room", "dorx123");
    deliveredSocket.emit("send_updated_data", {
      roomId: "dorx123",
      transactionType: "Returned",
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
  const [alertColor, setAlertColor] = useState<"green" | "yellow" | "red">(
    "green",
  );
  const [totalScannedCount, setTotalScannedCount] = useState(0);
  const [scannedOrderDetails, setScannedOrderDetails] = useState<Omit<
    ScanDetailCardProps,
    "visible"
  > | null>(null);

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
          const scanInstant = moment();
          const riderRtsItemPayload = {
            scannedDate: scanInstant.format("YYYY-MM-DD HH:mm:ss"),
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
          setScannedOrderDetails({
            waybillNumber: data.data,
            parcelStatus: "Returned",
            statusTone: "warning",
            senderName: validationResponse.data.senderName,
            receiverName: validationResponse.data.receiverName,
            destination: formatDestination(
              validationResponse.data.senderBarangay,
              validationResponse.data.senderCity,
              validationResponse.data.senderProvince,
            ),
            scanTime: formatScanTime(scanInstant),
          });
          setTimeout(() => {
            setScanResultMessage("");
            setData("");
            setScannedOrderDetails(null);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <ScreenHeader
        title="RTS Return"
        subtitle="Return RTS items to clients"
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
        label={totalScannedCount === 1 ? "Item Scanned" : "Items Scanned"}
        value={totalScannedCount}
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
          onPress={sendUpdatedReturnData}
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

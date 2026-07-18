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
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import deliveredSocket from "../../helpers/socketConnection";

export default function HubScreen() {
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
      transactionType: "Picked up by rider from hub",
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
  const [alertColor, setAlertColor] = useState<
    "green" | "blue" | "red" | "yellow" | "orange"
  >("blue");
  const [scannedOrderDetails, setScannedOrderDetails] = useState<Omit<
    ScanDetailCardProps,
    "visible"
  > | null>(null);
  const [remittanceCheckerData, setRemittanceCheckerData] =
    useState<boolean>(false);
  const [remittanceLoading, setRemittanceLoading] = useState<boolean>(false);
  const [scanCount, setScanCount] = useState(0);

  // Intercept Android back button and always return to Home
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true; // prevent default stack navigation
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [router]),
  );

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
          console.log("orderDetail : >> ", orderDetail.data.receiverCity);
          console.log("userData : >> ", userData.storeCity);
          console.log("orderDetail : >> ", orderDetail.data.orderStatus);
          console.log("orderDetail : >> ", orderDetail.data.waybillStatus);
          console.log("orderDetail : >> ", orderDetail.data.receiverCity);

          if (
            orderDetail.data.orderStatus === "Received by destination hub" &&
            orderDetail.data.waybillStatus === "In Transit" &&
            orderDetail.data?.hubTransaction.origin === "Provincial Office" &&
            orderDetail.data.receiverCity === userData.storeCity
          ) {
            const scanInstant = moment();
            const scanPayload = {
              orderNumber: data.data,
              status: "Picked up by rider from hub",
            };
            const transactionPayload = {
              status: "picked-up from hub",
              scannedDate: scanInstant.format("YYYY-MM-DD hh:mm:ss"),
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
            setScannedOrderDetails({
              waybillNumber: data.data,
              parcelStatus: "Picked up by rider from hub",
              senderName: orderDetail.data.senderName,
              receiverName: orderDetail.data.receiverName,
              destination: formatDestination(
                orderDetail.data.receiverBarangay,
                orderDetail.data.receiverCity,
                orderDetail.data.receiverProvince,
              ),
              scanTime: formatScanTime(scanInstant),
            });
            setAlertColor("green");
            setScanCount((prev) => prev + 1);
            setScanned(false);
          } else {
            console.log("NATAWAG? ");
            setScanResultMessage(
              orderDetail.data.waybillStatus
                ? `INVALID \n Item Status : ${orderDetail.data.waybillStatus}`
                : "This Item Has no Waybill Status yet",
            );
            setScannedOrderDetails(null);
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
          }, 5000);
        }
      } else {
        setScanResultMessage("Already Scanned!");
        setAlertColor("orange");
        setScanned(false);
        setLoadingScan(false);
        playWarning();
        setTimeout(() => {
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

          setRemittanceCheckerData(!hasDateDeliveredNotToday);
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

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <ScreenHeader
        title="Hub Scanner"
        subtitle="Pickup orders from hub"
        icon={<Ionicons name="scan-outline" size={20} color="#00BF63" />}
        onBack={() => router.back()}
      />
      {remittanceLoading ? (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonSquare} />
        </View>
      ) : remittanceCheckerData ? (
        <View style={styles.remittanceContainer}>
          <View style={styles.remittanceCard}>
            <View style={styles.remittanceIconContainer}>
              <Ionicons name="warning" size={32} color="#DC2626" />
            </View>
            <Text style={styles.remittanceTitle}>Remittance Required</Text>
            <Text style={styles.remittanceMessage}>
              Remittance balance must be remitted before you can access client
              bookings.
            </Text>
            <Text style={styles.remittanceSupport}>
              Please contact your Satellite Operator.
            </Text>
          </View>
        </View>
      ) : (
        <>
          <BarcodeScanner onScan={onScan} scanned={scanned} />

          {/* SCANNING STATUS */}
          <ScanStatusBar
            loading={loadingScan}
            readyText={scanned ? "Camera Locked" : "Ready to Scan"}
            processingText="Processing…"
          />

          {/* SCAN RESULT ALERT */}
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

          {/* SCAN DETAIL CARD (folds the old Barangay Destination card in) */}
          {scannedOrderDetails ? (
            <ScanDetailCard visible {...scannedOrderDetails} />
          ) : null}

          {/* SCAN COUNT */}
          <ScanStatsCard
            icon={<Ionicons name="checkmark-done-circle" size={22} color="#00BF63" />}
            label={scanCount === 1 ? "Item Scanned" : "Items Scanned"}
            value={scanCount}
          />
        </>
      )}
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
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  skeletonContainer: {
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonSquare: {
    width: 300,
    height: 300,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  remittanceContainer: {
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  remittanceCard: {
    width: "100%",
    maxWidth: 760,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  remittanceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  remittanceTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: "#DC2626",
  },
  remittanceMessage: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 22,
  },
  remittanceSupport: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
    color: "#94A3B8",
  },
});

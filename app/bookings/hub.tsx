import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

const ALERT_COLORS: Record<
  string,
  { border: string; bg: string; text: string }
> = {
  green: { border: "#16a34a", bg: "#22c55e", text: "#ffffff" },
  red: { border: "#dc2626", bg: "#dc2626", text: "#ffffff" },
  yellow: { border: "#d97706", bg: "#f59e0b", text: "#ffffff" },
  blue: { border: "#16a34a", bg: "#22c55e", text: "#ffffff" },
  orange: { border: "#ea580c", bg: "#f97316", text: "#ffffff" },
};

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
  const [barangayDestination, setBarangayDestination] = useState("");
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
            const scanPayload = {
              orderNumber: data.data,
              status: "Picked up by rider from hub",
            };
            const transactionPayload = {
              status: "picked-up from hub",
              scannedDate: moment().format("YYYY-MM-DD hh:mm:ss"),
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
            setBarangayDestination(orderDetail.data.receiverBarangay);
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
            setBarangayDestination("");
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

  const colors = ALERT_COLORS[alertColor] ?? ALERT_COLORS.blue;

  return (
    <SafeAreaView style={styles.container}>
      {/* SOCKET TEST BUTTON */}
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Hub Scanner</Text>
          <Text style={styles.subtitle}>Pickup orders from hub</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      {remittanceLoading ? (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonSquare} />
        </View>
      ) : remittanceCheckerData ? (
        <View style={styles.remittanceContainer}>
          <View style={styles.remittanceCard}>
            <View style={styles.remittanceIconContainer}>
              <Ionicons name="warning" size={32} color="#dc2626" />
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

          {/* BARANGAY DESTINATION CARD */}
          {barangayDestination !== "" && (
            <View style={styles.destinationCard}>
              <View style={styles.destinationIconContainer}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={22}
                  color="#22c55e"
                />
              </View>
              <View>
                <Text style={styles.destinationLabel}>
                  Barangay Destination
                </Text>
                <Text style={styles.destinationValue}>
                  {barangayDestination}
                </Text>
              </View>
            </View>
          )}
        </>
      )}
      <View style={{ alignItems: "center", marginVertical: 8 }}>
        <TouchableOpacity
          style={{
            backgroundColor: "#22c55e",
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  headerTextContainer: {
    flex: 1,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 1,
  },
  countBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#00BF6315",
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#00BF63",
  },
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
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#15803D",
  },
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
  destinationCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  destinationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  destinationLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 2,
  },
  destinationValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
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
    backgroundColor: "#e5e7eb",
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
    color: "#dc2626",
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

import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ArrowLeft, MapPin, ScanLine } from "lucide-react-native";
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
  const [, setScanCount] = useState(0);

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

          if (
            orderDetail.data.orderStatus === "Received by branch" &&
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
          playError();
          setAlertColor("red");
          setScanResultMessage(
            `INVALID: ${error?.response?.data?.message ?? "Scan failed"}`,
          );
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
  }, [data, userData, playError, playSuccess, playWarning, scannedData]);

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

  const colors = ALERT_COLORS[alertColor] ?? ALERT_COLORS.blue;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#22c55e" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Hub Scanner</Text>
          <Text style={styles.subtitle}>Pickup orders from hub</Text>
        </View>
        <View style={styles.scanIconBadge}>
          <ScanLine size={22} color="#22c55e" strokeWidth={2} />
        </View>
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
                  styles.resultAlert,
                  alertColor === "green"
                    ? styles.resultAlertGreen
                    : alertColor === "orange"
                      ? styles.resultAlertOrange
                      : styles.resultAlertRed,
                ]}
              >
                <View
                  style={[styles.resultDot, { backgroundColor: colors.border }]}
                />
                <Text style={[styles.resultText, { color: colors.border }]}>
                  {scanResultMessage}
                </Text>
              </View>
            )}

            {barangayDestination !== "" && (
              <View style={styles.destinationCard}>
                <View style={styles.destinationIconContainer}>
                  <MapPin size={20} color="#22c55e" strokeWidth={2} />
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
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
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
  headerTextContainer: {
    flex: 1,
  },
  scanIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
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
  resultAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultAlertGreen: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  resultAlertRed: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  resultAlertOrange: { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
  resultDot: { width: 8, height: 8, borderRadius: 4 },
  resultText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
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

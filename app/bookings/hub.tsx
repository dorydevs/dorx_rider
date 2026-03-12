import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const [alertColor, setAlertColor] = useState("blue");
  const [barangayDestination, setBarangayDestination] = useState("");
  const [remittanceCheckerData, setRemittanceCheckerData] =
    useState<boolean>(false);
  const [remittanceLoading, setRemittanceLoading] = useState<boolean>(false);

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
            setAlertColor("blue");
            setScanned(false);
          } else {
            console.log("NATAWAG? ");
            setScanResultMessage(
              `INVALID \n Item Status : ${orderDetail.data.waybillStatus}`,
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
          }, 2000);
        }
      } else {
        setScanResultMessage("Already Scanned!");
        setAlertColor("red");
        setScanned(false);
        setLoadingScan(false);
        playError();
        setTimeout(() => {
          setScanned(false);
          setData("");
        }, 2000);
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
    <View style={styles.container}>
      <View
        style={{ flexDirection: "row", alignItems: "center", paddingTop: 25 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="chevron-left" size={24} color="#3f6e6c" />
        </TouchableOpacity>

        <Text style={styles.title}>HUB</Text>
      </View>

      {remittanceLoading ? (
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonSquare} />
        </View>
      ) : remittanceCheckerData ? (
        <View style={styles.remittanceContainer}>
          <View style={styles.remittanceCard}>
            <FontAwesome name="exclamation-circle" size={22} color="red" />
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
            <Text
              style={{
                textAlign: "center",
                fontWeight: "bold",
                fontSize: 17,
                color: alertColor,
              }}
            >
              {scanResultMessage}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginRight: -10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#3f6e6c",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 30,
  },
  content: {
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    opacity: 0.8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
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
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    elevation: 2,
  },
  remittanceTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "red",
  },
  remittanceMessage: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
    color: "red",
    lineHeight: 20,
  },
  remittanceSupport: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
    color: "red",
  },
  resultAlert: {
    marginTop: 10,
    marginHorizontal: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  resultText: { fontSize: 14, fontWeight: "600", marginTop: 4 },
});

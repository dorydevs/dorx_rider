import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
// import { useParams } from "react-router-dom";\
type ClientData = any;

export default function scanClientScheduledParcel() {
  const { playSuccess, playError, playWarning } = useScannerSounds();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { clientData, clientScheduledToPickUpData, ScheduledData } =
    useLocalSearchParams();

  const [data, setData] = useState<string>("");
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scannedData, setScannedData] = useState<string[]>([]);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [alertColor, setAlertColor] = useState<"green" | "red" | "yellow">(
    "green",
  );
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

  const client: ClientData = clientData
    ? JSON.parse(clientData as string)
    : null;

  const clientScheduledToPickUp: ClientData = clientScheduledToPickUpData
    ? JSON.parse(clientScheduledToPickUpData as string)
    : null;

  const clientScheduledData: ClientData = ScheduledData
    ? JSON.parse(ScheduledData as string)
    : null;

  console.log("clientScheduledData : >>> ", clientScheduledData);

  console.log("ScheduledData : >>>", ScheduledData);

  const onScan = async (scannedCode: string) => {
    if (scanned) return;

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
      } finally {
        console.log("SUCCESS");
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    async function processScan() {
      if (!data) return;

      if (!scannedData.includes(data)) {
        setLoadingScan(true);

        try {
          // Validate order number
          const validationResponse = await axiosInstance(userData?.token).get(
            `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data.data}&clientId=${client.clientId}&pickupAddressId=${clientScheduledToPickUp.pickupAddressId}`,
          );

          if (validationResponse.data) {
            console.log("RESUSLT : >>> ", validationResponse.data);
            // validate: only waybills that has status of scheduled-for-pickup are allowed to scan
            if (
              validationResponse.data.result.orderStatus !==
              "Scheduled for Pickup"
            ) {
              setScanResultMessage(
                "Waybills that have the status of 'printed' and 'scheduled-for-pickup' are only allowed to scan.",
              );
              setAlertColor("yellow");
              //   notAllowed = true;
              //   playWarningSound();
              setLoadingScan(false);
              return;
            } else {
              // scan waybill
              // setWaybillBelongsToSelectedPickupAdd(true);

              const scanPayload = {
                orderNumber: data.data,
                status: "Picked up by Rider",
              };
              const orderTransaction = clientScheduledData.orders.find(
                (d: any) => d.orderNumber === data,
              );

              const transactionPayload = {
                status: "picked-up",
                scannedDate: moment().format("YYYY-MM-DD hh:mm:ss"),
                riderId: userData.id,
                orderTransactionId: orderTransaction?.orderTransactionId,
              };

              // // create store inbound scanning transaction
              await axiosInstance(userData.token).post(
                `/api/riderTransaction`,
                transactionPayload,
              );
              // update order status
              const scanResponse = await axiosInstance(userData.token).put(
                `/api/orderTransactions/scanWaybill`,
                scanPayload,
              );
              // log scanned data for cds
              const logScanData = await axiosInstance(userData.token).post(
                `/api/log-scan`,
                {
                  shippingFee: orderTransaction?.receivableFreight,
                  transactionType: "inbound",
                  wareHouseId: userData.storeId,
                  wareHouseType: "store",
                  orderTransactionId: orderTransaction?.orderTransactionId,
                },
              );
              console.log(">>> logScanData:", logScanData);

              playSuccess();
              setTotalPendingCount((prev) => prev - 1);
              //   setTotalScannedCount((prev) => prev + 1);

              setAlertColor("green");

              setScannedData((prev) => [...prev, data]);
              setScanResultMessage(
                scanResponse.data.message ?? "Successfully Scanned!",
              );

              // send scanned data to hub
              // socket.emit("send_rider_scanned_inbound_waybill", {
              //   data: {
              //     clientId: client.clientId,
              //     orderNumber: data,
              //   },
              // });
            }
          } else {
            setScanResultMessage("Invalid.");
            setAlertColor("red");
            setLoadingScan(false);
            playError();
          }
          playSuccess();
        } catch (error) {
          console.error("HUB SCANNING ERROR:", error);
          setScanResultMessage("Scanning Error");
          setAlertColor("red");
          setLoadingScan(false);
          playError();
        } finally {
          setLoadingScan(false);
          setTimeout(() => {
            setScanned(false);
            setData("");
          }, 1000);
        }
      } else {
        setScanResultMessage("Already Scanned!");
        setAlertColor("yellow");
        playWarning();
        setTimeout(() => {
          setScanned(false);
          setData("");
        }, 1000);
      }
    }
    if (userData !== null) {
      processScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, userData]);

  console.log("scanned : >> ", scanned);

  return (
    <View style={styles.container}>
      {/* CAMERA */}
      <BarcodeScanner onScan={onScan} scanned={scanned} />

      {/* SCANNING STATUS */}
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
      <View
        style={{
          padding: 20,
          elevation: 2,
          backgroundColor: "white",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 20,
          marginTop: 20,
        }}
      >
        <Text style={{ fontSize: 20 }}>Total Items</Text>
        <Text style={{ fontSize: 18 }}>
          {clientScheduledData.orders.length}
        </Text>
        {scanResultMessage && (
          <View style={{ padding: 20 }}>
            <Text>Note : {scanResultMessage}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginRight: -10,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",

    color: "#50a3fc",
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

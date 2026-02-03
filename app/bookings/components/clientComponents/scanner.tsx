import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import BottomDrawer from "react-native-animated-bottom-drawer";
import { Button } from "react-native-paper";
// import { useParams } from "react-router-dom";\
type ClientData = any;
const SheetItem = ({ label, value }: { label: string; value?: any }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={{ fontSize: 12, color: "#6b7280" }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: "600" }}>{value ?? "-"}</Text>
  </View>
);

const Divider = () => (
  <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 12 }} />
);

export default function scanClientScheduledParcel() {
  const { playSuccess, playError, playWarning } = useScannerSounds();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { clientData, clientScheduledToPickUpData, ScheduledData } =
    useLocalSearchParams();
  const bottomDrawerRef = useRef<{
    open: () => void;
    close: () => void;
  } | null>(null);
  const clientScheduledData: ClientData = ScheduledData
    ? JSON.parse(ScheduledData as string)
    : null;
  const [selectedItem, setSelectedItem] = useState<ClientData | null>(null);
  const [data, setData] = useState<string>("");
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scannedData, setScannedData] = useState<string[]>([]);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [totalPendingCount, setTotalPendingCount] = useState(
    clientScheduledData.orders.length,
  );
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

  console.log(clientScheduledData);

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

  console.log("client : >> ", clientScheduledToPickUp);

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
            setSelectedItem(validationResponse.data);

            // validate: only waybills that has status of scheduled-for-pickup are allowed to scan
            if (
              validationResponse.data.orderStatus !== "Scheduled for Pickup"
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
              bottomDrawerRef.current?.open();

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
          }, 2000);
        }
      } else {
        setScanResultMessage("Already Scanned!");
        setAlertColor("yellow");
        playWarning();
        setTimeout(() => {
          setScanned(false);
          setData("");
        }, 2000);
      }
    }
    if (userData !== null) {
      processScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, userData]);

  const bottomDrawerClose = () => {
    if (totalPendingCount === 0) {
      router.back();
    } else {
      bottomDrawerRef.current?.close();
    }
  };

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
        <Text style={{ fontSize: 18 }}>{totalPendingCount}</Text>
        {scanResultMessage && (
          <View style={{ padding: 20 }}>
            <Text>Note : {scanResultMessage}</Text>
          </View>
        )}
      </View>
      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={560}
        enableSnapping={false}
      >
        <View style={{ height: 500 }}>
          {scanResultMessage && (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  padding: 20,
                  borderRadius: 20,
                  alignItems: "center",
                  backgroundColor: "#33ad60",
                  width: 300,
                }}
              >
                <Text
                  style={{ textAlign: "center", width: "90%", color: "white" }}
                >
                  {scanResultMessage}
                </Text>
              </View>
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedItem && (
              <View style={{ padding: 16 }}>
                <View style={styles.items}>
                  <SheetItem label="Item Name" value={selectedItem.itemName} />
                  <SheetItem
                    label="Item Weight"
                    value={selectedItem.itemWeight}
                  />
                  <SheetItem
                    label="Number Of Items"
                    value={selectedItem.numberOfItem}
                  />
                </View>

                <Divider />
                <View style={styles.items}>
                  <SheetItem label="COD Value" value={selectedItem.codValue} />
                  <SheetItem label="COD Fee" value={selectedItem.codFee} />
                  <SheetItem
                    label="Item Value"
                    value={selectedItem.itemValue}
                  />
                </View>

                <Divider />
                <View style={styles.items}>
                  <SheetItem
                    label="Valuation Fee"
                    value={selectedItem.valuationFee}
                  />
                  <SheetItem
                    label="Receivable Freight"
                    value={selectedItem.receivableFreight}
                  />
                </View>

                <Divider />
                <View style={styles.items}>
                  <SheetItem
                    label="Pouch Size"
                    value={selectedItem.pouchesSize}
                  />
                  <SheetItem label="Remarks" value={selectedItem.remarks} />
                </View>

                <Divider />

                <SheetItem
                  label="Total Shipping Costs"
                  value={selectedItem.totalShippingCost}
                />
                <Divider />
                <SheetItem
                  label="Waybill Number"
                  value={selectedItem.waybillNumber}
                />
                <SheetItem
                  label="Order Number"
                  value={selectedItem.orderNumber}
                />

                <Divider />

                <SheetItem label="Sender" value={selectedItem.senderName} />
                <SheetItem
                  label="Sender Phone"
                  value={selectedItem.senderPhone}
                />
                <SheetItem
                  label="Sender Address"
                  value={`${selectedItem.senderProvince}, ${selectedItem.senderCity}, ${selectedItem.senderBarangay}`}
                />

                <Divider />

                <Button
                  onPress={() => bottomDrawerClose()}
                  buttonColor="green"
                  mode="contained"
                  textColor="white"
                >
                  Close
                </Button>
              </View>
            )}
          </ScrollView>
        </View>
      </BottomDrawer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
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
  items: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
});

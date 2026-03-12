import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
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
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scannedData, setScannedData] = useState<string[]>([]);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [totalPendingCount, setTotalPendingCount] = useState(
    clientScheduledData.orders.length,
  );
  const [alertColor, setAlertColor] = useState<"green" | "yellow" | "red">("green");
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

  const client: ClientData = clientData
    ? JSON.parse(clientData as string)
    : null;

  const clientScheduledToPickUp: ClientData = clientScheduledToPickUpData
    ? JSON.parse(clientScheduledToPickUpData as string)
    : null;

  console.log(clientScheduledData);

  const onScan = async (scannedCode: any) => {
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
      }
    };

    loadUserData();
  }, [user]);

  console.log("userInfo : >> ", userData);

  console.log("client : >> ", clientScheduledToPickUp);

  useEffect(() => {
    async function processScan() {
      if (!data) return;

      if (!scannedData.includes(data.data)) {
        setLoadingScan(true);
        setScanResultMessage("");

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
                orderTransactionId: validationResponse?.data.orderTransactionId,
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
                  shippingFee: validationResponse.data.receivableFreight,
                  transactionType: "inbound",
                  wareHouseId: userData.storeId,
                  wareHouseType:
                    userData.accountType === 0 ? "store" : "hub-rider",
                  orderTransactionId:
                    validationResponse.data.orderTransactionId,
                },
              );
              console.log(">>> logScanData:", logScanData);

              playSuccess();
              setTotalPendingCount((prev: any) => prev - 1);
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
          if (!validationResponse.data) {
            throw new Error("Order not found. Please check the waybill number.");
          }

          setSelectedItem(validationResponse.data);

          // Validate order status
          if (validationResponse.data.orderStatus !== "Scheduled for Pickup") {
            setScanResultMessage(
              `Cannot scan: Order status is "${validationResponse.data.orderStatus}". Only orders with "Scheduled for Pickup" status can be scanned.`,
            );
            setAlertColor("yellow");
            playWarning();
            setLoadingScan(false);
            setTimeout(() => {
              setScanResultMessage("");
              setScanned(false);
              setData("");
            }, 4000);
            return;
          }

          // Find order transaction
          const orderTransaction = clientScheduledData.orders.find(
            (d: any) => d.orderNumber === data.data,
          );

          if (!orderTransaction) {
            setScanResultMessage(
              "Order not found in scheduled pickup list. Please refresh and try again.",
            );
            setAlertColor("yellow");
            playWarning();
            setLoadingScan(false);
            setTimeout(() => {
              setScanResultMessage("");
              setScanned(false);
              setData("");
            }, 4000);
            return;
          }

          // Prepare payloads
          const scanPayload = {
            orderNumber: data.data,
            status: "Picked up by Rider",
          };

          const transactionPayload = {
            status: "picked-up",
            scannedDate: moment().format("YYYY-MM-DD HH:mm:ss"),
            riderId: userData.id,
            orderTransactionId: orderTransaction.orderTransactionId,
          };

          // Create rider transaction
          await axiosInstance(userData.token).post(
            `/api/riderTransaction`,
            transactionPayload,
          );

          // Update order status
          const scanResponse = await axiosInstance(userData.token).put(
            `/api/orderTransactions/scanWaybill`,
            scanPayload,
          );

          // Log scanned data for CDS
          await axiosInstance(userData.token).post(
            `/api/log-scan`,
            {
              shippingFee: validationResponse.data.receivableFreight,
              transactionType: "inbound",
              wareHouseId: userData.storeId,
              wareHouseType: "store",
              orderTransactionId: orderTransaction.orderTransactionId,
            },
          );

          playSuccess();
          setTotalPendingCount((prev) => prev - 1);
          setAlertColor("green");
          setScannedData((prev) => [...prev, data.data]);
          setScanResultMessage(
            scanResponse.data.message ?? `✓ Successfully scanned! ${totalPendingCount - 1} items remaining.`,
          );
          bottomDrawerRef.current?.open();
          
          setTimeout(() => {
            setScanned(false);
            setData("");
          }, 2000);

        } catch (error: any) {
          console.error("CLIENT SCANNING ERROR:", error);
          playError();
          setAlertColor("red");
          setLoadingScan(false);
          
          let errorMessage = "Scanning failed. ";
          
          if (error.message === "Network Error" || !error.response) {
            errorMessage += "Network connection error. Please check your internet and try again.";
          } else if (error.response?.status === 404) {
            errorMessage += "Order not found or not assigned to this pickup address.";
          } else if (error.response?.status === 400) {
            errorMessage += error.response?.data?.message || "Invalid request. Please check the order details.";
          } else if (error.response?.status === 401) {
            errorMessage += "Session expired. Please log in again.";
          } else if (error.response?.status === 409) {
            errorMessage += "This order has already been processed.";
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
            setScanned(false);
            setData("");
          }, 5000);
        } finally {
          setLoadingScan(false);
        }
      } else {
        setScanResultMessage("⚠ This item has already been scanned.");
        setAlertColor("yellow");
        playWarning();
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
          elevation: 4,
          backgroundColor: "white",
          flexDirection: "column",
          alignItems: "center",
          borderRadius: 16,
          marginTop: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "600", color: "#2c3e50", marginBottom: 4 }}>Items Remaining</Text>
        <Text style={{ fontSize: 32, fontWeight: "700", color: "#22c55e" }}>{totalPendingCount}</Text>
        <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
          {scannedData.length} scanned
        </Text>
      </View>
      
      {scanResultMessage && (
        <View style={[
          styles.resultAlert,
          alertColor === "green" ? styles.successAlert : 
          alertColor === "yellow" ? styles.warningAlert : 
          styles.errorAlert
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
              alertColor === "yellow" ? "#f59e0b" : 
              "#ef4444"
            } 
          />
          <Text style={[
            styles.resultText,
            alertColor === "green" ? { color: "#16a34a" } : 
            alertColor === "yellow" ? { color: "#d97706" } : 
            { color: "#dc2626" }
          ]}>
            {scanResultMessage}
          </Text>
        </View>
      )}
      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={560}
        enableSnapping={false}
        handleComponent={() => null}
        customStyles={{
          container: {
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            borderWidth: 0,
            borderTopWidth: 0,
            overflow: "hidden",
          },
          drawerContainer: {
            backgroundColor: "#fff",
            borderWidth: 0,
            borderTopWidth: 0,
            paddingTop: 0,
            marginTop: 0,
          },
          handle: {
            display: "none",
            height: 0,
            width: 0,
            backgroundColor: "transparent",
          },
          handleIndicator: {
            display: "none",
            height: 0,
            width: 0,
            backgroundColor: "transparent",
          },
        }}
      >
        <View style={{ backgroundColor: "#fff", marginTop: -20, paddingTop: 20 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerContent}>
          {scanResultMessage && (
            <View style={styles.successBanner}>
              <Text style={styles.successBannerText}>
                {scanResultMessage}
              </Text>
            </View>
          )}
          {selectedItem && (
            <View>
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
    color: "#4ade80",
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
    marginTop: 20,
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successAlert: {
    backgroundColor: "#d1fae5",
    borderColor: "#22c55e",
  },
  warningAlert: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  errorAlert: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  resultText: { 
    flex: 1,
    fontSize: 14, 
    fontWeight: "600", 
    lineHeight: 20,
  },
  items: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e8ecf1",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  drawerContent: {
    padding: 20,
  },
  successBanner: {
    backgroundColor: "#22c55e",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  successBannerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

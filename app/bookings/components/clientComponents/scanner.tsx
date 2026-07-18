import { BarcodeScanner } from "@/components/BarcodeScanner";
import { DrawerHeader } from "@/components/DrawerHeader";
import { ScanResultAlert } from "@/components/ScanResultAlert";
import { useScannerSounds } from "@/components/ScannerSounds";
import { ScanStatsCard } from "@/components/ScanStatsCard";
import { ScanStatusBar } from "@/components/ScanStatusBar";
import { ScreenHeader } from "@/components/ScreenHeader";
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
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import BottomDrawer from "react-native-animated-bottom-drawer";
import { SafeAreaView } from "react-native-safe-area-context";

type ClientData = any;
const SheetItem = ({ label, value }: { label: string; value?: any }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={{ fontSize: 12, color: "#64748B" }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: "600" }}>{value ?? "-"}</Text>
  </View>
);

const Divider = () => (
  <View style={{ height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 }} />
);

export default function scanClientScheduledParcel() {
  const { playSuccess, playError, playWarning } = useScannerSounds();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
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
  const [alertColor, setAlertColor] = useState<"green" | "yellow" | "red">(
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

  useEffect(() => {
    async function processScan() {
      if (!data) return;

      if (scannedData.includes(data.data)) {
        setScanResultMessage("⚠ This item has already been scanned.");
        setAlertColor("yellow");
        playWarning();
        setTimeout(() => {
          setScanResultMessage("");
          setScanned(false);
          setData("");
        }, 3000);
        return;
      }

      setLoadingScan(true);
      setScanResultMessage("");

      try {
        const validationResponse = await axiosInstance(userData?.token).get(
          `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data.data}&clientId=${client.clientId}&pickupAddressId=${clientScheduledToPickUp.pickupAddressId}`,
        );

        if (!validationResponse.data) {
          throw new Error("Order not found. Please check the waybill number.");
        }

        setSelectedItem(validationResponse.data);

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

        const scanPayload = {
          orderNumber: data.data,
          status: "Picked up by Rider",
        };

        const transactionPayload = {
          status: "picked-up",
          scannedDate: moment().format("YYYY-MM-DD HH:mm:ss"),
          riderId: userData.id,
          orderTransactionId: validationResponse.data.orderTransactionId,
        };

        await axiosInstance(userData.token).post(
          `/api/riderTransaction`,
          transactionPayload,
        );

        const scanResponse = await axiosInstance(userData.token).put(
          `/api/orderTransactions/scanWaybill`,
          scanPayload,
        );

        await axiosInstance(userData.token).post(`/api/log-scan`, {
          shippingFee: validationResponse.data.receivableFreight,
          transactionType: "inbound",
          wareHouseId: userData.storeId,
          wareHouseType: userData.accountType === 0 ? "store" : "hub-rider",
          orderTransactionId: validationResponse.data.orderTransactionId,
        });

        playSuccess();
        setTotalPendingCount((prev: any) => prev - 1);
        setAlertColor("green");
        setScannedData((prev) => [...prev, data.data]);
        setScanResultMessage(
          scanResponse.data.message ??
            `✓ Successfully scanned! ${totalPendingCount - 1} items remaining.`,
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

        let errorMessage = "Scanning failed. ";

        if (error.message === "Network Error" || !error.response) {
          errorMessage +=
            "Network connection error. Please check your internet and try again.";
        } else if (error.response?.status === 404) {
          errorMessage +=
            "Order not found or not assigned to this pickup address.";
        } else if (error.response?.status === 400) {
          errorMessage +=
            error.response?.data?.message ||
            "Invalid request. Please check the order details.";
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

  // Explicit scroll height = drawer height minus header height (~60px)
  const drawerScrollHeight = height * 0.75 - 60;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <ScreenHeader
        title="Scan Scheduled Pickup"
        subtitle="Scan a QR Code or Barcode to confirm pickup"
        icon={<Ionicons name="scan-outline" size={20} color="#00BF63" />}
        onBack={() => router.back()}
      />

      {/* CAMERA */}
      <BarcodeScanner onScan={onScan} scanned={scanned} />

      {/* SCANNING STATUS */}
      <ScanStatusBar
        loading={loadingScan}
        readyText={scanned ? "Camera Locked" : "Ready to Scan"}
        processingText="Processing…"
      />

      <ScanResultAlert
        visible={!!scanResultMessage}
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

      <ScanStatsCard
        icon={<Ionicons name="layers-outline" size={22} color="#00BF63" />}
        label="Items Remaining"
        value={totalPendingCount}
        subtext={`${scannedData.length} scanned`}
      />

      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={height * 0.75}
        enableSnapping={false}
        handleComponent={() => null}
        customStyles={{
          container: {
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            overflow: "hidden",
          },
          drawerContainer: {
            flex: 1,
            backgroundColor: "#fff",
            paddingTop: 0,
            marginTop: 0,
          },
          handle: { display: "none" },
          handleIndicator: { display: "none" },
        }}
      >
        {/* FIXED HEADER */}
        <DrawerHeader
          title="Scan Details"
          subtitle={selectedItem?.waybillNumber}
          icon={<Ionicons name="document-text" size={22} color="#00BF63" />}
          onClose={bottomDrawerClose}
          showHandle={false}
        />

        {/* SCROLLABLE AREA */}
        <ScrollView
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
          // Changed to flex: 1 so it automatically fills available space correctly
          style={{ flex: 1 }}
          contentContainerStyle={styles.drawerContent}
        >
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
                <SheetItem label="Item Value" value={selectedItem.itemValue} />
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
            </View>
          )}
        </ScrollView>
      </BottomDrawer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  items: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  drawerContent: {
    padding: 20,
    paddingBottom: 80,
  },
  successBanner: {
    backgroundColor: "#00BF63",
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

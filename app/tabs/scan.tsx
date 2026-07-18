import { BarcodeScanner } from "@/components/BarcodeScanner";
import { DrawerHeader } from "@/components/DrawerHeader";
import { ScanResultAlert } from "@/components/ScanResultAlert";
import { ScanStatusBar } from "@/components/ScanStatusBar";
import { useScannerSounds } from "@/components/ScannerSounds";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import BottomDrawer from "react-native-animated-bottom-drawer";
import { SafeAreaView } from "react-native-safe-area-context";
export default function RTSIncomingScreen() {
  const router = useRouter();

  const { playSuccess, playError, playWarning } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [alertColor, setAlertColor] = useState<"green" | "red">("green");
  // const [waybillDetails, setWaybillDetails] = useState<any>([]);
  const [waybillDetails, setWaybillDetails] = useState<any>({});

  const bottomDrawerRef = useRef<any>(null);

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number;
  }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? "-"}</Text>
    </View>
  );

  const onScan = async (scannedCode: any) => {
    if (scanned) return;
    setScanResultMessage("");
    setScanned(true);
    setData(scannedCode);
  };

  const renderOrderStatus = (orderStatus: any) => {
    let color = "";
    if (orderStatus === "Pending") color = "green";
    if (orderStatus === "Picked up by Rider") color = "orange";
    if (orderStatus === "Received by branch") color = "blue";
    if (orderStatus === "Cancelled") color = "red";
    if (orderStatus === "Printed") color = "cyan";
    return <Text>{orderStatus}</Text>;
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
    const handleScan = async () => {
      if (data) {
        setLoadingScan(true);

        try {
          const { data: waybillData } = await axiosInstance(userData.token).get(
            `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data.data}`,
          );
          playSuccess();

          setWaybillDetails(waybillData);
          setAlertColor("green");
          setScanResultMessage("✓ Scan successful! Item details loaded.");
          setLoadingScan(false);
          setScanned(false);
          bottomDrawerRef.current?.open();
        } catch (error: any) {
          playError();
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
            errorMessage += "Unknown error occurred.";
          }

          setAlertColor("red");
          setScanResultMessage(errorMessage);
        }
      }
    };
    if (userData !== null) {
      handleScan();
    }
  }, [data, userData]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Scan Items"
        subtitle="Scan waybill or order number"
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
        visible={loadingScan || !!scanResultMessage}
        loading={loadingScan}
        color={alertColor}
        message={scanResultMessage}
        onRetry={
          alertColor === "red"
            ? () => {
                setScanResultMessage("");
                setData("");
              }
            : undefined
        }
      />

      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={560}
        enableSnapping={false}
      >
        <DrawerHeader
          title="Parcel Details"
          subtitle={waybillDetails.waybillNumber}
          icon={<Ionicons name="cube" size={22} color="#00BF63" />}
          onClose={() => bottomDrawerRef.current?.close()}
        />
        <ScrollView contentContainerStyle={styles.drawerContent}>
          <SectionHeader
            title="Item Details"
            accentColor="#00BF63"
            icon={<Ionicons name="cube" size={18} color="#00BF63" />}
          />

          <InfoRow label="Item Name" value={waybillDetails.itemName} />
          <InfoRow label="Item Weight" value={waybillDetails.itemWeight} />
          <InfoRow
            label="Number Of Items"
            value={waybillDetails.numberOfItem}
          />
          <InfoRow label="COD Value" value={`₱ ${waybillDetails.codValue}`} />
          <InfoRow label="COD Fee" value={`₱ ${waybillDetails.codFee}`} />
          <InfoRow label="Item Value" value={`₱ ${waybillDetails.itemValue}`} />
          <InfoRow
            label="Valuation Fee"
            value={`₱ ${waybillDetails.valuationFee}`}
          />
          <InfoRow
            label="Receivable Freight"
            value={`₱ ${waybillDetails.receivableFreight}`}
          />
          <InfoRow
            label="Total Shipping Costs"
            value={`₱ ${waybillDetails.totalShippingCost}`}
          />
          <InfoRow label="Pouches Size" value={waybillDetails.pouchesSize} />
          <InfoRow label="Remarks" value={waybillDetails.remarks} />

          <SectionHeader
            title="Waybill Details"
            accentColor="#00BF63"
            icon={
              <Ionicons name="document-text" size={18} color="#00BF63" />
            }
          />

          <InfoRow
            label="Waybill Number"
            value={waybillDetails.waybillNumber}
          />
          <InfoRow label="Order Number" value={waybillDetails.orderNumber} />
          <InfoRow label="Status" value={waybillDetails.orderStatus} />

          <SectionHeader
            title="Sender"
            accentColor="#00BF63"
            icon={<Ionicons name="person" size={18} color="#00BF63" />}
          />

          <InfoRow label="Name" value={waybillDetails.senderName} />
          <InfoRow label="Phone" value={waybillDetails.senderPhone} />
          <InfoRow
            label="Province / City / Brgy"
            value={`${waybillDetails.senderProvince} / ${waybillDetails.senderCity} / ${waybillDetails.senderBarangay}`}
          />
          <InfoRow label="Address" value={waybillDetails.senderAddress} />

          <SectionHeader
            title="Recipient"
            accentColor="#00BF63"
            icon={<Ionicons name="location" size={18} color="#00BF63" />}
          />

          <InfoRow label="Name" value={waybillDetails.receiverName} />
          <InfoRow label="Phone" value={waybillDetails.receiverPhone} />
          <InfoRow
            label="Province / City / Brgy"
            value={`${waybillDetails.receiverProvince} / ${waybillDetails.receiverCity} / ${waybillDetails.receiverBarangay}`}
          />
          <InfoRow label="Address" value={waybillDetails.receiverAddress} />
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
  drawerContent: {
    padding: 20,
    paddingBottom: 40,
  },
  row: {
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
});

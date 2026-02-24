import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
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
  TouchableOpacity,
  View,
} from "react-native";
import BottomDrawer from "react-native-animated-bottom-drawer";
export default function RTSIncomingScreen() {
  const router = useRouter();

  const { playSuccess, playError, playWarning } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
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

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color="#22c55e" />
      <Text style={styles.sectionTitle}>{title}</Text>
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
          setLoadingScan(false);
          setScanned(false);
          bottomDrawerRef.current?.open();
        } catch (error) {
          playError();
          setLoadingScan(false);
          setScanned(false);
        }
      }
    };
    if (userData !== null) {
      handleScan();
    }
  }, [data, userData]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Scan Items</Text>
          <Text style={styles.subtitle}>Scan waybill or order number</Text>
        </View>
      </View>

      <View style={styles.scannerContainer}>
        <BarcodeScanner onScan={onScan} scanned={scanned} />
      </View>
      
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
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color="#e74c3c" />
          <Text style={styles.errorText}>{scanResultMessage}</Text>
        </View>
      )}

      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={560}
        enableSnapping={false}
      >
        <View style={styles.drawerHandle} />
        <ScrollView contentContainerStyle={styles.drawerContent}>
          <SectionHeader icon="cube" title="Item Details" />

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

          <SectionHeader icon="document-text" title="Waybill Details" />

          <InfoRow
            label="Waybill Number"
            value={waybillDetails.waybillNumber}
          />
          <InfoRow label="Order Number" value={waybillDetails.orderNumber} />
          <InfoRow label="Status" value={waybillDetails.orderStatus} />

          <SectionHeader icon="person" title="Sender" />

          <InfoRow label="Name" value={waybillDetails.senderName} />
          <InfoRow label="Phone" value={waybillDetails.senderPhone} />
          <InfoRow
            label="Province / City / Brgy"
            value={`${waybillDetails.senderProvince} / ${waybillDetails.senderCity} / ${waybillDetails.senderBarangay}`}
          />
          <InfoRow label="Address" value={waybillDetails.senderAddress} />

          <SectionHeader icon="location" title="Recipient" />

          <InfoRow label="Name" value={waybillDetails.receiverName} />
          <InfoRow label="Phone" value={waybillDetails.receiverPhone} />
          <InfoRow
            label="Province / City / Brgy"
            value={`${waybillDetails.receiverProvince} / ${waybillDetails.receiverCity} / ${waybillDetails.receiverBarangay}`}
          />
          <InfoRow label="Address" value={waybillDetails.receiverAddress} />
        </ScrollView>
      </BottomDrawer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: 13,
    color: "#7f8c8d",
    marginTop: 2,
  },
  scannerContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
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
    color: "#2c3e50",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#fee",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fcc",
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e74c3c",
    flex: 1,
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
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2c3e50",
  },
  row: {
    borderWidth: 1,
    borderColor: "#e8ecf1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 11,
    color: "#7f8c8d",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
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

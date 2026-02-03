import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import FontAwesome from "@expo/vector-icons/FontAwesome";
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
  const [data, setData] = useState<string>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
  // const [waybillDetails, setWaybillDetails] = useState<any>([]);
  const [waybillDetails, setWaybillDetails] = useState<any>({});

  const bottomDrawerRef = useRef<{
    open: () => void;
    close: () => void;
  } | null>(null);

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

  const onScan = async (scannedCode: string) => {
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
      } finally {
        console.log("SUCCESS");
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
      <View
        style={{ flexDirection: "row", alignItems: "center", paddingTop: 25 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="chevron-left" size={24} color="#FF3B30" />
        </TouchableOpacity>

        <Text style={styles.title}>Scan Items</Text>
      </View>

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
            color: "red",
          }}
        >
          {scanResultMessage}
        </Text>
      )}

      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={560}
        enableSnapping={false}
      >
        <ScrollView contentContainerStyle={styles.drawerContent}>
          {/* SECTION: ITEM DETAILS */}
          <Text style={styles.sectionTitle}>Item Details</Text>

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

          {/* SECTION: WAYBILL DETAILS */}
          <Text style={styles.sectionTitle}>Waybill Details</Text>

          <InfoRow
            label="Waybill Number"
            value={waybillDetails.waybillNumber}
          />
          <InfoRow label="Order Number" value={waybillDetails.orderNumber} />
          <InfoRow label="Status" value={waybillDetails.orderStatus} />

          {/* SECTION: SENDER */}
          <Text style={styles.sectionTitle}>Sender</Text>

          <InfoRow label="Name" value={waybillDetails.senderName} />
          <InfoRow label="Phone" value={waybillDetails.senderPhone} />
          <InfoRow
            label="Province / City / Brgy"
            value={`${waybillDetails.senderProvince} / ${waybillDetails.senderCity} / ${waybillDetails.senderBarangay}`}
          />
          <InfoRow label="Address" value={waybillDetails.senderAddress} />

          {/* SECTION: RECIPIENT */}
          <Text style={styles.sectionTitle}>Recipient</Text>

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
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginRight: -10,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#FF3B30",
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
  drawerContent: {
    padding: 16,
    paddingBottom: 40,
    marginBottom: 65,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
});

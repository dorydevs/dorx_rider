import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function RTSReturnToClientScreen() {
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
  const [returned, setReturned] = useState(false);

  const onScan = async (scannedCode: any) => {
    if (scanned) return;
    setScanResultMessage("");
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
      if (data) {
        if (!scannedData.includes(data)) {
          setLoadingScan(true);

          // validations to consider
          // waybill status = 'for return'
          // rts status = 'Received by hub'
          // hub city must be same as the sender city

          // scan waybill
          try {
            const orderDetail = await axiosInstance(userData.token).get(
              `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data.data}&satelliteOperatorID=${true}`,
            );
            console.log("waybillStatus", orderDetail.data.waybillStatus);
            console.log("rtsStatus", orderDetail.data.rtsStatus);
            console.log("senderCity", orderDetail.data.senderCity);
            console.log(" userData.hubCity ", userData.hubCity);

            try {
              // await axiosInstance(userData.token).put(
              //   `/api/orderTransactions/updateWaybillStatus`,
              //   {
              //     orderTransactionId: orderDetail.data.orderTransactionId,
              //     waybillStatus: "For Return",

              //   },
              // );

              await axiosInstance(userData.token).post(
                `/api/orderTransactions/createReturnTransaction`,
                {
                  orderTransactionId: orderDetail.data.orderTransactionId,
                  rider_id: userData.id,
                },
              );

              setScannedData((prev) => [...prev, data]);
              setScanResultMessage("Item Successfully Scanned");
              setReturned(true);
              setAlertColor("green");
              setScanned(false);
              playSuccess();
              setLoadingScan(false);
            } catch (error) {
              setScanResultMessage("Invalid.");
              setReturned(false);
              setAlertColor("red");
              playError();
              setScanResultMessage("");
              setScanned(false);
              setLoadingScan(false);
            }

            // stop();
          } catch (error) {
            // alert(error);
            console.log("RIDER RTS RETURN SCANNING ERROR:", error);
            playError();
            setScanResultMessage("");
            setScanned(false);
            setLoadingScan(false);
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
          setScanResultMessage("");
          setScanned(false);
          setLoadingScan(false);
          setTimeout(() => {
            setScanned(false);
            setData("");
          }, 2000);
        }
      }
    }
    if (userData !== null) {
      processScan();
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

        <Text style={styles.title}>RTS/Incomming</Text>
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
            color: alertColor,
          }}
        >
          {scanResultMessage}
        </Text>
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
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 8,
    color: "tomato",
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

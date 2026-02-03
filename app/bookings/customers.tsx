import AnimatedDrawer from "@/components/AnimatedDrawer";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import BottomDrawer from "react-native-animated-bottom-drawer";
import { Button } from "react-native-paper";
export default function CustomersScreen() {
  const router = useRouter();

  const { playSuccess, playError, playWarning } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [invalid, setInvalid] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [alertColor, setAlertColor] = useState("blue");
  const [waybillDetails, setWaybillDetails] = useState<any>({});
  const [success, setSuccess] = useState(false);
  const { clientData } = useLocalSearchParams();
  const [showReturn, setShowReturn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attempts, setAttempts] = useState("");
  const [attemptsMessage, setAttemptsMessage] = useState<any>("");
  const [attemptReached, setAttemptReached] = useState<Boolean>(false);
  const [orderNumber, setOrderNumber] = useState<any>("");
  // const attemptReached = attempts === "reached" ? true : false;

  const bottomDrawerRef = useRef<{
    open: () => void;
    close: () => void;
  } | null>(null);

  console.log(">>>> ", showReturn);

  const bottomDrawerForReturnref = useRef<{
    open: () => void;
    close: () => void;
  } | null>(null);

  useEffect(() => {
    const handleAttempChecker = async () => {
      setAttemptsLoading(true);
      const { data } = await axiosInstance(userData.token).get(
        `/api/rider/delivery-attempts/${waybillDetails.orderTransactionId}`,
      );

      if (data.length === 0) {
        setAttempts("first");
      } else if (data.length === 1) {
        setAttempts("second");
      } else if (data.length === 2) {
        setAttempts("third");
      } else if (data.length === 3) {
        setAttempts("reached");
        setAttemptReached(true);
      }
      setAttemptsLoading(false);
    };
    if (waybillDetails.length !== 0) {
      handleAttempChecker();
    }
  }, [waybillDetails]);

  const onSave = async () => {
    if (reason !== "") {
      try {
        setLoading(true);
        Keyboard.dismiss();
        console.log("API CALL");
        console.log({
          attempt: attempts,
          orderTransactionId: waybillDetails.orderTransactionId,
          riderId: userData.id,
          remarks: reason,
        });
        await axiosInstance(userData.token).post(
          `/api/rider/delivery-attempts`,
          {
            // attemptDate: moment().toISOString(),
            attempt: attempts,
            orderTransactionId: waybillDetails.orderTransactionId,
            riderId: userData.id,
            remarks: reason,
          },
        );
        if (attempts === "third") {
          onUpdateWaybillStatus("For Return");
          bottomDrawerRef.current?.close();
          bottomDrawerForReturnref.current?.close();
        }
        console.log("END API CALL");
        // Toast.show({
        //   content: (
        //     <span className="text-lg">
        //       {attempts.replace(/^\w/, (c) => c.toUpperCase())} Delivery Attempt
        //       Saved
        //     </span>
        //   ),
        // });
        // bottomDrawerRef.current?.close();
        // bottomDrawerForReturnref.current?.close();
        setShowReturn(false);
        setLoading(false);
        // close();
        setReason("");
      } catch (error: any) {
        setReason("");
        setLoading(false);
        console.log("onSave ", error);
        console.log("ERROR DATA:", error.response?.data);
        setAttemptsMessage(error.response?.data);
      }
    }
  };

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
        setLoadingScan(true);
        setInvalid(false);
        setAlertColor("blue");
        try {
          const { data: waybillData } = await axiosInstance(userData.token).get(
            `/api/orderTransactions/fetchOrderTransactionByOrderNumber?orderNumber=${data?.data}`,
          );
          setOrderNumber(data?.data);
          console.log("waybillData : >>> ", waybillData);
          // validation: delivery area (barangay) should be same as the parcel destination barangay
          if (waybillData.waybillStatus === "Delivering") {
            if (userData.storeBarangay === waybillData.receiverBarangay) {
              playSuccess();
              setLoadingScan(false);
              setSuccess(false);
              setScanned(false);
              setWaybillDetails(waybillData);
              bottomDrawerRef.current?.open();
              setScanResultMessage("Successfully Scanned!");
            } else {
              setInvalid(true);
              setAlertColor("red");
              playError();
            }
          } else {
            setScanResultMessage(`This item is ${waybillData.waybillStatus}`);
            setInvalid(true);
            setAlertColor("red");
            playError();
            setLoadingScan(false);
            setSuccess(false);
            setScanned(false);
          }
          setLoadingScan(false);
          setSuccess(false);
          setScanned(false);
        } catch (error) {
          setLoadingScan(false);

          setScanResultMessage("ERROR SCAN");
          console.log("Customer Scan ERROR : >> ", error);
          setScanned(false);
          playError();
        } finally {
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

  const onUpdateWaybillStatus = async (status: any) => {
    setLoading(true);

    const { data: responseData } = await axiosInstance(userData.token).put(
      `/api/orderTransactions/updateWaybillStatus`,
      {
        orderTransactionId: waybillDetails.orderTransactionId,
        waybillStatus: status,
      },
    );

    if (responseData?.message === "Successfully Updated") {
      setSuccess(true);
      if (status === "Delivered") {
        // log scanned data for cds
        const logScanData = await axiosInstance(userData.token).post(
          `/api/log-scan`,
          {
            shippingFee: waybillDetails.receivableFreight,
            transactionType: "outbound",
            wareHouseId: userData.storeId,
            wareHouseType: "store",
            orderTransactionId: waybillDetails.orderTransactionId,
          },
        );
        bottomDrawerRef.current?.close();
        bottomDrawerForReturnref.current?.close();
        setShowReturn(false);
        console.log(">>> logScanData:", logScanData);
        setSuccessMessage("Successfully Delivered");
      } else if (status === "For Return")
        setSuccessMessage("Successfully Updated - For Return");
    }

    setLoading(false);
  };
  const onCloseBottomDrawer = () => {
    setLoadingScan(false);
    setSuccess(false);
    setScanned(false);
    setScanResultMessage("");
    bottomDrawerRef.current?.close();
    setShowReturn(false);
    Keyboard.dismiss();
    setReason("");
    setAttemptsMessage("");
  };

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

        <Text style={styles.title}>Customers</Text>
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
            color:
              scanResultMessage === "Successfully Scanned!" ? "#22c55e" : "red",
          }}
        >
          {scanResultMessage}
        </Text>
      )}

      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={570}
        enableSnapping={false}
        closeOnBackdropPress={false}
        closeOnPressBack={false}
        gestureMode="none"
      >
        <View style={{ padding: 20 }}>
          <ScrollView style={styles.containerTwo}>
            {scanResultMessage && (
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    padding: 20,
                    borderRadius: 20,
                    alignItems: "center",
                    backgroundColor: "#33ad60",
                    width: 300,
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      textAlign: "center",
                      width: "90%",
                      color: "white",
                    }}
                  >
                    {scanResultMessage}
                  </Text>
                </View>
              </View>
            )}
            {/* Order Card */}

            <View style={styles.card}>
              <View>
                <Text>
                  <Text style={{ fontWeight: "bold" }}>Delivery Attemps</Text> :{" "}
                  {attempts.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.boldText}>{waybillDetails?.itemName}</Text>
              <Text>{waybillDetails?.orderNumber}</Text>

              <View style={styles.divider} />

              <Text>
                <Text style={{ fontWeight: "bold" }}>COD Value:</Text>{" "}
                {waybillDetails?.codValue}
              </Text>

              <Text>
                <Text style={{ fontWeight: "bold" }}>Item Weight:</Text>{" "}
                {waybillDetails?.itemWeight}{" "}
              </Text>

              <Text>
                <Text style={{ fontWeight: "bold" }}> Number of Item: </Text>{" "}
                {waybillDetails?.numberOfItem}
              </Text>

              <Text>
                <Text style={{ fontWeight: "bold" }}> Recipient: </Text>

                {`${waybillDetails?.receiverFirstName} ${waybillDetails?.receiverMiddleName} ${waybillDetails?.receiverLastName}`}
              </Text>

              <Text>
                {" "}
                <Text style={{ fontWeight: "bold" }}>Phone:</Text>{" "}
                {waybillDetails?.receiverPhone}
              </Text>
            </View>

            {/* Status Area */}
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 8 }}>Updating...</Text>
              </View>
            ) : success ? (
              <View style={styles.center}>
                <Text style={styles.successText}>✅</Text>
                <Text>{successMessage}</Text>
              </View>
            ) : (
              <>
                {!attemptReached ? (
                  <>
                    <TouchableOpacity
                      style={[styles.button, styles.successButton]}
                      onPress={() => onUpdateWaybillStatus("Delivered")}
                    >
                      <Text style={styles.buttonText}>Mark As Delivered</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.warningButton]}
                      onPress={() => {
                        setShowReturn(true);
                        bottomDrawerRef.current?.close();
                      }}
                    >
                      <Text style={styles.buttonText}>Mark As For Return</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text
                      style={{
                        textAlign: "center",
                        fontSize: 15,
                        color: "tomato",
                        padding: 10,
                      }}
                    >
                      This item is for return to seller {`(RTS)`}
                    </Text>
                    {/* OPTIONAL FEATURE  */}
                    {/*This is created due to process or logic ing rts-return */}
                    {/* <TouchableOpacity
                      style={[styles.button, styles.successButton]}
                      onPress={() => onUpdateWaybillStatus("For Return")}
                    >
                      <Text style={styles.buttonText}>Return Item</Text>
                    </TouchableOpacity> */}
                  </>
                )}
              </>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={() => onCloseBottomDrawer()}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BottomDrawer>

      <AnimatedDrawer visible={showReturn}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Text style={styles.label}>Reason for Return</Text>

          <TextInput
            style={styles.textArea}
            placeholder="Enter your reason here..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={reason}
            onChangeText={setReason}
          />
          {attemptsMessage !== "" && (
            <View style={{ padding: 10, marginTop: -10 }}>
              <Text style={{ color: "tomato" }}>{attemptsMessage.message}</Text>
            </View>
          )}
          <View style={{ gap: 10 }}>
            <Button
              buttonColor="green"
              textColor="white"
              onPress={onSave}
              mode="contained"
              loading={loading}
              disabled={loading}
            >
              Submit
            </Button>
            <Button
              disabled={loading}
              textColor="black"
              onPress={() => onCloseBottomDrawer()}
              mode="outlined"
            >
              Close
            </Button>
          </View>
        </ScrollView>
      </AnimatedDrawer>
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
    color: "#34C759",
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
  containerTwo: {
    backgroundColor: "#fff",
    height: 500,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
    flexDirection: "column",
    gap: 10,
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 10,
  },
  verticalDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  center: {
    alignItems: "center",
    marginVertical: 20,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 6,
  },
  successButton: {
    backgroundColor: "#22c55e",
  },
  warningButton: {
    backgroundColor: "#f59e0b",
  },
  closeButton: {
    backgroundColor: "#6b7280",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  successText: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
});

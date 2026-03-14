import AnimatedDrawer from "@/components/AnimatedDrawer";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomDrawer from "react-native-animated-bottom-drawer";
import MapView, { Marker } from "react-native-maps";
import { Button } from "react-native-paper";
import ViewShot, { captureRef } from "react-native-view-shot";
const { width } = Dimensions.get("window");
export default function CustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const { playSuccess, playError } = useScannerSounds();
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
  const [isPODActive, setIsPODActive] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [attempts, setAttempts] = useState<any>("");
  const [attemptsMessage, setAttemptsMessage] = useState<any>("");
  const [attemptReached, setAttemptReached] = useState<boolean>(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [orderNumber, setOrderNumber] = useState<any>("");
  const [permission, requestPermission] = useCameraPermissions();
  // const attemptReached = attempts === "reached" ? true : false;
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoToUpload, setPhotoToUpload] = useState<string | null>(null);
  const [imageCapturingloading, setImageCapturingloading] =
    useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [showScanner, setShowScanner] = useState(true);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const bottomDrawerRef = useRef<any>(null);
  const cameraButtomDrawer = useRef<any>(null);

  console.log(">>>> ", showReturn);

  const bottomDrawerForReturnref = useRef<any>(null);

  const openCameraDrawer = () => {
    setShowScanner(false); // Unmount scanner first
    setTimeout(() => {
      setIsPODActive(true);
      cameraButtomDrawer.current?.open();
    }, 300); // 300ms delay is usually enough for the OS to release hardware
  };

  const closeCameraDrawer = () => {
    setIsPODActive(false);
    cameraButtomDrawer.current?.close();
    setTimeout(() => {
      setShowScanner(true); // Re-mount scanner after drawer closes
    }, 300);
  };

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
        console.log(attempts === "third");

        if (attempts === "third") {
          console.log("NATAWAG BA TONG FOR RETURN");
          onUpdateWaybillStatus("For Return");
          await axiosInstance(userData.token).put(
            `/api/orderTransactions/updateWaybillStatus`,
            {
              orderTransactionId: waybillDetails.orderTransactionId,
              waybillStatus: "For Return",
            },
          );

          bottomDrawerRef.current?.close();
          bottomDrawerForReturnref.current?.close();
          cameraButtomDrawer.current?.close();
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
            if (
              userData.assignedBarangays.includes(waybillData.receiverBarangay)
            ) {
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
            const status =
              waybillData?.waybillStatus ?? "has no Waybill status yet";

            setScanResultMessage(`This item is ${status}`);
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
    try {
      if (!viewShotRef.current) return;
      if (!previewReady) {
        console.log("Preview not ready yet...");
        return;
      }

      // allow overlay render
      await new Promise((resolve) => setTimeout(resolve, 300));

      const tmpUri = await captureRef(viewShotRef.current, {
        format: "jpg",
        quality: 0.8,
        result: "tmpfile",
      });

      const uniqueUri = FileSystem?.cacheDirectory + `pod-${Date.now()}.jpg`;

      // Copy snapshot into new unique file
      await FileSystem.copyAsync({
        from: tmpUri,
        to: uniqueUri,
      });

      const finalImageUri = uniqueUri;

      const formData = new FormData();

      // Construct the file object correctly for React Native
      const filename = finalImageUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image`;

      formData.append("orderTransactionId", waybillDetails.orderTransactionId);
      formData.append("waybillStatus", status);
      console.log("finalImageUri : >>> ", finalImageUri);
      // DO NOT use a Blob; use this object format:
      formData.append("image", {
        uri: finalImageUri,
        name: filename,
        type: type,
      } as any);

      const { data: responseData } = await axiosInstance(userData.token).put(
        `/api/orderTransactions/updateWaybillStatus`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      if (responseData?.message === "Successfully Updated") {
        setSuccess(true);
        if (status === "Delivered") {
          // log scanned data for cds
          const logScanData = await axiosInstance(userData.token).post(
            `/api/log-scan`,
            {
              shippingFee: responseData.receivableFreight,
              transactionType: "outbound",
              wareHouseId: userData.storeId,
              wareHouseType: "store",
              orderTransactionId: waybillDetails.orderTransactionId,
            },
          );
          bottomDrawerRef.current?.close();
          bottomDrawerForReturnref.current?.close();
          cameraButtomDrawer.current?.close();
          setShowReturn(false);
          console.log(">>> logScanData:", logScanData);
          setSuccessMessage("Successfully Delivered");
        } else if (status === "For Return")
          setSuccessMessage("Successfully Updated - For Return");
      }
      setPreviewReady(false);
      setPreviewKey((prev) => prev + 1);
      setPhotoUri(null);
      setTimeout(() => {
        setShowScanner(true); // Re-mount scanner after drawer closes
      }, 300);
    } catch (error) {
      setPhotoUri(null);
      console.log("onUpdateWaybillStatus ERROR : >>> ", error);
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

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    setImageCapturingloading(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      setPreviewReady(false);
      // const locationPermission =
      //   await Location.requestForegroundPermissionsAsync();
      // if (locationPermission.status === "granted") {
      //   const location = await Location.getCurrentPositionAsync({});
      //   setCoords({
      //     latitude: location.coords.latitude,
      //     longitude: location.coords.longitude,
      //   });
      // }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setVisible(true);
        setLocationDenied(true);
        throw new Error("Permission denied");
      }

      // Try last known position first
      let loc: any = await Location.getLastKnownPositionAsync();
      if (!loc) {
        // race between getCurrentPositionAsync and timeout
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timed out")), 15000),
        );
        const posPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        loc = await Promise.race([posPromise, timeout]);
      }
      if (!loc?.coords) throw new Error("Failed to get coords");
      const { latitude, longitude } = loc.coords;
      setCoords({
        latitude: latitude,
        longitude: longitude,
      });

      setPhotoUri(photo.uri);

      setImageCapturingloading(false);
    } catch (err) {
      setImageCapturingloading(false);
      console.log("Error capturing photo:", err);
    } finally {
      setImageCapturingloading(false);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission}>grant permission</Button>
      </View>
    );
  }

  // ✅ Cancel the last captured photo
  const cancelPhoto = () => {
    setPhotoUri(null);
    setCoords(null);
  };

  // ✅ Submit handler
  const submitPhoto = () => {
    if (!photoUri) return;
    onUpdateWaybillStatus("Delivered");

    // Add your API or dispatch logic here
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#3498db" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Customer Delivery</Text>
          <Text style={styles.subtitle}>Scan orders for delivery</Text>
        </View>
      </View>

      <View style={styles.scannerContainer}>
        {showScanner && (
          <BarcodeScanner
            key="background-scanner"
            onScan={onScan}
            scanned={scanned}
          />
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
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
          <View
            style={[
              styles.resultContainer,
              invalid ? styles.errorBg : styles.successBg,
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                invalid ? styles.errorCircle : styles.successCircle,
              ]}
            >
              <Ionicons
                name={invalid ? "close" : "checkmark"}
                size={16}
                color={invalid ? "#A32D2D" : "#3B6D11"}
              />
            </View>
            <View style={styles.resultTextWrapper}>
              <Text
                style={[
                  styles.resultLabel,
                  invalid ? styles.errorColor : styles.successColor,
                ]}
              >
                {invalid ? "Scan Failed" : "Scan Successful"}
              </Text>
              <Text style={styles.resultSubText}>{scanResultMessage}</Text>
            </View>
          </View>
        )}
      </View>

      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={570}
        enableSnapping={false}
        closeOnBackdropPress={false}
        closeOnPressBack={false}
        gestureMode="none"
      >
        <View style={{ padding: 20, paddingBottom: insets.bottom + 20 }}>
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
              <View style={styles.cardAttemptRow}>
                <View style={styles.attemptBadge}>
                  <Text style={styles.attemptBadgeText}>
                    {attempts.toUpperCase()} ATTEMPT
                  </Text>
                </View>
              </View>

              <Text style={styles.boldText}>{waybillDetails?.itemName}</Text>
              <Text style={styles.orderNumberText}>
                {waybillDetails?.orderNumber}
              </Text>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>COD Value</Text>
                <Text style={styles.infoValue}>{waybillDetails?.codValue}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Item Weight</Text>
                <Text style={styles.infoValue}>
                  {waybillDetails?.itemWeight}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>No. of Items</Text>
                <Text style={styles.infoValue}>
                  {waybillDetails?.numberOfItem}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Recipient</Text>
                <Text
                  style={[styles.infoValue, { flex: 1, textAlign: "right" }]}
                >
                  {`${waybillDetails?.receiverFirstName} ${waybillDetails?.receiverMiddleName} ${waybillDetails?.receiverLastName}`}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>
                  {waybillDetails?.receiverPhone}
                </Text>
              </View>
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
                      // onPress={() => onUpdateWaybillStatus("Delivered")}
                      onPress={() => openCameraDrawer()}
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

      <BottomDrawer
        ref={cameraButtomDrawer}
        initialHeight={650}
        enableSnapping={false}
        closeOnBackdropPress={false}
        closeOnPressBack={false}
        gestureMode="none"
      >
        <View style={{ padding: 20, paddingBottom: insets.bottom + 20 }}>
          {isPODActive && !photoUri ? (
            <CameraView
              key="drawer-camera"
              ref={cameraRef}
              style={styles.camera}
              facing="back"
            />
          ) : (
            <ViewShot
              key={previewKey}
              ref={viewShotRef}
              options={{ format: "jpg", quality: 0.8 }}
            >
              <View collapsable={false}>
                <Image
                  onLoadEnd={() => setPreviewReady(true)}
                  source={{ uri: photoUri || "" }}
                  style={styles.camera}
                />

                {imageCapturingloading ? (
                  <View style={styles.coordContainer}>
                    <Text style={styles.coordText}>
                      Coordinates still processing...
                    </Text>
                  </View>
                ) : (
                  coords && (
                    <View style={styles.coordContainer}>
                      <View
                        style={{
                          height: 70,
                          width: "30%",
                          borderRadius: 20,
                          overflow: "hidden",
                        }}
                      >
                        <MapView
                          style={{ flex: 1 }}
                          collapsable={false}
                          initialRegion={{
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            latitudeDelta: 0.002,
                            longitudeDelta: 0.002,
                          }}
                          scrollEnabled={false}
                          zoomEnabled={false}
                        >
                          <Marker coordinate={coords} />
                        </MapView>
                      </View>

                      <View>
                        <Text style={{ fontSize: 11, color: "white" }}>
                          {moment().format("DD-MM-YYYY-hh:mm:ss-A")}
                        </Text>
                        <Text style={styles.coordText}>
                          Lat: {coords.latitude.toFixed(6)}
                        </Text>
                        <Text style={styles.coordText}>
                          Lng: {coords.longitude.toFixed(6)}
                        </Text>
                        <Text style={{ fontSize: 12, color: "white" }}>
                          WBN : {waybillDetails.waybillNumber}
                        </Text>
                      </View>
                    </View>
                  )
                )}
              </View>
            </ViewShot>
          )}

          {/* Action buttons */}
          <View style={{ flexDirection: "column", gap: 10, marginTop: 10 }}>
            {!photoUri ? (
              <TouchableOpacity
                style={[styles.button, styles.successButton]}
                onPress={takePhoto}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  // style={[styles.button, styles.successButton]}
                  onPress={submitPhoto}
                  disabled={loading}
                >
                  <Button
                    buttonColor="#4CAF50"
                    textColor="white"
                    onPress={submitPhoto}
                    mode="contained"
                    loading={loading}
                    disabled={loading}
                  >
                    Submit
                  </Button>
                  {/* <Text style={styles.buttonText}>Submit</Text> */}
                </TouchableOpacity>
                <TouchableOpacity
                  // style={[styles.button, styles.cancelButton]}
                  // onPress={cancelPhoto}
                  disabled={loading}
                >
                  <Button
                    buttonColor="#f44336"
                    textColor="white"
                    onPress={cancelPhoto}
                    mode="contained"
                    // loading={loading}
                    // disabled={loading}
                  >
                    Cancel
                  </Button>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              // style={[styles.button, styles.closeButton]}

              disabled={loading}
            >
              <Button
                buttonColor="#9E9E9E"
                textColor="white"
                onPress={() => closeCameraDrawer()}
                mode="contained"
                // loading={loading}
                // disabled={loading}
              >
                Close
              </Button>
            </TouchableOpacity>
          </View>
        </View>
      </BottomDrawer>

      <AnimatedDrawer visible={showReturn}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
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
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  headerTextContainer: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#2c3e50" },
  subtitle: { fontSize: 13, color: "#7f8c8d", marginTop: 2 },
  scannerContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  statusIndicator: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusText: { fontSize: 14, fontWeight: "600", color: "#2c3e50" },

  // — Result message banner —
  resultContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    backgroundColor: "#fff",
  },
  errorBg: {
    borderLeftColor: "#E24B4A",
    borderTopColor: "#f5a5a5",
    borderRightColor: "#f5a5a5",
    borderBottomColor: "#f5a5a5",
  },
  successBg: {
    borderLeftColor: "#639922",
    borderTopColor: "#b6d97c",
    borderRightColor: "#b6d97c",
    borderBottomColor: "#b6d97c",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  errorCircle: { backgroundColor: "#FCEBEB" },
  successCircle: { backgroundColor: "#EAF3DE" },
  resultTextWrapper: { flex: 1, gap: 3 },
  resultLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.1 },
  resultSubText: { fontSize: 14, color: "#6b7280" },
  errorColor: { color: "#A32D2D" },
  successColor: { color: "#3B6D11" },

  buttonText: { color: "#fff", fontWeight: "bold" },
  successButton: { backgroundColor: "#4CAF50" },
  cancelButton: { backgroundColor: "#f44336" },
  submitButton: { backgroundColor: "#2196F3" },
  closeButton: { backgroundColor: "#9E9E9E" },
  camera: {
    width: "100%",
    height: 400,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  coordContainer: {
    position: "absolute",
    top: 300,
    left: 20,
    backgroundColor: "rgba(0, 0, 0, 0.34)",
    padding: 5,
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  coordText: {
    color: "#fff",
    fontWeight: "bold",
  },
  bottom: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },

  message: { textAlign: "center", paddingBottom: 10 },
  buttonContainer: {
    position: "absolute",
    bottom: 64,
    flexDirection: "row",
    backgroundColor: "transparent",
    width: "100%",
    paddingHorizontal: 64,
  },
  text: { fontSize: 24, fontWeight: "bold", color: "white" },
  content: { marginTop: 40, justifyContent: "center", alignItems: "center" },
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
  containerTwo: {
    backgroundColor: "#fff",
    height: 500,
  },

  // — Order card —
  card: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
    backgroundColor: "#fff",
    gap: 8,
  },
  cardAttemptRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  attemptBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  attemptBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4338ca",
    letterSpacing: 0.5,
  },
  boldText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1a1a2e",
  },
  orderNumberText: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: -4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: "#1a1a2e",
    fontWeight: "600",
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
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
  },
  warningButton: {
    backgroundColor: "#f59e0b",
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

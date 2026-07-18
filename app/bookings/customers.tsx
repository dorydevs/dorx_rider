import AnimatedDrawer from "@/components/AnimatedDrawer";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { DrawerHeader } from "@/components/DrawerHeader";
import { ScanDetailCard, ScanDetailCardProps } from "@/components/ScanDetailCard";
import { ScanResultAlert } from "@/components/ScanResultAlert";
import { useScannerSounds } from "@/components/ScannerSounds";
import { ScanStatsCard } from "@/components/ScanStatsCard";
import { ScanStatusBar } from "@/components/ScanStatusBar";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { formatDestination, formatScanTime } from "@/utils/scanFormatting";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";

import deliveredSocket from "../../helpers/socketConnection";

import {
  ActivityIndicator,
  BackHandler,
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
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot, { captureRef } from "react-native-view-shot";

const { width: any } = Dimensions.get("window");

export default function CustomersScreen() {
  const router = useRouter();
  const viewShotRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const { playSuccess, playError, playWarning } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [invalid, setInvalid] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [alertColor, setAlertColor] = useState<
    "green" | "blue" | "red" | "yellow" | "orange"
  >("blue");
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
  const [facing, setFacing] = useState<CameraType>("back");
  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoToUpload, setPhotoToUpload] = useState<string | null>(null);
  const [imageCapturingloading, setImageCapturingloading] =
    useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [scannedOrderDetails, setScannedOrderDetails] = useState<Omit<
    ScanDetailCardProps,
    "visible"
  > | null>(null);

  const bottomDrawerRef = useRef<any>(null);
  const cameraButtomDrawer = useRef<any>(null);

  console.log(">>>> ", showReturn);

  const bottomDrawerForReturnref = useRef<any>(null);

  // Auto-connect deliveredSocket when screen is mounted or revisited
  useEffect(() => {
    if (!deliveredSocket.connected) {
      deliveredSocket.connect();
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => subscription.remove();
    }, [router]),
  );

  // Leave socket room when leaving screen
  useEffect(() => {
    return () => {
      // Replace 'dorx123' with your dynamic room if needed
      deliveredSocket.emit("app_leave_room", "dorx123");
    };
  }, []);

  const sendUpdatedDeliveredData = () => {
    console.log("Testing Socket Connection...");
    if (!deliveredSocket.connected) {
      deliveredSocket.connect();
    }
    deliveredSocket.emit("join_room", "dorx123");
    deliveredSocket.emit("send_updated_data", {
      roomId: "dorx123",
      transactionType: "Delivered",
    });
  };

  const openCameraDrawer = () => {
    setShowScanner(false);
    setTimeout(() => {
      setIsPODActive(true);
      cameraButtomDrawer.current?.open();
    }, 300);
  };

  const closeCameraDrawer = () => {
    setIsPODActive(false);
    cameraButtomDrawer.current?.close();
    setTimeout(() => {
      setShowScanner(true);
    }, 300);
  };

  useEffect(() => {
    const handleAttempChecker = async () => {
      if (!userData) return;
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
    if (waybillDetails.orderTransactionId && userData) {
      handleAttempChecker();
    }
  }, [waybillDetails, userData]);

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
              setAlertColor("green");
              setScanCount((prev) => prev + 1);
              setScannedOrderDetails({
                waybillNumber: data?.data,
                parcelStatus: waybillData.waybillStatus,
                senderName: waybillData.senderName,
                receiverName: waybillData.receiverName,
                destination: formatDestination(
                  waybillData.receiverBarangay,
                  waybillData.receiverCity,
                  waybillData.receiverProvince,
                ),
                scanTime: formatScanTime(moment()),
              });
            } else {
              setInvalid(true);
              setAlertColor("red");
              setScanResultMessage(
                `Cannot scan: Receiver barangay "${waybillData.receiverBarangay}" is not in your assigned areas.`,
              );
              setScannedOrderDetails(null);
              playError();
            }
          } else {
            setScanResultMessage(
              waybillData.waybillStatus
                ? `This item is ${waybillData.waybillStatus}`
                : "This Item Has no Waybill Status yet",
            );
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
            setInvalid(false);
            setScanResultMessage("");
            setScannedOrderDetails(null);
          }, 5000);
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

      await new Promise((resolve) => setTimeout(resolve, 300));

      const tmpUri = await captureRef(viewShotRef.current, {
        format: "jpg",
        quality: 0.8,
        result: "tmpfile",
      });

      const uniqueUri = FileSystem?.cacheDirectory + `pod-${Date.now()}.jpg`;

      await FileSystem.copyAsync({ from: tmpUri, to: uniqueUri });

      const finalImageUri = uniqueUri;
      const formData = new FormData();
      const filename = finalImageUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image`;

      formData.append("orderTransactionId", waybillDetails.orderTransactionId);
      formData.append("waybillStatus", status);
      console.log("finalImageUri : >>> ", finalImageUri);
      formData.append("image", {
        uri: finalImageUri,
        name: filename,
        type: type,
      } as any);

      const { data: responseData } = await axiosInstance(userData.token).put(
        `/api/orderTransactions/updateWaybillStatus`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (responseData?.message === "Successfully Updated") {
        setSuccess(true);
        if (status === "Delivered") {
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
        } else if (status === "For Return") {
          setSuccessMessage("Successfully Updated - For Return");
        }
      }
      setPreviewReady(false);
      setPreviewKey((prev) => prev + 1);
      setPhotoUri(null);
      setImageLoading(false);
      sendUpdatedDeliveredData();
      setTimeout(() => {
        setShowScanner(true);
      }, 300);
    } catch (error) {
      setPhotoUri(null);
      setImageLoading(false);
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
    setImageLoading(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      setPreviewReady(false);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setVisible(true);
        setLocationDenied(true);
        throw new Error("Permission denied");
      }

      let loc: any = await Location.getLastKnownPositionAsync();
      if (!loc) {
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
      setCoords({ latitude, longitude });
      setPhotoUri(photo.uri);
    } catch (err) {
      setImageLoading(false);
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
        <Button
          onPress={requestPermission}
          mode="contained"
          buttonColor="#00BF63"
          textColor="#fff"
        >
          Grant Permission
        </Button>
      </View>
    );
  }

  const cancelPhoto = () => {
    setPhotoUri(null);
    setCoords(null);
    setImageLoading(false);
  };

  const submitPhoto = () => {
    if (!photoUri) return;
    onUpdateWaybillStatus("Delivered");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <ScreenHeader
        title="Customer Delivery"
        subtitle="Scan orders for delivery"
        icon={<Ionicons name="scan-outline" size={20} color="#00BF63" />}
        onBack={() => router.back()}
      />

      {/* SCANNER */}
      {showScanner && (
        <BarcodeScanner
          key="background-scanner"
          onScan={onScan}
          scanned={scanned}
        />
      )}

      <ScanStatusBar
        loading={loadingScan}
        readyText={scanned ? "Camera Locked" : "Ready to Scan"}
        processingText="Processing…"
      />

      {/* SCAN RESULT ALERT */}
      <ScanResultAlert
        visible={loadingScan || invalid || !!scanResultMessage}
        loading={loadingScan}
        color={alertColor}
        message={scanResultMessage}
        code={data?.data}
        onRetry={
          alertColor === "red"
            ? () => {
                setData("");
                setScanResultMessage("");
                setInvalid(false);
                setScanned(false);
                setScannedOrderDetails(null);
              }
            : undefined
        }
      />

      {scannedOrderDetails ? (
        <ScanDetailCard visible {...scannedOrderDetails} />
      ) : null}

      <ScanStatsCard
        icon={<Ionicons name="checkmark-done-circle" size={22} color="#00BF63" />}
        label={scanCount === 1 ? "Item Scanned" : "Items Scanned"}
        value={scanCount}
      />

      {/* SOCKET TEST BUTTON */}
      <View style={{ alignItems: "center", marginVertical: 8 }}>
        <TouchableOpacity onPress={() => sendUpdatedDeliveredData()}>
          <Text style={{ textAlign: "center", color: "#64748B" }}>
            Socket Test
          </Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM DRAWER - Order Details */}
      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={570}
        enableSnapping={false}
        closeOnBackdropPress={false}
        closeOnPressBack={false}
        gestureMode="none"
      >
        <DrawerHeader
          title={waybillDetails?.itemName || "Order Details"}
          subtitle={waybillDetails?.orderNumber}
          icon={<Ionicons name="cube" size={22} color="#00BF63" />}
          onClose={() => onCloseBottomDrawer()}
          showHandle={false}
        />
        <View style={{ paddingHorizontal: 20 }}>
          <ScrollView style={styles.containerTwo}>
            {/* Order Card */}
            <View style={styles.card}>
              <View style={styles.attemptsBadge}>
                <Ionicons name="repeat" size={13} color="#F59E0B" />
                <Text style={styles.attemptsBadgeText}>
                  Delivery Attempts: {attempts.toUpperCase()}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={16} color="#94A3B8" />
                <Text style={styles.infoLabel}>COD Value</Text>
                <Text style={styles.infoValue}>{waybillDetails?.codValue}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="scale-outline" size={16} color="#94A3B8" />
                <Text style={styles.infoLabel}>Item Weight</Text>
                <Text style={styles.infoValue}>{waybillDetails?.itemWeight}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="layers-outline" size={16} color="#94A3B8" />
                <Text style={styles.infoLabel}>Number of Items</Text>
                <Text style={styles.infoValue}>{waybillDetails?.numberOfItem}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#94A3B8" />
                <Text style={styles.infoLabel}>Recipient</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {`${waybillDetails?.receiverFirstName ?? ""} ${waybillDetails?.receiverMiddleName ?? ""} ${waybillDetails?.receiverLastName ?? ""}`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={16} color="#94A3B8" />
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
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 15,
                      color: "#EF4444",
                      padding: 10,
                    }}
                  >
                    This item is for return to seller {`(RTS)`}
                  </Text>
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

      {/* BOTTOM DRAWER - Camera/POD */}
      <BottomDrawer
        ref={cameraButtomDrawer}
        initialHeight={650}
        enableSnapping={false}
        closeOnBackdropPress={false}
        closeOnPressBack={false}
        gestureMode="none"
      >
        <DrawerHeader
          title="Proof of Delivery"
          subtitle={waybillDetails?.waybillNumber}
          icon={<Ionicons name="camera" size={22} color="#00BF63" />}
          onClose={() => closeCameraDrawer()}
          showHandle={false}
        />
        <View style={{ padding: 20 }}>
          {isPODActive && !photoUri ? (
            <CameraView
              key="drawer-camera"
              ref={cameraRef}
              style={styles.camera}
              facing="back"
            />
          ) : photoUri ? (
            <ViewShot
              key={previewKey}
              ref={viewShotRef}
              options={{ format: "jpg", quality: 0.8 }}
            >
              <View collapsable={false}>
                <Image
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => {
                    setImageLoading(false);
                    setPreviewReady(true);
                  }}
                  source={{ uri: photoUri || "" }}
                  style={styles.camera}
                />

                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.imageLoadingText}>
                      Image Capturing...
                    </Text>
                  </View>
                )}

                {/* Coords only shown after image is fully loaded */}
                {!imageLoading && imageCapturingloading && (
                  <View style={styles.coordContainer}>
                    <Text style={styles.coordText}>
                      Coordinates still processing...
                    </Text>
                  </View>
                )}

                {!imageLoading && !imageCapturingloading && coords && (
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
                )}
              </View>
            </ViewShot>
          ) : null}

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
                <Button
                  buttonColor="#00BF63"
                  textColor="white"
                  onPress={submitPhoto}
                  mode="contained"
                  loading={loading}
                  disabled={loading || imageLoading}
                >
                  Submit
                </Button>
                <Button
                  buttonColor="#DC2626"
                  textColor="white"
                  onPress={cancelPhoto}
                  mode="contained"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            )}
            <Button
              buttonColor="#64748B"
              textColor="white"
              onPress={() => closeCameraDrawer()}
              mode="contained"
              disabled={loading}
            >
              Close
            </Button>
          </View>
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
              <Text style={{ color: "#EF4444" }}>{attemptsMessage.message}</Text>
            </View>
          )}
          <View style={{ gap: 10 }}>
            <Button
              buttonColor="#00BF63"
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
              textColor="#64748B"
              onPress={() => onCloseBottomDrawer()}
              mode="outlined"
            >
              Close
            </Button>
          </View>
        </ScrollView>
      </AnimatedDrawer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  successButton: { backgroundColor: "#00BF63" },
  cancelButton: { backgroundColor: "#DC2626" },
  submitButton: { backgroundColor: "#00BF63" },
  closeButton: { backgroundColor: "#64748B" },
  camera: {
    width: "100%",
    height: 400,
    borderRadius: 10,
    backgroundColor: "#000",
  },
  // ✅ new overlay style
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    gap: 12,
  },
  imageLoadingText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
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
  coordText: { color: "#fff", fontWeight: "bold" },
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
  containerTwo: {
    backgroundColor: "#fff",
    height: 500,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 16,
    flexDirection: "column",
    gap: 10,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  attemptsBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#F59E0B15",
  },
  attemptsBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B45309",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748B",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flexShrink: 1,
    textAlign: "right",
  },
  verticalDivider: {
    width: 1,
    height: 14,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 8,
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  center: { alignItems: "center", marginVertical: 20 },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 6,
  },
  warningButton: { backgroundColor: "#F59E0B" },
  successText: { fontSize: 32, marginBottom: 8 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
});

import AnimatedDrawer from "@/components/AnimatedDrawer";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useScannerSounds } from "@/components/ScannerSounds";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Package,
  RotateCcw,
  ScanLine,
  User,
  X,
} from "lucide-react-native";
import moment from "moment";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
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

const ATTEMPT_COLORS: Record<string, { bg: string; text: string }> = {
  first: { bg: "#f0fdf4", text: "#16a34a" },
  second: { bg: "#fefce8", text: "#a16207" },
  third: { bg: "#fff7ed", text: "#c2410c" },
  reached: { bg: "#fef2f2", text: "#dc2626" },
};

export default function CustomersScreen() {
  const router = useRouter();
  const viewShotRef = useRef(null);
  const [, setVisible] = useState(false);
  const [, setLocationDenied] = useState(false);
  const { playSuccess, playError } = useScannerSounds();
  const [data, setData] = useState<any>("");
  const [scanned, setScanned] = useState(false);
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [, setInvalid] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [scanResultMessage, setScanResultMessage] = useState("");
  const [alertColor, setAlertColor] = useState<
    "green" | "blue" | "red" | "yellow" | "orange"
  >("blue");
  const [waybillDetails, setWaybillDetails] = useState<any>({});
  const [success, setSuccess] = useState(false);
  useLocalSearchParams();
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
  const [, setOrderNumber] = useState<any>("");
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [imageCapturingloading, setImageCapturingloading] =
    useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(true);
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [, setScanCount] = useState(0);

  const bottomDrawerRef = useRef<any>(null);
  const cameraButtomDrawer = useRef<any>(null);
  const bottomDrawerForReturnref = useRef<any>(null);

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
    setTimeout(() => setShowScanner(true), 300);
  };

  useEffect(() => {
    const handleAttempChecker = async () => {
      if (!userData) return;
      setAttemptsLoading(true);
      const { data } = await axiosInstance(userData.token).get(
        `/api/rider/delivery-attempts/${waybillDetails.orderTransactionId}`,
      );
      if (data.length === 0) setAttempts("first");
      else if (data.length === 1) setAttempts("second");
      else if (data.length === 2) setAttempts("third");
      else if (data.length === 3) {
        setAttempts("reached");
        setAttemptReached(true);
      }
      setAttemptsLoading(false);
    };
    if (waybillDetails.orderTransactionId && userData) handleAttempChecker();
  }, [waybillDetails, userData]);

  const onSave = async () => {
    if (reason !== "") {
      try {
        setLoading(true);
        Keyboard.dismiss();
        await axiosInstance(userData.token).post(
          `/api/rider/delivery-attempts`,
          {
            attempt: attempts,
            orderTransactionId: waybillDetails.orderTransactionId,
            riderId: userData.id,
            remarks: reason,
          },
        );
        if (attempts === "third") {
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
        setShowReturn(false);
        setLoading(false);
        setReason("");
      } catch (error: any) {
        setReason("");
        setLoading(false);
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
        if (storedUser) setUserData(JSON.parse(storedUser));
        else if (user) setUserData(user);
      } catch (error) {
        console.error("Error loading user data:", error);
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
            } else {
              setInvalid(true);
              setAlertColor("red");
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
        } catch {
          setLoadingScan(false);
          setScanResultMessage("ERROR SCAN");
          setScanned(false);
          playError();
        } finally {
          setLoadingScan(false);
          setTimeout(() => {
            setScanned(false);
            setData("");
          }, 5000);
        }
      }
    }
    if (userData !== null) processScan();
  }, [data, userData, playError, playSuccess]);

  const onUpdateWaybillStatus = async (status: any) => {
    setLoading(true);
    try {
      if (!viewShotRef.current || !previewReady) return;
      await new Promise((resolve) => setTimeout(resolve, 300));
      const tmpUri = await captureRef(viewShotRef.current, {
        format: "jpg",
        quality: 0.8,
        result: "tmpfile",
      });
      const uniqueUri = FileSystem?.cacheDirectory + `pod-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: tmpUri, to: uniqueUri });
      const formData = new FormData();
      const filename = uniqueUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image`;
      formData.append("orderTransactionId", waybillDetails.orderTransactionId);
      formData.append("waybillStatus", status);
      formData.append("image", { uri: uniqueUri, name: filename, type } as any);
      const { data: responseData } = await axiosInstance(userData.token).put(
        `/api/orderTransactions/updateWaybillStatus`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (responseData?.message === "Successfully Updated") {
        setSuccess(true);
        if (status === "Delivered") {
          await axiosInstance(userData.token).post(`/api/log-scan`, {
            shippingFee: responseData.receivableFreight,
            transactionType: "outbound",
            wareHouseId: userData.storeId,
            wareHouseType: "store",
            orderTransactionId: waybillDetails.orderTransactionId,
          });
          bottomDrawerRef.current?.close();
          bottomDrawerForReturnref.current?.close();
          cameraButtomDrawer.current?.close();
          setShowReturn(false);
          setSuccessMessage("Successfully Delivered");
        } else if (status === "For Return") {
          setSuccessMessage("Successfully Updated - For Return");
        }
      }
      setPreviewReady(false);
      setPreviewKey((prev) => prev + 1);
      setPhotoUri(null);
      setImageLoading(false);
      setTimeout(() => setShowScanner(true), 300);
    } catch {
      setPhotoUri(null);
      setImageLoading(false);
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
        loc = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          timeout,
        ]);
      }
      if (!loc?.coords) throw new Error("Failed to get coords");
      setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setPhotoUri(photo.uri);
    } catch {
      setImageLoading(false);
    } finally {
      setImageCapturingloading(false);
    }
  };

  if (!permission) return <View />;
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

  const cancelPhoto = () => {
    setPhotoUri(null);
    setCoords(null);
    setImageLoading(false);
  };
  const submitPhoto = () => {
    if (!photoUri) return;
    onUpdateWaybillStatus("Delivered");
  };

  const w = waybillDetails;
  const recipientName = [
    w.receiverFirstName,
    w.receiverMiddleName,
    w.receiverLastName,
  ]
    .filter(Boolean)
    .join(" ");
  const attemptStyle = ATTEMPT_COLORS[attempts] ?? ATTEMPT_COLORS.first;

  return (
    <SafeAreaView style={styles.container}>
      {/* â”€â”€ HEADER â”€â”€ */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#22c55e" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Customer Delivery</Text>
          <Text style={styles.subtitle}>Scan orders for delivery</Text>
        </View>
        <View style={styles.scanIconBadge}>
          <ScanLine size={22} color="#22c55e" strokeWidth={2} />
        </View>
      </View>

      {/* â”€â”€ SCANNER â”€â”€ */}
      <View style={{ flex: 1 }}>
        {showScanner && (
          <BarcodeScanner
            key="customer-scanner"
            onScan={onScan}
            scanned={scanned}
            isProcessing={loadingScan}
          />
        )}
      </View>

      {/* â”€â”€ SCAN RESULT ALERT â”€â”€ */}
      {scanResultMessage !== "" && (
        <View
          style={[
            styles.resultAlert,
            alertColor === "green"
              ? styles.resultAlertGreen
              : styles.resultAlertRed,
          ]}
        >
          <View
            style={[
              styles.resultDot,
              {
                backgroundColor: alertColor === "green" ? "#22c55e" : "#ef4444",
              },
            ]}
          />
          <Text
            style={[
              styles.resultText,
              { color: alertColor === "green" ? "#15803d" : "#dc2626" },
            ]}
          >
            {scanResultMessage}
          </Text>
        </View>
      )}

      {/* â”€â”€ BOTTOM DRAWER â€” Order Details â”€â”€ */}
      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={570}
        enableSnapping={false}
        closeOnBackdropPress={false}
        closeOnPressBack={false}
        gestureMode="none"
      >
        <View style={styles.drawerHandle} />
        <ScrollView
          contentContainerStyle={styles.drawerContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity card */}
          <View style={styles.identityCard}>
            <View style={styles.identityLeft}>
              <Text style={styles.identityOrderLabel}>ORDER NUMBER</Text>
              <Text style={styles.identityOrderValue}>
                {w.orderNumber ?? "â€”"}
              </Text>
              {w.waybillNumber && (
                <Text style={styles.identityWaybill}>
                  Waybill: {w.waybillNumber}
                </Text>
              )}
            </View>
            {attempts !== "" && (
              <View
                style={[
                  styles.attemptBadge,
                  { backgroundColor: attemptStyle.bg },
                ]}
              >
                <Text
                  style={[
                    styles.attemptBadgeText,
                    { color: attemptStyle.text },
                  ]}
                >
                  {attempts.toUpperCase()} ATTEMPT
                </Text>
              </View>
            )}
          </View>

          {/* Item Details */}
          <View style={styles.sectionCard}>
            <View
              style={[styles.sectionCardHeader, { borderLeftColor: "#22c55e" }]}
            >
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "#22c55e18" },
                ]}
              >
                <Package size={13} color="#22c55e" strokeWidth={2.5} />
              </View>
              <Text style={[styles.sectionCardTitle, { color: "#22c55e" }]}>
                Item Details
              </Text>
            </View>
            {w.itemName && (
              <TableRow label="Item Name" value={w.itemName} highlight />
            )}
            {w.codValue && (
              <TableRow
                label="COD Value"
                value={`â‚± ${parseFloat(w.codValue).toFixed(2)}`}
                highlight
              />
            )}
            {w.itemWeight && (
              <TableRow label="Weight" value={`${w.itemWeight} kg`} />
            )}
            {w.numberOfItem && (
              <TableRow label="Quantity" value={String(w.numberOfItem)} />
            )}
            {w.pouchesSize && (
              <TableRow label="Pouch Size" value={w.pouchesSize} />
            )}
          </View>

          {/* Recipient */}
          <View style={styles.sectionCard}>
            <View
              style={[styles.sectionCardHeader, { borderLeftColor: "#f97316" }]}
            >
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: "#f9731618" },
                ]}
              >
                <User size={13} color="#f97316" strokeWidth={2.5} />
              </View>
              <Text style={[styles.sectionCardTitle, { color: "#f97316" }]}>
                Recipient
              </Text>
            </View>
            {recipientName && (
              <TableRow label="Name" value={recipientName} highlight />
            )}
            {w.receiverPhone && (
              <TableRow label="Phone" value={w.receiverPhone} />
            )}
            {w.receiverAddress && (
              <TableRow label="Address" value={w.receiverAddress} />
            )}
            {(w.receiverBarangay || w.receiverCity || w.receiverProvince) && (
              <TableRow
                label="Location"
                value={[w.receiverBarangay, w.receiverCity, w.receiverProvince]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
          </View>

          {/* Actions */}
          {attemptsLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#22c55e" />
              <Text style={styles.loadingText}>
                Checking delivery attempts...
              </Text>
            </View>
          ) : loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Updating...</Text>
            </View>
          ) : success ? (
            <View style={styles.successBox}>
              <CheckCircle size={40} color="#22c55e" strokeWidth={2} />
              <Text style={styles.successBoxText}>{successMessage}</Text>
            </View>
          ) : (
            <View style={styles.actionRow}>
              {!attemptReached ? (
                <>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={openCameraDrawer}
                  >
                    <Camera size={18} color="#fff" strokeWidth={2} />
                    <Text style={styles.actionBtnText}>Mark Delivered</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnAmber]}
                    onPress={() => {
                      setShowReturn(true);
                      bottomDrawerRef.current?.close();
                    }}
                  >
                    <RotateCcw size={18} color="#fff" strokeWidth={2} />
                    <Text style={styles.actionBtnText}>For Return</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.rtsWarning}>
                  <RotateCcw size={18} color="#dc2626" strokeWidth={2} />
                  <Text style={styles.rtsWarningText}>
                    This item is for return to seller (RTS)
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onCloseBottomDrawer}
            disabled={loading}
          >
            <X size={16} color="#64748b" strokeWidth={2.5} />
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomDrawer>

      {/* â”€â”€ BOTTOM DRAWER â€” Camera/POD â”€â”€ */}
      <BottomDrawer
        ref={cameraButtomDrawer}
        initialHeight={650}
        enableSnapping={false}
        closeOnBackdropPress={false}
        closeOnPressBack={false}
        gestureMode="none"
      >
        <View style={styles.drawerHandle} />
        <View style={styles.cameraDrawerContent}>
          <View style={styles.cameraDrawerHeader}>
            <Camera size={16} color="#22c55e" strokeWidth={2.5} />
            <Text style={styles.cameraDrawerTitle}>Proof of Delivery</Text>
          </View>

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
                  source={{ uri: photoUri }}
                  style={styles.camera}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.imageLoadingText}>Capturing...</Text>
                  </View>
                )}
                {!imageLoading && !imageCapturingloading && coords && (
                  <View style={styles.coordContainer}>
                    <View style={styles.coordMapThumb}>
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
                      <Text style={styles.coordTimestamp}>
                        {moment().format("DD-MM-YYYY hh:mm A")}
                      </Text>
                      <Text style={styles.coordText}>
                        Lat: {coords.latitude.toFixed(6)}
                      </Text>
                      <Text style={styles.coordText}>
                        Lng: {coords.longitude.toFixed(6)}
                      </Text>
                      <Text style={styles.coordText}>
                        WBN: {w.waybillNumber}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ViewShot>
          ) : null}

          <View style={styles.cameraActions}>
            {!photoUri ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={takePhoto}
                disabled={loading}
              >
                <Camera size={18} color="#fff" strokeWidth={2} />
                <Text style={styles.actionBtnText}>Take Photo</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Button
                  buttonColor="#22c55e"
                  textColor="white"
                  onPress={submitPhoto}
                  mode="contained"
                  loading={loading}
                  disabled={loading || imageLoading}
                >
                  Submit
                </Button>
                <Button
                  buttonColor="#dc2626"
                  textColor="white"
                  onPress={cancelPhoto}
                  mode="contained"
                  disabled={loading}
                >
                  Retake
                </Button>
              </>
            )}
            <Button
              buttonColor="#64748b"
              textColor="white"
              onPress={closeCameraDrawer}
              mode="contained"
              disabled={loading}
            >
              Close
            </Button>
          </View>
        </View>
      </BottomDrawer>

      {/* â”€â”€ ANIMATED DRAWER â€” Return Reason â”€â”€ */}
      <AnimatedDrawer visible={showReturn}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View style={styles.returnHeader}>
            <RotateCcw size={18} color="#f97316" strokeWidth={2.5} />
            <Text style={styles.returnTitle}>Reason for Return</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Enter your reason here..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={reason}
            onChangeText={setReason}
          />
          {attemptsMessage !== "" && (
            <View style={styles.attemptsError}>
              <Text style={styles.attemptsErrorText}>
                {attemptsMessage.message}
              </Text>
            </View>
          )}
          <View style={{ gap: 10 }}>
            <Button
              buttonColor="#22c55e"
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
              textColor="#64748b"
              onPress={onCloseBottomDrawer}
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

// â”€â”€ inline helper component (defined outside to avoid re-render) â”€â”€
function TableRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <View style={trStyles.row}>
      <Text style={trStyles.label}>{label}</Text>
      <Text style={[trStyles.value, highlight && trStyles.valueHL]}>
        {value}
      </Text>
    </View>
  );
}
const trStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  label: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    flex: 1,
    paddingRight: 8,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    flex: 2,
    textAlign: "right",
  },
  valueHL: { color: "#1e293b", fontWeight: "700" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#5a8a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#4a7a14",
  },
  headerTextContainer: { flex: 1 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  scanIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#fff" },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  // Result alert
  resultAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultAlertGreen: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  resultAlertRed: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  resultDot: { width: 8, height: 8, borderRadius: 4 },
  resultText: { fontSize: 13, fontWeight: "600", flex: 1 },

  // Drawer shared
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  drawerContent: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },

  // Identity card
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  identityLeft: { flex: 1 },
  identityOrderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  identityOrderValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 2,
  },
  identityWaybill: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "500",
  },
  attemptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },
  attemptBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  // Section cards
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    borderLeftWidth: 3,
  },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Action buttons
  actionRow: { flexDirection: "row", gap: 10, marginVertical: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#22c55e",
    paddingVertical: 13,
    borderRadius: 14,
  },
  actionBtnAmber: { backgroundColor: "#f97316" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rtsWarning: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  rtsWarningText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },

  // Loading / success
  loadingBox: { alignItems: "center", paddingVertical: 20, gap: 8 },
  loadingText: { color: "#64748b", fontSize: 13, fontWeight: "500" },
  successBox: { alignItems: "center", paddingVertical: 20, gap: 10 },
  successBoxText: { color: "#22c55e", fontSize: 15, fontWeight: "700" },

  // Close button
  closeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 4,
  },
  closeBtnText: { color: "#64748b", fontWeight: "600", fontSize: 14 },

  // Camera drawer
  cameraDrawerContent: { paddingHorizontal: 16, paddingBottom: 24 },
  cameraDrawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cameraDrawerTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  camera: {
    width: "100%",
    height: 380,
    borderRadius: 16,
    backgroundColor: "#000",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    gap: 12,
  },
  imageLoadingText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  coordContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.42)",
    padding: 8,
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  coordMapThumb: {
    height: 70,
    width: 70,
    borderRadius: 12,
    overflow: "hidden",
  },
  coordTimestamp: { fontSize: 10, color: "#fff", marginBottom: 2 },
  coordText: { color: "#fff", fontWeight: "600", fontSize: 11 },
  cameraActions: { flexDirection: "column", gap: 10, marginTop: 12 },

  // Return drawer
  returnHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  returnTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 16,
    backgroundColor: "#f8fafc",
  },
  attemptsError: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
  },
  attemptsErrorText: { color: "#dc2626", fontWeight: "600" },

  // Misc
  message: { textAlign: "center", paddingBottom: 10 },
  scanCountCard: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  scanCountNumber: { fontSize: 28, fontWeight: "800", color: "#22c55e" },
  scanCountLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
});

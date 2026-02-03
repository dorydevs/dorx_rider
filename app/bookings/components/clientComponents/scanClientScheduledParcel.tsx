import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import BottomDrawer from "react-native-animated-bottom-drawer";
// import { useParams } from "react-router-dom";\
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
  // const bottomSheetRef = useRef<BottomSheet>(null);
  const bottomDrawerRef = useRef<{
    open: () => void;
    close: () => void;
  } | null>(null);

  const snapPoints = useMemo(() => ["50%", "85%"], []);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { clientData, clientScheduledToPickUp } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ScheduledData, setScheduledData] = useState<ClientData[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<ClientData | null>(null);
  const user = useAppSelector((state: any) => state.user.user);
  const client: ClientData = clientData
    ? JSON.parse(clientData as string)
    : null;
  const clientScheduledToPickUpData: ClientData = clientScheduledToPickUp
    ? JSON.parse(clientScheduledToPickUp as string)
    : null;

  const openBottomDrawer = (item: ClientData) => {
    setSelectedItem(item);
    bottomDrawerRef.current?.open();
    console.log(item);
  };

  const renderItem = ({ item }: { item: ClientData }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => openBottomDrawer(item)}
        activeOpacity={0.75}
      >
        <View>
          <Text>{item.waybillNumber}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="calendar" size={15} />
            <Text style={{ fontSize: 14, opacity: 0.5 }}>
              {item.scheduleForPickup
                ? new Date(item.scheduleForPickup).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })
                : ""}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  const handlePressScan = (item: ClientData) => {
    router.push({
      pathname: "/bookings/components/clientComponents/scanner",
      params: {
        clientData: JSON.stringify(client),
        clientScheduledToPickUpData: JSON.stringify(
          clientScheduledToPickUpData,
        ),
        ScheduledData: JSON.stringify(ScheduledData),
      },
    });
  };

  useEffect(() => {
    try {
      const fetchScheduledData = async () => {
        setLoading(true);
        const response = await axiosInstance(userData.token).get(
          `/api/orderTransactions/fetchOrdersForPickupByHub?clientId=${
            client?.clientId
          }&&pickupAddressId=${parseFloat(
            clientScheduledToPickUpData?.pickupAddressId,
          )}&&pickupSchedule=${moment(clientScheduledToPickUpData?.date).format(
            "YYYY-MM-DD",
          )}`,
        );
        console.log(
          `/api/orderTransactions/fetchOrdersForPickupByHub?clientId=${
            client?.clientId
          }&&pickupAddressId=${
            clientScheduledToPickUpData?.pickupAddressId
          }&&pickupSchedule=${moment(clientScheduledToPickUpData?.date).format(
            "YYYY-MM-DD",
          )}`,
        );

        setScheduledData(response.data);
        setLoading(false);
      };

      if (userData !== null) {
        fetchScheduledData();
      }
    } catch (error) {
      setLoading(false);
      console.log("ERROR fetch ScheduledData : >> ", error);
    }
  }, [userData]);

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
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  return (
    <View style={styles.container}>
      <View
        style={{ flexDirection: "row", alignItems: "center", paddingTop: 25 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="chevron-left" size={24} color="#007AFF" />
        </TouchableOpacity>

        <Text style={styles.title}>Client Scheduled to Pick up</Text>
      </View>
      <View>
        <View
          style={{
            padding: 20,
            marginTop: 20,
            borderRadius: 12,
            backgroundColor: "#294983",
            elevation: 2,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Feather name="calendar" size={17} style={{ color: "white" }} />
              <Text style={{ fontSize: 17, color: "white" }}>
                {moment(clientScheduledToPickUpData?.date).format("YYYY-MM-DD")}
              </Text>
            </View>
            <View
              style={{
                height: 2,
                backgroundColor: "white",
                width: 290,
                marginTop: 10,
              }}
            ></View>
            <View>
              <Text
                style={{
                  opacity: 0.5,
                  fontSize: 13,
                  color: "white",
                  marginTop: 5,
                }}
              >
                Pick Up Address
              </Text>
            </View>
            <View>
              <Text style={{ opacity: 0.5, fontSize: 13, color: "white" }}>
                {clientScheduledToPickUpData?.senderBarangay},{" "}
                {clientScheduledToPickUpData?.senderCity} {","}
                {clientScheduledToPickUpData?.senderProvince}
              </Text>
              <View>
                <Text style={{ opacity: 0.5, fontSize: 13, color: "white" }}>
                  Total Items : {clientScheduledToPickUpData?.totalItems}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={handlePressScan}
        style={{
          padding: 10,
          backgroundColor: "white",
          elevation: 1,
          borderRadius: 20,
          marginTop: 10,
          alignItems: "center",
          flexDirection: "row",
          gap: 10,
          justifyContent: "center",
        }}
      >
        <Text>Scan</Text> <AntDesign name="qrcode" size={24} color="black" />
      </TouchableOpacity>
      {loading ? (
        <View style={{ padding: 20 }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={ScheduledData.orders}
          keyExtractor={(item, idx) =>
            String(item?.id ?? item?.ClientDataId ?? idx)
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={560}
        enableSnapping={false}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {selectedItem && (
            <View style={{ padding: 16 }}>
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

              <SheetItem label="Recipient" value={selectedItem.recipientName} />
              <SheetItem
                label="Recipient Phone"
                value={selectedItem.recipientPhone}
              />
              <SheetItem
                label="Recipient Address"
                value={`${selectedItem.recipientProvince}, ${selectedItem.recipientCity}, ${selectedItem.recipientBarangay}`}
              />
              <SheetItem
                label="Full Address"
                value={selectedItem.recipientAddress}
              />
            </View>
          )}
        </ScrollView>
      </BottomDrawer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

    color: "#50a3fc",
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
  items: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
});

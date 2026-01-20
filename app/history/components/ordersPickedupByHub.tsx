import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import BottomDrawer from "react-native-animated-bottom-drawer";
type clientHistoryData = any;
const SheetItem = ({ label, value }: { label: string; value?: any }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={{ fontSize: 12, color: "#6b7280" }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: "600" }}>{value ?? "-"}</Text>
  </View>
);
const Divider = () => (
  <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 12 }} />
);
export default function clientHistoryt() {
  const bottomDrawerRef = useRef<{
    open: () => void;
    close: () => void;
  } | null>(null);
  const { width } = useWindowDimensions();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<clientHistoryData | null>(
    null
  );
  const [popup, setPopup] = useState(false);
  const [waybillDetail, setWaybillDetail] = useState(false);
  const [bookings, setBookings] = useState<any>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  // const [searchValue, setSearchValue] = useState("");
  const [searchResult, setSearchResult] = useState("");
  const [dataLoading, setDataLoading] = useState(false);

  const { orderData } = useLocalSearchParams();
  const clientInfo: clientHistoryData = orderData
    ? JSON.parse(orderData as string)
    : null;

  const openBottomDrawer = (item: clientHistoryData) => {
    setSelectedItem(item);
    bottomDrawerRef.current?.open();
    console.log(item);
  };

  const fetchBookings = async (orderData: any) => {
    try {
      setBookingsLoading(true);
      const { data } = await axiosInstance(userData.token).get(
        `/api/riderTransaction/pickedupBookingsPerPickupAddress?riderId=${userData.id}&clientId=${clientInfo.clientId}&&pickupAddressId=${clientInfo.pickupAddressId}`
      );
      setBookings(data);
      setBookingsLoading(false);
    } catch (error) {
      console.log("ERROR:", error);
    }
  };

  useEffect(() => {
    if (userData !== null) {
      fetchBookings(orderData);
    }
  }, [userData]);

  const renderItem = ({ item }: { item: clientHistoryData }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => openBottomDrawer(item)}
        activeOpacity={0.75}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15 }}> {item.waybillNumber}</Text>
          <Text style={{ opacity: 0.5 }}>COD Value : {item.codValue}</Text>
          <Text style={{ opacity: 0.5 }}>Item Weigth: {item.itemWeight}</Text>
          <Text style={{ opacity: 0.5 }}>Total Items{item.numberOfItem}</Text>
          <Text style={{ opacity: 0.5 }}>Total Items{item.receiverName}</Text>
          <Text style={{ opacity: 0.5 }}>
            Scanned Date : {moment(item.scannedDate).format("DD-MM-YYYY")}
          </Text>
        </View>
      </TouchableOpacity>
    );
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
        console.log("Success");
      }
    };

    loadUserData();
  }, [user]);

  console.log(bookings);

  return (
    <View style={styles.container}>
      <View style={{ marginTop: 35 }}></View>
      <View>
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
              <Text
                style={{ fontSize: 18, color: "white", fontWeight: "bold" }}
              >
                Pickup Address
              </Text>
              <Text style={{ fontSize: 16, color: "white" }}>
                {bookings[0]?.senderName}
              </Text>
              <Text style={{ fontSize: 13, opacity: 0.5, color: "white" }}>
                {`${bookings[0]?.senderBarangay}, ${bookings[0]?.senderCity}, ${bookings[0]?.senderProvince}`}
              </Text>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 30, color: "white", marginBottom: -15 }}>
                {bookings.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {bookingsLoading ? (
        <View style={{ padding: 20, marginTop: 50 }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item, idx) =>
            String(item?.id ?? item?.bookingId ?? idx)
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
                label="Recipient Province/City/Brgy"
                value={`${selectedItem.recipientProvince}, ${selectedItem.recipientCity}, ${selectedItem.recipientBarangay}`}
              />
              <SheetItem
                label="Recipient Address"
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
    padding: 20,
  },
  items: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
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
    fontSize: 28,
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
});

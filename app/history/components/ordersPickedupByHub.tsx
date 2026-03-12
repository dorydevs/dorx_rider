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
import { Ionicons } from "@expo/vector-icons";
type clientHistoryData = any;
const SheetItem = ({ label, value }: { label: string; value?: any }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 11, color: "#7f8c8d", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
    <Text style={{ fontSize: 15, fontWeight: "600", color: "#2c3e50", marginTop: 4 }}>{value ?? "-"}</Text>
  </View>
);
const Divider = () => (
  <View style={{ height: 1, backgroundColor: "#e8ecf1", marginVertical: 16 }} />
);
export default function clientHistoryt() {
  const bottomDrawerRef = useRef<any>(null);
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
      console.error("Fetch bookings error:", error);
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
        activeOpacity={0.7}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name="cube" size={22} color="#22c55e" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.waybillNumber}</Text>
          <View style={styles.cardDetailRow}>
            <Ionicons name="person-outline" size={14} color="#7f8c8d" />
            <Text style={styles.cardDetail}>{item.receiverName}</Text>
          </View>
          <View style={styles.cardDetailRow}>
            <Ionicons name="cash-outline" size={14} color="#7f8c8d" />
            <Text style={styles.cardDetail}>COD: ₱{item.codValue || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="scale-outline" size={12} color="#95a5a6" />
              <Text style={styles.infoText}>{item.itemWeight}kg</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="layers-outline" size={12} color="#95a5a6" />
              <Text style={styles.infoText}>{item.numberOfItem} items</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={12} color="#95a5a6" />
              <Text style={styles.infoText}>{moment(item.scannedDate).format("MMM DD")}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
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
      }
    };

    loadUserData();
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.pickupCard}>
          <View style={styles.pickupHeader}>
            <View style={styles.pickupIconContainer}>
              <Ionicons name="location" size={28} color="#fff" />
            </View>
            <View style={styles.pickupInfo}>
              <Text style={styles.pickupLabel}>Pickup Address</Text>
              <Text style={styles.pickupName}>{bookings[0]?.senderName || "Loading..."}</Text>
              {bookings[0] && (
                <View style={styles.addressRow}>
                  <Ionicons name="pin-outline" size={14} color="#d1fae5" />
                  <Text style={styles.pickupAddress}>
                    {`${bookings[0].senderBarangay}, ${bookings[0].senderCity}, ${bookings[0].senderProvince}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countLabel}>Total Bookings</Text>
            <Text style={styles.countValue}>{bookings.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.listSection}>
        {bookingsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item, idx) =>
              String(item?.id ?? item?.bookingId ?? idx)
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="#bdc3c7" />
                <Text style={styles.emptyText}>No bookings found</Text>
              </View>
            }
          />
        )}
      </View>

      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={560}
        enableSnapping={false}
      >
        <View style={styles.drawerHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {selectedItem && (
            <View style={styles.drawerContent}>
              <View style={styles.drawerTitle}>
                <Ionicons name="document-text" size={20} color="#22c55e" />
                <Text style={styles.drawerTitleText}>Booking Details</Text>
              </View>
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
    backgroundColor: "#f5f7fa",
  },
  headerSection: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  pickupCard: {
    backgroundColor: "#22c55e",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#22c55e",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pickupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  pickupIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickupInfo: {
    flex: 1,
    gap: 4,
  },
  pickupLabel: {
    fontSize: 12,
    color: "#d1fae5",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  pickupName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "700",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  pickupAddress: {
    fontSize: 13,
    color: "#d1fae5",
    flex: 1,
  },
  countBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  countLabel: {
    fontSize: 12,
    color: "#d1fae5",
    fontWeight: "600",
    marginBottom: 4,
  },
  countValue: {
    fontSize: 36,
    color: "#fff",
    fontWeight: "700",
  },
  listSection: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2c3e50",
  },
  cardDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardDetail: {
    fontSize: 13,
    color: "#7f8c8d",
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: "#95a5a6",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#7f8c8d",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#7f8c8d",
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
  },
  drawerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  drawerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
  },
  items: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
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
    color: "#4ade80",
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

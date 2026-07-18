import { DrawerHeader } from "@/components/DrawerHeader";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
type clientHistoryData = any;

const SheetItem = ({ label, value }: { label: string; value?: any }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0F172A", marginTop: 4 }}>{value ?? "-"}</Text>
  </View>
);
const Divider = () => (
  <View style={{ height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 }} />
);

export default function clientHistoryt() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [data, setData] = useState<clientHistoryData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const { clientData, filter } = useLocalSearchParams();
  const clientInfo: clientHistoryData = clientData
    ? JSON.parse(clientData as string)
    : null;

  const bottomDrawerRef = useRef<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<clientHistoryData | null>(null);
  const [addressBookings, setAddressBookings] = useState<any[]>([]);
  const [addressBookingsLoading, setAddressBookingsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<clientHistoryData | null>(null);

  const activeFilter = (filter as string) || "all";
  const filteredAddressBookings =
    activeFilter === "picked-up"
      ? addressBookings.filter((b: any) => b.orderStatus === "Picked up by Rider")
      : activeFilter === "dropped-off"
        ? addressBookings.filter(
            (b: any) => !!b.orderStatus && b.orderStatus !== "Picked up by Rider",
          )
        : addressBookings;

  const openAddressDrawer = async (item: clientHistoryData) => {
    setSelectedAddress(item);
    setSelectedBooking(null);
    bottomDrawerRef.current?.open();
    try {
      setAddressBookingsLoading(true);
      const { data } = await axiosInstance(userData.token).get(
        `/api/riderTransaction/pickedupBookingsPerPickupAddress?riderId=${userData.id}&clientId=${item.clientId}&pickupAddressId=${item.pickupAddressId}`
      );
      setAddressBookings(data);
    } catch (error) {
      console.error("Fetch pickup address bookings error:", error);
    } finally {
      setAddressBookingsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: clientHistoryData }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => openAddressDrawer(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name="location" size={22} color="#00BF63" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.pickupAddressName}
          </Text>
          <View style={styles.cardDetailRow}>
            <Ionicons name="pin-outline" size={14} color="#64748B" />
            <Text style={styles.cardAddress} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          <View style={styles.cardCountBadge}>
            <Ionicons name="cube" size={12} color="#00BF63" />
            <Text style={styles.cardCountBadgeText}>
              {item.totalPickedUp}{" "}
              {Number(item.totalPickedUp) === 1 ? "parcel" : "parcels"}
            </Text>
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    );
  };


  useEffect(() => {
    const fetchPickupAddressCounts = async () => {
      try {
        setDataLoading(true);
        const response = await axiosInstance(userData.token).get(
          `/api/riderTransaction/pickedupCountsPerPickupAddress?clientId=${clientInfo.clientId}&riderId=${userData.id}`
        );

        setData(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setDataLoading(false);
      }
    };
    if (userData !== null) {
      fetchPickupAddressCounts();
    }
  }, [userData]);

  useEffect(() => {
    const fetchClientCounts = async () => {
      try {
        setClientLoading(true);

        const response = await axiosInstance(userData.token).get(
          `/api/riderTransaction/pickedupCountsPerClient?riderId=${userData.id}&clientId=${clientInfo.clientId}`
        );




        setClient(response.data?.[0] ?? null);
      } catch (error) {
        console.error(error);
      } finally {
        setClientLoading(false);
      }
    };
    if (userData !== null) {
      fetchClientCounts();
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
      }
    };

    loadUserData();
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.clientCard}>
          <View style={styles.clientHeader}>
            <View style={styles.clientIconContainer}>
              <Ionicons name="business" size={28} color="#fff" />
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientLabel}>Client</Text>
              <Text style={styles.clientName}>{client?.clientName || "Loading..."}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255, 255, 255, 0.75)" />
                <Text style={styles.clientAddress}>{client?.address || ""}</Text>
              </View>
            </View>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countLabel}>Total Items</Text>
            <Text style={styles.countValue}>{client?.totalPickedUp || 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Ionicons name="list" size={18} color="#0F172A" />
          <Text style={styles.listTitle}>Pickup Addresses</Text>
        </View>

        {dataLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00BF63" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={data.filter((d) => d.clientId !== null)}
            keyExtractor={(item, idx) =>
              String(item?.id ?? item?.bookingId ?? idx)
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
                <Text style={styles.emptyText}>No pickup addresses found</Text>
              </View>
            }
          />
        )}
      </View>

      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={560 + insets.bottom}
        enableSnapping={false}
        onClose={() => setSelectedBooking(null)}
      >
        {selectedBooking ? (
          <DrawerHeader
            title="Booking Details"
            subtitle={
              selectedBooking.waybillNumber
                ? `Waybill: ${selectedBooking.waybillNumber}`
                : undefined
            }
            icon={<Ionicons name="document-text" size={22} color="#00BF63" />}
            onBack={() => setSelectedBooking(null)}
            onClose={() => bottomDrawerRef.current?.close()}
          />
        ) : (
          <DrawerHeader
            title={selectedAddress?.pickupAddressName || "Items"}
            subtitle={
              addressBookingsLoading
                ? undefined
                : `${filteredAddressBookings.length} ${filteredAddressBookings.length === 1 ? "item" : "items"}`
            }
            icon={<Ionicons name="cube" size={22} color="#00BF63" />}
            onClose={() => bottomDrawerRef.current?.close()}
          />
        )}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {selectedBooking ? (
            <View style={styles.drawerContent}>
              <SheetItem
                label="Order Number"
                value={selectedBooking.orderNumber}
              />
              <SheetItem
                label="Date"
                value={
                  selectedBooking.scannedDate
                    ? moment(selectedBooking.scannedDate).format(
                        "MMM DD, YYYY"
                      )
                    : "-"
                }
              />

              <Divider />

              <SheetItem label="Client Name" value={selectedBooking.senderName} />
              <SheetItem
                label="Client Address"
                value={`${selectedBooking.senderProvince}, ${selectedBooking.senderCity}, ${selectedBooking.senderBarangay}`}
              />
              <SheetItem
                label="Phone Number"
                value={selectedBooking.senderPhone}
              />
            </View>
          ) : (
            <View style={styles.drawerContent}>
              {addressBookingsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00BF63" />
                  <Text style={styles.loadingText}>Loading items...</Text>
                </View>
              ) : filteredAddressBookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="cube-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyText}>No items found</Text>
                </View>
              ) : (
                filteredAddressBookings.map((booking: any, idx: number) => (
                  <TouchableOpacity
                    key={String(booking?.id ?? booking?.bookingId ?? idx)}
                    style={styles.bookingRow}
                    onPress={() => setSelectedBooking(booking)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardIconContainer}>
                      <Ionicons name="cube" size={20} color="#00BF63" />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{booking.waybillNumber}</Text>
                      <View style={styles.cardDetailRow}>
                        <Ionicons name="person-outline" size={13} color="#64748B" />
                        <Text style={styles.cardAddress}>{booking.receiverName}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </BottomDrawer>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerSection: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  clientCard: {
    backgroundColor: "#00BF63",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#00BF63",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  clientIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  clientInfo: {
    flex: 1,
    gap: 4,
  },
  clientLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  clientName: {
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
  clientAddress: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
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
    color: "rgba(255, 255, 255, 0.75)",
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
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#00BF6315",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardAddress: {
    fontSize: 13,
    color: "#64748B",
    flex: 1,
  },
  cardCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    marginTop: 2,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#00BF6315",
  },
  cardCountBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00BF63",
  },
  chevronContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  drawerContent: {
    padding: 20,
  },
  bookingRow: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
    color: "#00BF63",
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

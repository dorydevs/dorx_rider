import { DrawerHeader } from "@/components/DrawerHeader";
import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";

type customerHistoryData = any;

export default function CustomerHistoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [data, setData] = useState<customerHistoryData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<customerHistoryData>(null);
  const { clientData } = useLocalSearchParams();
  const customerInfo: customerHistoryData = clientData
    ? JSON.parse(clientData as string)
    : null;

  const bottomDrawerRef = useRef<any>(null);

  const handlePress = (item: customerHistoryData) => {
    setSelectedOrder(item);
    bottomDrawerRef.current?.open();
  };

  const renderItem = ({ item }: { item: customerHistoryData }) => {
    const receiverName =
      [item.receiverFirstName, item.receiverMiddleName, item.receiverLastName]
        .filter(Boolean)
        .join(" ") ||
      item.receiverName ||
      "Customer";

    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name="person" size={20} color="#00BF63" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{receiverName}</Text>
          <View style={styles.cardDetailRow}>
            <Ionicons name="document-text-outline" size={14} color="#94A3B8" />
            <Text style={styles.cardAddress} numberOfLines={1}>
              {item.orderNumber ?? item.waybillNumber ?? ""}
            </Text>
          </View>
          <View style={styles.cardDetailRow}>
            <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
            <Text style={styles.cardDate}>
              {moment(item.scannedDate ?? item.createdAt).format(
                "MMM DD, YYYY",
              )}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        const response = await axiosInstance(userData.token).get(
          `/api/riderTransaction/${userData.id}/transactionFromCustomers/${customerInfo?.barangay}`,
        );
        console.log("customer history data >>>", response.data);
        setData(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setDataLoading(false);
      }
    };
    if (userData !== null) {
      fetchData();
    }
  }, [userData]);

  const receiverFullName = selectedOrder
    ? [
        selectedOrder.receiverFirstName,
        selectedOrder.receiverMiddleName,
        selectedOrder.receiverLastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      selectedOrder.receiverName ||
      "Customer"
    : "";

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER CARD */}
      <View style={styles.headerSection}>
        <View style={styles.clientCard}>
          <View style={styles.clientHeader}>
            <View style={styles.clientIconContainer}>
              <Ionicons name="location" size={28} color="#fff" />
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientLabel}>Barangay</Text>
              <Text style={styles.clientName}>
                {customerInfo?.barangay ??
                  customerInfo?.customerName ??
                  "Customer"}
              </Text>
              <View style={styles.addressRow}>
                <Ionicons name="cube-outline" size={14} color="#00BF6315" />
                <Text style={styles.clientAddress}>
                  Total scanned:{" "}
                  {customerInfo?.total ?? customerInfo?.totalPickedUp ?? 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* LIST */}
      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Ionicons name="list" size={18} color="#0F172A" />
          <Text style={styles.listTitle}>Transactions</Text>
        </View>

        {dataLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00BF63" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item, idx) =>
              String(item?.id ?? item?.bookingId ?? idx)
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons
                    name="folder-open-outline"
                    size={36}
                    color="#00BF63"
                  />
                </View>
                <Text style={styles.emptyText}>No transactions found</Text>
                <Text style={styles.emptySubtext}>
                  This barangay has no recorded transactions yet.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* BOTTOM DRAWER */}
      <BottomDrawer
        ref={bottomDrawerRef}
        initialHeight={600}
        enableSnapping={false}
        closeOnBackdropPress={true}
        closeOnPressBack={false}
        gestureMode="none"
      >
        <View style={{ flex: 1 }}>
          <DrawerHeader
            title={receiverFullName}
            subtitle={
              selectedOrder?.orderNumber ?? selectedOrder?.waybillNumber ?? ""
            }
            icon={<Ionicons name="person" size={22} color="#00BF63" />}
            onClose={() => bottomDrawerRef.current?.close()}
            showHandle={false}
          />

          {/* Scrollable content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={true}
            bounces={false}
          >
            {/* Order Details */}
            <View style={styles.drawerSection}>
              <Text style={styles.drawerSectionTitle}>Order Details</Text>

              <View style={styles.drawerRow}>
                <Ionicons name="cube-outline" size={16} color="#94A3B8" />
                <Text style={styles.drawerLabel}>Item Name</Text>
                <Text style={styles.drawerValue}>
                  {selectedOrder?.itemName ?? "—"}
                </Text>
              </View>

              <View style={styles.drawerRow}>
                <Ionicons name="cash-outline" size={16} color="#94A3B8" />
                <Text style={styles.drawerLabel}>COD Value</Text>
                <Text style={styles.drawerValue}>
                  {selectedOrder?.codValue ?? "—"}
                </Text>
              </View>

              <View style={styles.drawerRow}>
                <Ionicons name="scale-outline" size={16} color="#94A3B8" />
                <Text style={styles.drawerLabel}>Weight</Text>
                <Text style={styles.drawerValue}>
                  {selectedOrder?.itemWeight ?? "—"}
                </Text>
              </View>

              <View style={styles.drawerRow}>
                <Ionicons name="layers-outline" size={16} color="#94A3B8" />
                <Text style={styles.drawerLabel}>Qty</Text>
                <Text style={styles.drawerValue}>
                  {selectedOrder?.numberOfItem ?? "—"}
                </Text>
              </View>
            </View>

            <View style={styles.drawerDivider} />

            {/* Receiver Details */}
            <View style={styles.drawerSection}>
              <Text style={styles.drawerSectionTitle}>Receiver</Text>

              <View style={styles.drawerRow}>
                <Ionicons name="person-outline" size={16} color="#94A3B8" />
                <Text style={styles.drawerLabel}>Name</Text>
                <Text style={styles.drawerValue}>{receiverFullName}</Text>
              </View>

              <View style={styles.drawerRow}>
                <Ionicons name="call-outline" size={16} color="#94A3B8" />
                <Text style={styles.drawerLabel}>Phone</Text>
                <Text style={styles.drawerValue}>
                  {selectedOrder?.receiverPhone ?? "—"}
                </Text>
              </View>

              <View style={styles.drawerRow}>
                <Ionicons name="location-outline" size={16} color="#94A3B8" />
                <Text style={styles.drawerLabel}>Barangay</Text>
                <Text style={styles.drawerValue}>
                  {selectedOrder?.receiverBarangay ?? "—"}
                </Text>
              </View>
            </View>

            <View style={styles.drawerDivider} />

            {/* Status */}
            <View style={styles.drawerSection}>
              <Text style={styles.drawerSectionTitle}>Status</Text>

              <View style={styles.drawerRow}>
                <Ionicons name="flag-outline" size={16} color="#94A3B8" />
                <Text style={styles.drawerLabel}>Waybill</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {selectedOrder?.waybillStatus ?? "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.drawerRow}>
                <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                <Text style={styles.drawerLabel}>Scanned</Text>
                <Text style={styles.drawerValue}>
                  {selectedOrder?.scannedDate
                    ? moment(selectedOrder.scannedDate).format(
                        "MMM DD, YYYY hh:mm A",
                      )
                    : "—"}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </BottomDrawer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerSection: { padding: 16, paddingTop: 12 },
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
  clientHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  clientIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  clientInfo: { flex: 1, gap: 4 },
  clientLabel: {
    fontSize: 12,
    color: "#00BF6315",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  clientName: { fontSize: 18, color: "#fff", fontWeight: "700" },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  clientAddress: { fontSize: 13, color: "#00BF6315", flex: 1 },
  listSection: { flex: 1, paddingHorizontal: 16, marginBottom: 8 },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  listTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  listContent: { paddingBottom: 32 },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#00BF6315",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  cardDetailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardAddress: { fontSize: 13, color: "#64748B", flex: 1 },
  cardDate: { fontSize: 12, color: "#64748B" },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#00BF6315",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  emptySubtext: {
    marginTop: 6,
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },

  // DRAWER
  drawerScroll: { flex: 1, maxHeight: 580 },
  drawerContent: { paddingBottom: 40 },
  drawerDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 20,
  },
  drawerSection: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  drawerSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  drawerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  drawerLabel: { fontSize: 14, color: "#64748B", flex: 1 },
  drawerValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    textAlign: "right",
    flexShrink: 1,
  },
  statusBadge: {
    backgroundColor: "#00BF6315",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: "600", color: "#00BF63" },
});

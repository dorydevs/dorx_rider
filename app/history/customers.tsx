import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ChevronRight, FolderOpen, MapPin, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
type clientHistoryData = any;
export default function clientHistoryt() {
  const { width } = useWindowDimensions();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();
  const [data, setData] = useState<clientHistoryData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const handlePress = (item: clientHistoryData) => {
    router.push({
      pathname: "/history/components/clientHistory",
      params: {
        clientData: JSON.stringify(item),
      },
    });
  };

  const renderItem = ({ item }: { item: clientHistoryData }) => {
    const title =
      item?.customerName ??
      item?.name ??
      item?.barangay ??
      item?.id ??
      "Customer";
    const subtitle =
      item?.pickupAddress ?? item?.address ?? item?.pickup_location ?? "";
    const count = item?.totalPickedUp ?? item?.count ?? null;

    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardIconContainer}>
          <Users size={20} color="#7c3aed" strokeWidth={1.8} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? (
            <View style={styles.cardDetailRow}>
              <MapPin size={13} color="#94a3b8" strokeWidth={1.8} />
              <Text style={styles.cardAddress} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          ) : null}
          {count != null ? (
            <View style={styles.cardDetailRow}>
              <Ionicons name="cube-outline" size={13} color="#94a3b8" />
              <Text style={styles.cardCount}>
                {count} {count === 1 ? "delivery" : "deliveries"}
              </Text>
            </View>
          ) : null}
        </View>
        <ChevronRight size={18} color="#cbd5e1" strokeWidth={2} />
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
    const handleData = async () => {
      setDataLoading(true);
      const { data } = await axiosInstance(userData.token).get(
        `/api/riderTransaction/${userData.id}/transactionFromCustomersPerBarangay/${userData.storeCity}`,
      );

      setData(data);
      setDataLoading(false);
    };

    if (userData !== null) {
      handleData();
    }
  }, [userData]);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Customer History</Text>
          <Text style={styles.headerSubtitle}>Deliveries per barangay</Text>
        </View>
      </View>

      {dataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, idx) =>
            String(item?.id ?? item?.bookingId ?? idx)
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FolderOpen size={48} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No deliveries yet</Text>
              <Text style={styles.emptySubtext}>
                Customer deliveries will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdf4" },
  headerSection: {
    backgroundColor: "#22c55e",
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#22c55e",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "#d1fae5", marginTop: 2 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#94a3b8" },
  listContent: { padding: 16, paddingBottom: 32, alignItems: "center" },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
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
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  cardDetailRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardAddress: { fontSize: 13, color: "#94a3b8", flex: 1 },
  cardCount: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#94a3b8",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#cbd5e1",
    textAlign: "center",
  },
});

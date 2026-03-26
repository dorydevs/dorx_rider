import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";

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
      pathname: "/history/components/customerHistory",
      params: {
        clientData: JSON.stringify(item),
      },
    });
  };

  const renderItem = ({ item }: { item: clientHistoryData }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name="location" size={22} color="#22c55e" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.barangay}</Text>
          <View style={styles.cardDetailRow}>
            <Ionicons name="cube-outline" size={14} color="#94A3B8" />
            <Text style={styles.cardCount}>Total Items: {item.total}</Text>
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
      } finally {
        console.log("Success");
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
      console.log("customers data response >>>", data);

      setData(data);
      setDataLoading(false);
    };

    if (userData !== null) {
      handleData();
    }
  }, [userData]);

  return (
    <SafeAreaView style={styles.container}>
      {/* GREEN HEADER */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="people" size={24} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Customers</Text>
            <Text style={styles.headerSubtitle}>
              Pickup transactions per customer
            </Text>
          </View>
          {data.length > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{data.length}</Text>
            </View>
          )}
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
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={36} color="#22c55e" />
              </View>
              <Text style={styles.emptyText}>No Transactions Yet</Text>
              <Text style={styles.emptySubtext}>
                You have no pickup transactions recorded.{"\n"}
                Customers will appear here once you start picking up parcels.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  headerSection: {
    backgroundColor: "#22c55e",
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    shadowColor: "#16a34a",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: { flex: 1 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#d1fae5",
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  headerBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
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
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1, gap: 4 },
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
  cardCount: {
    fontSize: 12,
    color: "#22c55e",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
});

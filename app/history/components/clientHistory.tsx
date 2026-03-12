import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
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
import { Ionicons } from "@expo/vector-icons";
type clientHistoryData = any;
export default function clientHistoryt() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [data, setData] = useState<clientHistoryData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const { clientData } = useLocalSearchParams();
  const clientInfo: clientHistoryData = clientData
    ? JSON.parse(clientData as string)
    : null;

  const handlePress = (item: clientHistoryData) => {
    router.push({
      pathname: "/history/components/ordersPickedupByHub",
      params: {
        orderData: JSON.stringify(item),
      },
    });
  };

  const renderItem = ({ item }: { item: clientHistoryData }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name="location" size={22} color="#22c55e" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.pickupAddressName}</Text>
          <View style={styles.cardDetailRow}>
            <Ionicons name="pin-outline" size={14} color="#7f8c8d" />
            <Text style={styles.cardAddress}>{item.address}</Text>
          </View>
          <View style={styles.cardDetailRow}>
            <Ionicons name="calendar-outline" size={14} color="#7f8c8d" />
            <Text style={styles.cardDate}>
              {moment(item.scannedDate).format("MMM DD, YYYY")}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
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
    <View style={styles.container}>
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
                <Ionicons name="location-outline" size={14} color="#d1fae5" />
                <Text style={styles.clientAddress}>{client?.address || ""}</Text>
              </View>
            </View>
          </View>
          {/* <View style={styles.countBadge}>
            <Text style={styles.countLabel}>Total Picked Up</Text>
            <Text style={styles.countValue}>{client.totalPickedUp || 0}</Text>
          </View> */}
        </View>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Ionicons name="list" size={18} color="#2c3e50" />
          <Text style={styles.listTitle}>Pickup Addresses</Text>
        </View>

        {dataLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
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
                <Ionicons name="folder-open-outline" size={48} color="#bdc3c7" />
                <Text style={styles.emptyText}>No pickup addresses found</Text>
              </View>
            }
          />
        )}
      </View>
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
  clientCard: {
    backgroundColor: "#22c55e",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#22c55e",
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
    color: "#d1fae5",
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
    color: "#2c3e50",
  },
  listContent: {
    paddingBottom: 20,
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
    fontWeight: "600",
    color: "#2c3e50",
  },
  cardDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardAddress: {
    fontSize: 13,
    color: "#7f8c8d",
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    color: "#7f8c8d",
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

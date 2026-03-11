import { useAppDispatch, useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
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
type Booking = any;

export default function ClientScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [clientData, setclientData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

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

  console.log("userData.assignedBarangays : >> ", userData?.assignedBarangays);

   console.log("store city: >> ", userData?.storeCity);
   console.log("store id: >> ", userData?.id);
  useEffect(() => {
    if (isFocused) {
      if (userData !== null) {
        const fetchclientData = async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await axiosInstance(userData.token).get(
              `/api/riderTransaction/clientBookings?hubCity=${userData?.storeCity}&riderId=${userData?.id}$groupArea=${userData?.assignedBarangays}`,
            );
            
            setclientData(response.data.result);
          } catch (err: any) {
            console.error("Failed to load client clientData:", err);
            setError(err?.message ?? "Failed to load clientData");
          } finally {
            setLoading(false);
          }
        };

        fetchclientData();
      }
    }
  }, [userData, isFocused]);

  const handlePress = (item: Booking) => {
    router.push({
      pathname: "/bookings/components/clientComponents/clientPickupaddresses",
      params: {
        clientData: JSON.stringify(item),
      },
    });
  };

  const renderItem = ({ item }: { item: Booking }) => {
    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardIconContainer}>
          <Ionicons name="business" size={22} color="#22c55e" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.clientName}</Text>
          <View style={styles.cardDetailRow}>
            <Ionicons name="location-outline" size={14} color="#7f8c8d" />
            <Text style={styles.cardAddress} numberOfLines={2}>
              {item.address}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#22c55e" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Client Bookings</Text>
          <Text style={styles.subtitle}>Pickup orders from clients</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#e74c3c" />
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={clientData}
          keyExtractor={(item, idx) =>
            String(item?.id ?? item?.bookingId ?? idx)
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={48} color="#bdc3c7" />
              <Text style={styles.emptyText}>No bookings available</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: 13,
    color: "#7f8c8d",
    marginTop: 2,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#7f8c8d",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#e74c3c",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
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

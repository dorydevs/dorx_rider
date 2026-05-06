import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  ChevronRight,
  FolderOpen,
  MapPin,
  TriangleAlert,
} from "lucide-react-native";
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
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [remittanceCheckerData, setRemittanceCheckerData] =
    useState<boolean>(false);

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
            const soRemittanceChecker = await axiosInstance(userData.token).get(
              `/api/so_remittance_checker?soId=${userData?.storeId}`,
            );

            let hasDateDeliveredNotToday = false;
            console.log("NATAWAG");
            if (soRemittanceChecker.data.toRemitData.length !== 0) {
              const today = new Date();
              hasDateDeliveredNotToday =
                soRemittanceChecker.data.toRemitData.some((item: any) => {
                  if (!item?.dateDelivered) return false;
                  const deliveredDate = new Date(item.dateDelivered);

                  return deliveredDate.toDateString() !== today.toDateString();
                });
            }
            console.log("NATAWAG 02");

            // Paki balik sa true
            if (hasDateDeliveredNotToday) {
              setRemittanceCheckerData(false);
            } else {
              const response = await axiosInstance(userData.token).get(
                `/api/riderTransaction/clientBookings?province=${userData?.storeProvince}&hubCity=${userData?.storeCity}&riderId=${userData?.id}$groupArea=${JSON.stringify(userData?.assignedBarangays)}&accountType=${userData.accountType}`,
              );
              console.log("clientBookings response:", response.data);
              setRemittanceCheckerData(false);
              setclientData(response.data.result);
            }
            setLoading(false);
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
        style={[styles.card, { maxWidth: Math.min(760, width - 32) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardIconContainer}>
          <Building2 size={22} color="#22c55e" strokeWidth={2} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.clientName}
          </Text>
          <View style={styles.cardDetailRow}>
            <MapPin size={12} color="#94a3b8" strokeWidth={2} />
            <Text style={styles.cardAddress} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        </View>
        <View style={styles.chevron}>
          <ChevronRight size={16} color="#22c55e" strokeWidth={2.5} />
        </View>
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
          <ArrowLeft size={20} color="#22c55e" strokeWidth={2.5} />
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
          <AlertCircle size={48} color="#ef4444" strokeWidth={1.5} />
          <Text style={styles.errorText}>Something went wrong</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      ) : remittanceCheckerData ? (
        <View style={styles.remittanceContainer}>
          <View style={styles.remittanceCard}>
            <View style={styles.remittanceIconCircle}>
              <TriangleAlert size={32} color="#ef4444" strokeWidth={1.8} />
            </View>
            <Text style={styles.remittanceTitle}>Remittance Required</Text>
            <Text style={styles.remittanceMessage}>
              Remittance balance must be remitted before you can access client
              bookings.
            </Text>
            <Text style={styles.remittanceSupport}>
              Please contact your Satellite Operator.
            </Text>
          </View>
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
              <FolderOpen size={52} color="#cbd5e1" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No bookings available</Text>
              <Text style={styles.emptySubtext}>
                Bookings will appear here when assigned
              </Text>
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
    backgroundColor: "#f1f5f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#5a8a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#4a7a14",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
    color: "#1e293b",
  },
  cardDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardAddress: {
    fontSize: 12,
    color: "#94a3b8",
    flex: 1,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 10,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
  },
  errorSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  remittanceContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  remittanceCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    gap: 8,
  },
  remittanceIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  remittanceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ef4444",
  },
  remittanceMessage: {
    fontSize: 14,
    textAlign: "center",
    color: "#64748b",
    lineHeight: 20,
  },
  remittanceSupport: {
    fontSize: 13,
    textAlign: "center",
    color: "#94a3b8",
    fontStyle: "italic",
  },
});

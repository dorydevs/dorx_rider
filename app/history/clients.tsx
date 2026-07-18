import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

type clientHistoryData = any;
type PickupSection = "hub" | "clients";
type PickupFilter = "all" | "picked-up" | "dropped-off";

const FILTERS: { key: PickupFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "picked-up", label: "Picked up" },
  { key: "dropped-off", label: "Dropped off" },
];

export default function clientHistoryt() {
  const { width } = useWindowDimensions();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();
  const [data, setData] = useState<clientHistoryData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<PickupSection>("clients");
  const [activeFilter, setActiveFilter] = useState<PickupFilter>("all");

  const handlePress = (item: clientHistoryData) => {
    router.push({
      pathname: "/history/components/clientHistory",
      params: {
        clientData: JSON.stringify(item),
        filter: activeFilter,
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
          <Ionicons name="business" size={22} color="#00BF63" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.clientName}</Text>
          <View style={styles.cardDetailRow}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={styles.cardAddress}>{item.address}</Text>
          </View>
          <View style={styles.cardDetailRow}>
            <Ionicons name="cube-outline" size={14} color="#64748B" />
            <Text style={styles.cardCount}>
              {item.totalPickedUp} {item.totalPickedUp === 1 ? 'parcel' : 'parcels'} picked up
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
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
        `/api/riderTransaction/pickedupCountsPerClient?riderId=${userData.id}`
      );
      setData(data);
      setDataLoading(false);
    };
    if (userData !== null) {
      handleData();
    }
  }, [userData]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#00D673", "#00BF63", "#00994F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerSection}
      >
        <View pointerEvents="none" style={styles.decorCircleLarge} />
        <View pointerEvents="none" style={styles.decorCircleSmall} />

        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Picked-up</Text>
            <Text style={styles.headerSubtitle}>
              Your pickup history from hub and clients
            </Text>
          </View>
          {data.length > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{data.length}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.sectionTabs}>
        {(["clients", "hub"] as PickupSection[]).map((section) => (
          <TouchableOpacity
            key={section}
            style={[
              styles.sectionTab,
              activeSection === section && styles.sectionTabActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setActiveSection(section)}
          >
            <Text
              style={[
                styles.sectionTabText,
                activeSection === section && styles.sectionTabTextActive,
              ]}
            >
              {section === "hub" ? "Pick up in Hub" : "Pick up in Clients"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilter === filter.key && styles.filterChipActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setActiveFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === filter.key && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeSection === "hub" ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>Hub pickup history coming soon</Text>
          <Text style={styles.emptySubtext}>
            Parcels you pick up from the hub will appear here.
          </Text>
        </View>
      ) : dataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BF63" />
          <Text style={styles.loadingText}>Loading clients...</Text>
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
              <Ionicons name="business-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No clients found</Text>
              <Text style={styles.emptySubtext}>Clients will appear here once you start picking up parcels</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerSection: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#00BF63",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  decorCircleLarge: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    top: -70,
    right: -50,
  },
  decorCircleSmall: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    bottom: -30,
    left: -20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
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
  sectionTabs: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 16,
    gap: 4,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  sectionTabActive: {
    backgroundColor: "#00BF63",
    shadowColor: "#00BF63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  sectionTabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: "#00BF6315",
    borderColor: "#00BF63",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#00BF63",
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
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00BF6315",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
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
    color: "#64748B",
    fontWeight: "500",
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
    color: "#64748B",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 20,
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

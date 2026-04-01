import { useAppSelector } from "@/store/hooks";
import socket from "@/utils/socket";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const cards = [
  {
    id: 1,
    title: "Client",
    description: "Pickup orders from clients",
    icon: "business",
    color: "#22c55e",
    route: "/bookings/client",
  },
  {
    id: 2,
    title: "Hub",
    description: "Pickup orders from Hub",
    icon: "home",
    color: "#22c55e",
    route: "/bookings/hub",
  },
  {
    id: 3,
    title: "Customers",
    description: "Deliver orders to customers",
    icon: "people",
    color: "#22c55e",
    route: "/bookings/customers",
  },
  {
    id: 4,
    title: "RTS/Hub (scanner)",
    description: "Received RTS from Hub",
    icon: "scan",
    color: "#e67e22",
    route: "/bookings/rtsFromHub",
  },
  {
    id: 5,
    title: "RTS/Incoming (scanner)",
    description: "Incoming RTS from Customers",
    icon: "arrow-down-circle",
    color: "#f39c12",
    route: "/bookings/rts-incoming",
  },
  {
    id: 6,
    title: "RTS/Return (scanner)",
    description: "Return RTS items to clients",
    icon: "arrow-undo-circle",
    color: "#e74c3c",
    route: "/bookings/rts-return",
  },
] as const;

export default function BookingsScreen() {
  const router = useRouter();
  const [badgeCount, setBadgeCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userData, setUserData] = useState("");
  const user = useAppSelector((state: any) => state.user.user);

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
        console.log("SUCCESS");
      }
    };

    loadUserData();
  }, [user]);

  // badge count only no card opop-up message
  useEffect(() => {
    if (!userData) return;

    const riderId = userData.id;

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", () => {
      socket.emit("join_groupArea_room", { groupAreaId: riderId });
    });

    if (socket.connected) {
      socket.emit("join_groupArea_room", { groupAreaId: riderId });
    }

    socket.on("new_parcel", (parcel) => {
      setBadgeCount((prev) => prev + 1);
    });

    const handleNewParcel = (parcel: any) => {
      setBadgeCount((prev) => prev + 1);
    };

    socket.on("new_parcel", handleNewParcel);

    return () => {
      socket.off("connect");
      socket.off("new_parcel", handleNewParcel);
    };
  }, [userData]);

  const handleCardPress = (card: (typeof cards)[number]) => {
    if (card.id === 1) setBadgeCount(0);
    router.push(card.route as any);
  };

  return (
    <View style={styles.container}>
      {/* Toast Notification
      {toastVisible && (
        <View style={styles.toast}>
          <Ionicons name="notifications" size={18} color="#fff" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )} */}

      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="clipboard" size={24} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Bookings</Text>
            <Text style={styles.headerSubtitle}>
              Manage pickups and deliveries
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.cardsContainer}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={styles.card}
            onPress={() => handleCardPress(card)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.cardIconContainer,
                { backgroundColor: card.color + "20" },
              ]}
            >
              <Ionicons name={card.icon as any} size={24} color={card.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </View>

            {card.id === 1 && badgeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeCount}</Text>
              </View>
            )}

            <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  headerSection: {
    backgroundColor: "#22c55e",
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
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
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#d1fae5",
    marginTop: 2,
  },
  cardsContainer: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: "#7f8c8d",
  },
  // ✅ new styles
  toast: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    flex: 1,
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});

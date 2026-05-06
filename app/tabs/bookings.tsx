import { useAppSelector } from "@/store/hooks";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowDownCircle,
  Home,
  Package,
  ScanLine,
  Undo2,
  Users,
} from "lucide-react-native";
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
    LucideIcon: Package,
    color: "#22c55e",
    bg: "#dcfce7",
    route: "/bookings/client",
  },
  {
    id: 2,
    title: "Hub",
    description: "Pickup orders from Hub",
    LucideIcon: Home,
    color: "#3b82f6",
    bg: "#dbeafe",
    route: "/bookings/hub",
  },
  {
    id: 3,
    title: "Customers",
    description: "Deliver orders to customers",
    LucideIcon: Users,
    color: "#8b5cf6",
    bg: "#ede9fe",
    route: "/bookings/customers",
  },
  {
    id: 4,
    title: "RTS / Hub",
    description: "Received RTS from Hub",
    LucideIcon: ScanLine,
    color: "#e67e22",
    bg: "#fef3c7",
    route: "/bookings/rtsFromHub",
  },
  {
    id: 5,
    title: "RTS / Incoming",
    description: "Incoming RTS from Customers",
    LucideIcon: ArrowDownCircle,
    color: "#f39c12",
    bg: "#fef9c3",
    route: "/bookings/rts-incoming",
  },
  {
    id: 6,
    title: "RTS / Return",
    description: "Return RTS items to clients",
    LucideIcon: Undo2,
    color: "#e74c3c",
    bg: "#fee2e2",
    route: "/bookings/rts-return",
  },
] as const;

export default function BookingsScreen() {
  const router = useRouter();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) setUserData(JSON.parse(storedUser));
        else if (user) setUserData(user);
      } catch {}
    };
    loadUserData();
  }, [user]);

  const handleCardPress = (card: (typeof cards)[number]) => {
    router.push(card.route as any);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingText}>{greeting()},</Text>
            <Text style={styles.headerTitle}>
              {userData?.name || "Rider"} 👋
            </Text>
          </View>
          <View style={styles.headerIconContainer}>
            <Ionicons name="bicycle" size={28} color="#fff" />
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          What would you like to do today?
        </Text>
      </View>

      <ScrollView
        style={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Operations</Text>
        {cards.slice(0, 3).map((card) => {
          const LucideIcon = card.LucideIcon;
          return (
            <TouchableOpacity
              key={card.id}
              style={styles.card}
              onPress={() => handleCardPress(card)}
              activeOpacity={0.75}
            >
              <View
                style={[styles.cardIconContainer, { backgroundColor: card.bg }]}
              >
                <LucideIcon size={22} color={card.color} strokeWidth={2} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
              <View style={[styles.chevronBadge, { backgroundColor: card.bg }]}>
                <Ionicons name="chevron-forward" size={16} color={card.color} />
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
          RTS Scanning
        </Text>
        {cards.slice(3).map((card) => {
          const LucideIcon = card.LucideIcon;
          return (
            <TouchableOpacity
              key={card.id}
              style={styles.card}
              onPress={() => handleCardPress(card)}
              activeOpacity={0.75}
            >
              <View
                style={[styles.cardIconContainer, { backgroundColor: card.bg }]}
              >
                <LucideIcon size={22} color={card.color} strokeWidth={2} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
              <View style={[styles.chevronBadge, { backgroundColor: card.bg }]}>
                <Ionicons name="chevron-forward" size={16} color={card.color} />
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  headerSection: {
    backgroundColor: "#22c55e",
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 14,
    color: "#d1fae5",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#bbf7d0",
    fontWeight: "400",
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    padding: 16,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  cardDescription: {
    fontSize: 12,
    color: "#94a3b8",
  },
  chevronBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});

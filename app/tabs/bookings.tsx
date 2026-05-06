import { useAppSelector } from "@/store/hooks";
import socket from "@/utils/socket";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowDownCircle,
  ArrowLeftCircle,
  Building2,
  ChevronRight,
  Home,
  Package,
  RotateCcw,
  ScanLine,
  Truck,
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

const categories = [
  {
    id: "pickup",
    label: "Pickup",
    Icon: Package,
    color: "#22c55e",
    cards: [
      {
        id: 1,
        title: "Client",
        description: "Pickup orders from clients",
        Icon: Building2,
        color: "#22c55e",
        bg: "#f0fdf4",
        route: "/bookings/client",
        hasBadge: true,
      },
      {
        id: 2,
        title: "Hub",
        description: "Pickup orders from Hub",
        Icon: Home,
        color: "#3b82f6",
        bg: "#eff6ff",
        route: "/bookings/hub",
        hasBadge: false,
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    Icon: Truck,
    color: "#8b5cf6",
    cards: [
      {
        id: 3,
        title: "Customers",
        description: "Deliver orders to customers",
        Icon: Users,
        color: "#8b5cf6",
        bg: "#f5f3ff",
        route: "/bookings/customers",
        hasBadge: false,
      },
    ],
  },
  {
    id: "rts",
    label: "Return to Sender",
    Icon: RotateCcw,
    color: "#f97316",
    cards: [
      {
        id: 4,
        title: "RTS / Hub",
        description: "Received RTS from Hub",
        Icon: ScanLine,
        color: "#f59e0b",
        bg: "#fffbeb",
        route: "/bookings/rtsFromHub",
        hasBadge: false,
      },
      {
        id: 5,
        title: "RTS / Incoming",
        description: "Incoming RTS from Customers",
        Icon: ArrowDownCircle,
        color: "#f97316",
        bg: "#fff7ed",
        route: "/bookings/rts-incoming",
        hasBadge: false,
      },
      {
        id: 6,
        title: "RTS / Return",
        description: "Return RTS items to clients",
        Icon: ArrowLeftCircle,
        color: "#ef4444",
        bg: "#fef2f2",
        route: "/bookings/rts-return",
        hasBadge: false,
      },
    ],
  },
] as const;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string) {
  if (!name) return "R";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function BookingsScreen() {
  const router = useRouter();
  const [badgeCount, setBadgeCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const user = useAppSelector((state: any) => state.user.user);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) setUserData(JSON.parse(storedUser));
        else if (user) setUserData(user);
      } catch (e) {
        console.error("Error loading user data:", e);
      }
    };
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (!userData) return;
    const riderId = userData.id;
    if (!socket.connected) socket.connect();
    socket.on("connect", () => {
      socket.emit("join_groupArea_room", { groupAreaId: riderId });
    });
    if (socket.connected) {
      socket.emit("join_groupArea_room", { groupAreaId: riderId });
    }
    const handleNewParcel = () => setBadgeCount((prev) => prev + 1);
    socket.on("new_parcel", handleNewParcel);
    return () => {
      socket.off("connect");
      socket.off("new_parcel", handleNewParcel);
    };
  }, [userData]);

  const handleCardPress = (card: any) => {
    if (card.id === 1) setBadgeCount(0);
    router.push(card.route as any);
  };

  const name = userData?.username ?? userData?.name ?? "Rider";
  const role = userData?.operationAccountType ?? "Rider";
  const initials = getInitials(name);
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingLine}>{greeting},</Text>
            <Text style={styles.greetingName}>{name} 👋</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{role}</Text>
            </View>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Category summary pills */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Package size={14} color="#22c55e" strokeWidth={2.5} />
            <Text style={styles.summaryPillLabel}>Pickup</Text>
          </View>
          <View style={styles.summaryPill}>
            <Truck size={14} color="#8b5cf6" strokeWidth={2.5} />
            <Text style={styles.summaryPillLabel}>Delivery</Text>
          </View>
          <View style={styles.summaryPill}>
            <RotateCcw size={14} color="#f97316" strokeWidth={2.5} />
            <Text style={styles.summaryPillLabel}>Returns</Text>
          </View>
        </View>
      </View>

      {/* ── CONTENT ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((cat) => (
          <View key={cat.id} style={styles.section}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconWrap,
                  { backgroundColor: cat.color + "18" },
                ]}
              >
                <cat.Icon size={13} color={cat.color} strokeWidth={2.5} />
              </View>
              <Text style={[styles.sectionLabel, { color: cat.color }]}>
                {cat.label}
              </Text>
              <View
                style={[
                  styles.sectionRule,
                  { backgroundColor: cat.color + "30" },
                ]}
              />
            </View>

            {/* Cards */}
            {cat.cards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.card}
                onPress={() => handleCardPress(card)}
                activeOpacity={0.75}
              >
                <View
                  style={[styles.cardIconBox, { backgroundColor: card.bg }]}
                >
                  <card.Icon size={24} color={card.color} strokeWidth={2} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDesc}>{card.description}</Text>
                </View>
                {card.hasBadge && badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount}</Text>
                  </View>
                )}
                <View style={[styles.chevron, { backgroundColor: card.bg }]}>
                  <ChevronRight
                    size={15}
                    color={card.color}
                    strokeWidth={2.5}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  // Header
  header: {
    backgroundColor: "#0a0f2e",
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 6,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greetingBlock: { flex: 1 },
  greetingLine: {
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    fontWeight: "500",
  },
  greetingName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  rolePill: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
  summaryPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingVertical: 8,
  },
  summaryPillLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  // Sections
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
  section: { marginBottom: 6 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionRule: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
  },

  // Cards
  card: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    elevation: 2,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
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

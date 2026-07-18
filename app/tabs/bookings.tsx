import { DashboardHeader } from "@/components/DashboardHeader";
import { NavigationCard } from "@/components/NavigationCard";
import { SectionHeader } from "@/components/SectionHeader";
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
import { SafeAreaView } from "react-native-safe-area-context";

const cards = [
  {
    id: 1,
    title: "Client Bookings",
    description: "Pickup scheduled orders from clients",
    icon: "business",
    color: "#00BF63",
    route: "/bookings/client",
    direction: "incoming",
    group: "client",
  },
  {
    id: 2,
    title: "Hub Scanner",
    description: "Scan and pick up orders from the hub",
    icon: "home",
    color: "#00BF63",
    route: "/bookings/hub",
    direction: "incoming",
    group: "hub",
  },
  {
    id: 3,
    title: "Customer Delivery",
    description: "Scan orders for delivery to customers",
    icon: "people",
    color: "#00BF63",
    route: "/bookings/customers",
    direction: "outgoing",
    group: "customer",
  },
  {
    id: 4,
    title: "RTS from Hub",
    description: "Scan return-to-sender items received from the hub",
    icon: "scan",
    color: "#F59E0B",
    route: "/bookings/rtsFromHub",
    direction: "incoming",
    group: "rts",
  },
  {
    id: 5,
    title: "RTS Incoming",
    description: "Scan return-to-sender items handed back by customers",
    icon: "arrow-down-circle",
    color: "#F59E0B",
    route: "/bookings/rts-incoming",
    direction: "incoming",
    group: "rts",
  },
  {
    id: 6,
    title: "RTS Return",
    description: "Return scanned RTS items back to clients",
    icon: "arrow-undo-circle",
    color: "#EF4444",
    route: "/bookings/rts-return",
    direction: "outgoing",
    group: "rts",
  },
] as const;

type Direction = "incoming" | "outgoing";

const directionMeta: Record<
  Direction,
  { label: string; accent: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  incoming: { label: "Incoming", accent: "#00BF63", icon: "arrow-down-circle" },
  outgoing: { label: "Outgoing", accent: "#059669", icon: "arrow-up-circle" },
};

const groupsByDirection: Record<
  Direction,
  { key: string; title: string; icon: keyof typeof Ionicons.glyphMap; accent: string }[]
> = {
  incoming: [
    { key: "client", title: "Incoming from Client", icon: "business", accent: "#00BF63" },
    { key: "hub", title: "Incoming from Hub", icon: "home", accent: "#00BF63" },
    { key: "rts", title: "Incoming RTS", icon: "return-down-back", accent: "#F59E0B" },
  ],
  outgoing: [
    { key: "customer", title: "Outgoing for Customer", icon: "people", accent: "#00BF63" },
    { key: "rts", title: "Outgoing for RTS", icon: "return-down-back", accent: "#F59E0B" },
  ],
};

export default function BookingsScreen() {
  const router = useRouter();
  const [activeDirection, setActiveDirection] = useState<Direction>("incoming");
  const [badgeCount, setBadgeCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [userData, setUserData] = useState<any>(null);
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

  const roleLabel =
    userData?.accountType === 1 ? "Hub Rider" : "Store Rider";
  const locationLabel =
    [userData?.storeCity, userData?.storeProvince].filter(Boolean).join(", ") ||
    "Location not set";

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DashboardHeader
          eyebrow="BOOKINGS"
          username={userData?.name || "Rider"}
          role={roleLabel}
          location={locationLabel}
        />

        <View style={styles.container}>
          {badgeCount > 0 && (
            <View style={styles.statCardWrapper}>
              <View style={styles.statCard}>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>New Pickups</Text>
                  <Text style={styles.statValue}>{badgeCount}</Text>
                </View>
                <View style={styles.statIconContainer}>
                  <Ionicons name="cube" size={22} color="#00BF63" />
                </View>
              </View>
            </View>
          )}

          <View style={styles.tabSwitcher}>
            {(["incoming", "outgoing"] as Direction[]).map((direction) => {
              const meta = directionMeta[direction];
              const isActive = activeDirection === direction;
              return (
                <TouchableOpacity
                  key={direction}
                  style={[
                    styles.tabButton,
                    isActive && {
                      backgroundColor: meta.accent,
                      shadowColor: meta.accent,
                    },
                    isActive && styles.tabButtonActiveShadow,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setActiveDirection(direction)}
                >
                  <Ionicons
                    name={meta.icon}
                    size={16}
                    color={isActive ? "#fff" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      isActive && styles.tabButtonTextActive,
                    ]}
                  >
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionHeaderWrapper}>
            <SectionHeader
              title={directionMeta[activeDirection].label}
              accentColor={directionMeta[activeDirection].accent}
              icon={
                <Ionicons
                  name={directionMeta[activeDirection].icon}
                  size={18}
                  color={directionMeta[activeDirection].accent}
                />
              }
            />
          </View>

          {groupsByDirection[activeDirection].map((group) => {
            const groupCards = cards.filter(
              (card) =>
                card.direction === activeDirection && card.group === group.key,
            );
            if (groupCards.length === 0) return null;

            return (
              <View key={group.key} style={styles.groupBlock}>
                <View style={styles.groupHeaderRow}>
                  <View
                    style={[
                      styles.groupIconChip,
                      { backgroundColor: `${group.accent}15` },
                    ]}
                  >
                    <Ionicons name={group.icon} size={13} color={group.accent} />
                  </View>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  {groupCards.length > 1 && (
                    <Text style={styles.groupCount}>
                      {groupCards.length} options
                    </Text>
                  )}
                </View>

                <View style={styles.row}>
                  {groupCards.map((card) => (
                    <NavigationCard
                      key={card.id}
                      title={card.title}
                      subtitle={card.description}
                      accentColor={card.color}
                      icon={
                        <Ionicons
                          name={card.icon as any}
                          size={22}
                          color={card.color}
                        />
                      }
                      badge={card.id === 1 ? badgeCount : undefined}
                      onPress={() => handleCardPress(card)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionHeaderWrapper: {
    marginHorizontal: 12,
  },
  statCardWrapper: {
    marginHorizontal: 12,
    marginBottom: 16,
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#00BF6315",
    justifyContent: "center",
    alignItems: "center",
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 12,
    marginBottom: 16,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabButtonActiveShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  groupBlock: {
    marginBottom: 18,
  },
  groupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  groupIconChip: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  groupCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },
  row: {
    flexDirection: "row",
    marginHorizontal: 12,
    gap: 12,
  },
});

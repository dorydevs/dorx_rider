import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

  const handleCardPress = (card: (typeof cards)[number]) => {
    router.push(card.route as any);
  };

  return (
    <View style={styles.container}>
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
            <View style={[styles.cardIconContainer, { backgroundColor: card.color + '20' }]}>
              <Ionicons
                name={card.icon as any}
                size={24}
                color={card.color}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </View>
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
});

import FontAwesome from "@expo/vector-icons/FontAwesome";
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
    icon: "user",
    color: "#50a3fc",
    route: "/bookings/client",
  },
  {
    id: 2,
    title: "Hub",
    description: "Pickup orders from Hub",
    icon: "home",
    color: "#3f6e6c",
    route: "/bookings/hub",
  },
  {
    id: 3,
    title: "Customers",
    description: "Deliver orders to customers",
    icon: "users",
    color: "#53e477",
    route: "/bookings/customers",
  },
  {
    id: 4,
    title: "RTS/Hub (scanner)",
    description: "Received RTS from Hub",
    icon: "home",
    color: "#ff5e00",
    route: "/bookings/rtsFromHub",
  },
  {
    id: 4,
    title: "RTS/Incoming (scanner)",
    description: "Incoming RTS from Customers",
    icon: "barcode",
    color: "#FF9500",
    route: "/bookings/rts-incoming",
  },
  {
    id: 5,
    title: "RTS/Return (scanner)",
    description: "Return RTS items to clients",
    icon: "reply",
    color: "#FF3B30",
    route: "/bookings/rts-return",
  },
];

export default function BookingsScreen() {
  const router = useRouter();

  const handleCardPress = (card: (typeof cards)[0]) => {
    router.push(card.route);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.cardsContainer}>
        {cards.map((card) => (
          <View style={{ marginBottom: 10 }}>
            <TouchableOpacity
              key={card.id}
              style={[styles.card, { borderLeftColor: card.color }]}
              onPress={() => handleCardPress(card)}
              activeOpacity={0.7}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 20 }}
              >
                <FontAwesome
                  name={card.icon as any}
                  size={22}
                  color={card.color}
                  style={styles.icon}
                />
                <View>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardDescription}>{card.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  cardsContainer: {
    flex: 1,
    marginTop: 35,
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
    elevation: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
    marginTop: 5,
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
});

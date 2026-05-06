import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Building2, ChevronRight, Users } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HistoryScreen() {
  const router = useRouter();
  const handlePress = (type: "clients" | "customers") => {
    if (type === "clients") {
      router.push({
        pathname: "/history/clients",
      });
    } else if (type === "customers") {
      router.push({
        pathname: "/history/customers",
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="time" size={26} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>History</Text>
            <Text style={styles.headerSubtitle}>Your transaction records</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        {/* Clients Card */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => handlePress("clients")}
        >
          <View
            style={[styles.cardIconContainer, { backgroundColor: "#dbeafe" }]}
          >
            <Building2 size={28} color="#3b82f6" strokeWidth={1.8} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Clients</Text>
            <Text style={styles.cardDesc}>
              View pickup history from clients
            </Text>
          </View>
          <View style={styles.chevron}>
            <ChevronRight size={20} color="#3b82f6" strokeWidth={2.5} />
          </View>
        </Pressable>

        {/* Customers Card */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => handlePress("customers")}
        >
          <View
            style={[styles.cardIconContainer, { backgroundColor: "#ede9fe" }]}
          >
            <Users size={28} color="#8b5cf6" strokeWidth={1.8} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Customers</Text>
            <Text style={styles.cardDesc}>
              View delivery history to customers
            </Text>
          </View>
          <View style={styles.chevron}>
            <ChevronRight size={20} color="#8b5cf6" strokeWidth={2.5} />
          </View>
        </Pressable>
      </View>
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#bbf7d0",
    marginTop: 2,
  },
  cardsContainer: {
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  cardIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: "#94a3b8",
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
});

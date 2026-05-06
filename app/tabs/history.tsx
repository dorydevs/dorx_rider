import { useRouter } from "expo-router";
import { Building2, ChevronRight, Clock, Users } from "lucide-react-native";
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
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Clock size={24} color="#fff" strokeWidth={2} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>History</Text>
            <Text style={styles.headerSubtitle}>
              Your transaction and activity history
            </Text>
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
            style={[styles.cardIconContainer, { backgroundColor: "#f0fdf4" }]}
          >
            <Building2 size={28} color="#22c55e" strokeWidth={2} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Clients</Text>
            <Text style={styles.cardDesc}>
              View transaction history from clients
            </Text>
          </View>
          <View style={styles.chevron}>
            <ChevronRight size={16} color="#22c55e" strokeWidth={2.5} />
          </View>
        </Pressable>

        {/* Customers Card */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => handlePress("customers")}
        >
          <View
            style={[styles.cardIconContainer, { backgroundColor: "#f5f3ff" }]}
          >
            <Users size={28} color="#8b5cf6" strokeWidth={2} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Customers</Text>
            <Text style={styles.cardDesc}>
              View transaction history from customers
            </Text>
          </View>
          <View style={styles.chevron}>
            <ChevronRight size={16} color="#22c55e" strokeWidth={2.5} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafb",
  },
  headerSection: {
    backgroundColor: "#0a0f2e",
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    backgroundColor: "rgba(255, 255, 255, 0.22)",
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
    color: "rgba(255,255,255,0.78)",
    marginTop: 3,
    fontWeight: "500",
  },
  cardsContainer: {
    padding: 16,
    paddingTop: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
});

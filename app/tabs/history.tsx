import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
            <Ionicons name="time" size={24} color="#fff" />
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
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={() => handlePress("clients")}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="business" size={32} color="#22c55e" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Clients</Text>
            <Text style={styles.cardDesc}>
              View transaction history from clients
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
        </Pressable>

        {/* Customers Card */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={() => handlePress("customers")}
        >
          <View style={styles.cardIconContainer}>
            <Ionicons name="people" size={32} color="#22c55e" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Customers</Text>
            <Text style={styles.cardDesc}>
              View transaction history from customers
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#bdc3c7" />
        </Pressable>
      </View>
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
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: "#7f8c8d",
    lineHeight: 20,
  },
});

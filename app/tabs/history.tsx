import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function HistoryScreen() {
  const router = useRouter();
  const handlePress = (type: "clients" | "customers") => {
    console.log(`${type} card pressed`);
    // you can navigate here later
    // router.push(...)
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
      <Text style={styles.title}>History</Text>
      <Text style={styles.description}>
        Your transaction and activity history
      </Text>

      <View style={styles.cardsContainer}>
        {/* Card 1 */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => handlePress("clients")}
        >
          <Text style={styles.cardTitle}>Clients</Text>
          <Text style={styles.cardDesc}>Transaction History From Clients</Text>
        </Pressable>

        {/* Card 2 */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => handlePress("customers")}
        >
          <Text style={styles.cardTitle}>Customers</Text>
          <Text style={styles.cardDesc}>
            Transaction History From Customers
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 35,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    opacity: 0.7,
  },
});

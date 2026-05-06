import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MapPin } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
// import { useParams } from "react-router-dom";
type ClientData = any;
export default function ClientScreen() {
  const router = useRouter();
  const { clientData } = useLocalSearchParams();
  const client: ClientData = clientData
    ? JSON.parse(clientData as string)
    : null;
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const [availableClients, setAvailableClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClientData, setLoadingClientData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const user = useAppSelector((state: any) => state.user.user);

  const restructuredClientData = [client];
  useEffect(() => {
    const handleAvailableClients = async () => {
      try {
        if (userData !== null) {
          setLoadingClientData(true);
          const response = await axiosInstance(userData.token).get(
            `/api/operationAccount/hub/ordersForHubPickup?clientId=${client?.clientId}`,
          );

          setAvailableClients(response.data.result);
          setLoadingClientData(false);
        }
      } catch (error) {
        setLoadingClientData(false);
        console.log("ERROR handleAvailableClients : >> ", error);
      }
    };
    if (isFocused) {
      if (userData !== null) {
        handleAvailableClients();
      }
    }
  }, [userData, isFocused]);

  const handlePress = (item: ClientData) => {
    router.push({
      pathname:
        "/bookings/components/clientComponents/clientListScheduledToPickUp",
      params: {
        clientData: JSON.stringify(item),
        pickupAddressId: JSON.stringify(availableClients[0].pickupAddressId),
      },
    });
  };

  const renderItem = ({ item }: { item: ClientData }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.cardIconWrap}>
          <MapPin size={22} color="#5a8a1a" strokeWidth={2.5} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.clientName}</Text>
          <Text style={styles.cardAddress} numberOfLines={2}>
            {item.address}
          </Text>
          <Text style={styles.cardTotal}>
            {client.total} {client.total === 1 ? "Item" : "Items"} to pick up
          </Text>
        </View>
        <View style={styles.cardChevron}>
          <FontAwesome name="chevron-right" size={14} color="#5a8a1a" />
        </View>
      </TouchableOpacity>
    );
  };

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
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="chevron-left" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Client Pick Up Addresses</Text>
        </View>
      </View>

      {loadingClientData ? (
        <View style={{ padding: 20 }}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : error ? (
        <View>
          <Text style={{ color: "red" }}>
            Something went wrong while trying to display data
          </Text>
        </View>
      ) : (
        <FlatList
          data={restructuredClientData}
          keyExtractor={(item, idx) =>
            String(item?.id ?? item?.ClientDataId ?? idx)
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#5a8a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#4a7a14",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTextContainer: { flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    gap: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    borderLeftWidth: 5,
    borderLeftColor: "#5a8a1a",
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  cardAddress: { fontSize: 13, color: "#64748b", lineHeight: 18 },
  cardTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5a8a1a",
    marginTop: 4,
    backgroundColor: "#f0fdf4",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardChevron: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: { padding: 16, paddingBottom: 32 },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 30,
  },
  content: {
    marginTop: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    opacity: 0.8,
  },
});

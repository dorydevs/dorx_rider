import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
            `/api/operationAccount/hub/ordersForHubPickup?clientId=${client?.clientId}`
          );

          setAvailableClients(response.data.result);
          setLoadingClientData(false);
        }
      } catch (error) {
        setLoadingClientData(false);
        console.log("ERROR handleAvailableClients : >> ", error);
      }
    };
    if (userData !== null) {
      handleAvailableClients();
    }
  }, [userData]);

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
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16 }}>{item.clientName}</Text>
            <Text style={{ opacity: 0.5, fontSize: 13 }} numberOfLines={2}>
              {item.address}
            </Text>
          </View>
          <View>
            <Text style={{ opacity: 0.5, fontSize: 13 }}>
              Total : {client.total}
            </Text>
          </View>
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
      <View
        style={{ flexDirection: "row", alignItems: "center", paddingTop: 25 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="chevron-left" size={24} color="#007AFF" />
        </TouchableOpacity>

        <Text style={styles.title}>Client Pick Up Addresses</Text>
      </View>

      <View>
        <View
          style={{
            padding: 20,
            marginTop: 20,
            borderRadius: 12,
            backgroundColor: "#294983",
            elevation: 2,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <View>
            <Text style={{ fontSize: 18, color: "white", fontWeight: "bold" }}>
              Client
            </Text>
            <Text style={{ fontSize: 16, color: "white" }}>
              {client.clientName}
            </Text>
            <Text style={{ fontSize: 13, opacity: 0.5, color: "white" }}>
              {client.address}
            </Text>
          </View>

          <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 30, color: "white", marginBottom: -15 }}>
              {client.total}
            </Text>
          </View>
        </View>
      </View>

      {loadingClientData ? (
        <View style={{ padding: 20 }}>
          <ActivityIndicator size="large" />
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
          contentContainerStyle={{ paddingVertical: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginRight: -10,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",

    color: "#50a3fc",
  },
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

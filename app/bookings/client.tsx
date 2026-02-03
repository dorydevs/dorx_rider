import { useAppDispatch, useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
type Booking = any;

export default function ClientScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [clientData, setclientData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);

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

  useEffect(() => {
    if (isFocused) {
      if (userData !== null) {
        const fetchclientData = async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await axiosInstance(userData.token).get(
              `/api/riderTransaction/clientBookings?hubCity=${userData?.storeCity}&riderId=${userData?.id}`,
            );
            console.log(">>>>>>>>> ", response.data.result);
            setclientData(response.data.result);
          } catch (err: any) {
            console.error("Failed to load client clientData:", err);
            setError(err?.message ?? "Failed to load clientData");
          } finally {
            setLoading(false);
          }
        };

        fetchclientData();
      }
    }
  }, [userData, isFocused]);

  const handlePress = (item: Booking) => {
    router.push({
      pathname: "/bookings/components/clientComponents/clientPickupaddresses",
      params: {
        clientData: JSON.stringify(item),
      },
    });
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const title = item?.customerName ?? item?.name ?? item?.id ?? "Booking";
    const subtitle =
      item?.pickupAddress ?? item?.address ?? item?.pickup_location ?? "";

    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16 }}>{item.clientName}</Text>

          <Text style={{ opacity: 0.5, fontSize: 13 }} numberOfLines={2}>
            {item.address}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

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

        <Text style={styles.title}>Client</Text>
      </View>

      {loading ? (
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
          data={clientData}
          keyExtractor={(item, idx) =>
            String(item?.id ?? item?.bookingId ?? idx)
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
    padding: 20,
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
    fontSize: 28,
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

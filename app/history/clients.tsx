import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
type clientHistoryData = any;
export default function clientHistoryt() {
  const { width } = useWindowDimensions();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();
  const [data, setData] = useState<clientHistoryData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const handlePress = (item: clientHistoryData) => {
    router.push({
      pathname: "/history/components/clientHistory",
      params: {
        clientData: JSON.stringify(item),
      },
    });
  };

  const renderItem = ({ item }: { item: clientHistoryData }) => {
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
          <Text style={{ fontSize: 15 }}>{item.clientName}</Text>
          <Text style={{ opacity: 0.5 }}>{item.address}</Text>
          <Text style={{ opacity: 0.5 }}>
            Total scanned : {item.totalPickedUp}
          </Text>
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
        console.log("Success");
      }
    };

    loadUserData();
  }, [user]);

  useEffect(() => {
    const handleData = async () => {
      setDataLoading(true);
      const { data } = await axiosInstance(userData.token).get(
        `/api/riderTransaction/pickedupCountsPerClient?riderId=${userData.id}`
      );
      console.log("CLIENTS : >> ", data);
      setData(data);
      setDataLoading(false);
    };
    if (userData !== null) {
      handleData();
    }
  }, [userData]);

  return (
    <View style={styles.container}>
      {dataLoading ? (
        <View style={{ padding: 20, marginTop: 50 }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={data.filter((d) => d.clientId !== null)}
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

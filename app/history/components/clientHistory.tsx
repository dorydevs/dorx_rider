import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
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
  const router = useRouter();
  const { width } = useWindowDimensions();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [client, setClient] = useState<clientHistoryData[]>([]);
  const [data, setData] = useState<clientHistoryData[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const { clientData } = useLocalSearchParams();
  const clientInfo: clientHistoryData = clientData
    ? JSON.parse(clientData as string)
    : null;

  const handlePress = (item: clientHistoryData) => {
    router.push({
      pathname: "/history/components/ordersPickedupByHub",
      params: {
        orderData: JSON.stringify(item),
      },
    });
  };

  const renderItem = ({ item }: { item: clientHistoryData }) => {
    console.log("item : >>> ", item);
    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15 }}>{item.pickupAddressName}</Text>
          <Text style={{ opacity: 0.5, fontSize: 13 }}>{item.address}</Text>
          <Text style={{ opacity: 0.5, fontSize: 13 }}>
            Scanned Date : {moment(item.scannedDate).format("DD-MM-YYYY")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  console.log("client : >>>>>>>> ", client);

  useEffect(() => {
    const fetchPickupAddressCounts = async () => {
      try {
        setDataLoading(true);
        const response = await axiosInstance(userData.token).get(
          `/api/riderTransaction/pickedupCountsPerPickupAddress?clientId=${clientInfo.clientId}&riderId=${userData.id}`
        );

        setData(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setDataLoading(false);
      }
    };
    if (userData !== null) {
      fetchPickupAddressCounts();
    }
  }, [userData]);

  useEffect(() => {
    const fetchClientCounts = async () => {
      try {
        setClientLoading(true);

        const response = await axiosInstance(userData.token).get(
          `/api/riderTransaction/pickedupCountsPerClient?riderId=${userData.id}&clientId=${clientInfo.clientId}`
        );

        setClient(response.data?.[0] ?? null);
      } catch (error) {
        console.error(error);
      } finally {
        setClientLoading(false);
      }
    };
    if (userData !== null) {
      fetchClientCounts();
    }
  }, [userData]);

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

  return (
    <View style={styles.container}>
      <View style={{ marginTop: 35 }}></View>
      <View>
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
              <Text
                style={{ fontSize: 18, color: "white", fontWeight: "bold" }}
              >
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
                {client.totalPickedUp}
              </Text>
            </View>
          </View>
        </View>
      </View>

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

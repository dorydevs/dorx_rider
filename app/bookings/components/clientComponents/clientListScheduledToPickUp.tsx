import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { groupBy, sortBy } from "lodash";
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
// import { useParams } from "react-router-dom";
type ClientData = any;

export default function clientScheduledToPickUp() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { clientData, pickupAddressId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ScheduledData, setScheduledData] = useState<ClientData[]>([]);

  const [userData, setUserData] = useState<any>(null);
  const user = useAppSelector((state: any) => state.user.user);
  const client: ClientData = clientData
    ? JSON.parse(clientData as string)
    : null;

  const handlePress = (item: ClientData) => {
    router.push({
      pathname:
        "/bookings/components/clientComponents/scanClientScheduledParcel",
      params: {
        clientData: JSON.stringify(client),
        clientScheduledToPickUp: JSON.stringify(item),
      },
    });
  };
  const renderItem = ({ item }: { item: ClientData }) => {
    {
      console.log(item.waybillNumber);
    }
    return (
      <TouchableOpacity
        style={[styles.card, { width: Math.min(760, width - 40) }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        <View>
          <Text style={{ fontSize: 15, marginBottom: 5 }}>
            {item.waybillNumber}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Feather name="calendar" size={15} style={{ color: "gray" }} />
            <Text style={{ fontSize: 14, opacity: 0.5 }}>
              {item.date
                ? new Date(item.date).toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })
                : ""}
            </Text>
          </View>
          <View>
            <Text style={{ opacity: 0.5, fontSize: 13 }}>
              Total Items: {item.totalItems}
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

  useEffect(() => {
    const handleScheduledToPickUp = async () => {
      try {
        if (userData !== null) {
          setLoading(true);
          const response = await axiosInstance(userData.token).get(
            `/api/orderTransactions/fetchOrdersForPickupByHub?clientId=${
              client?.clientId
            }&&pickupAddressId=${parseFloat(pickupAddressId as string)}`
          );

          const data = response.data;
          console.log(data.data);

          const forPickup = data?.orders.filter(
            (d: any) => d.orderStatus === "Scheduled for Pickup"
          );

          const schedulesGrouped = groupBy(forPickup, "scheduleForPickup");

          const schedules = Object.values(schedulesGrouped).map((d: any) => {
            return {
              date: d[0].scheduleForPickup,
              totalItems: d.length,
              pickupAddressId: d[0].pickupAddressId,
              senderCity: d[0].senderCity,
              senderBarangay: d[0].senderBarangay,
              senderProvince: d[0].senderProvince,
              waybillNumber: d[0].waybillNumber,
            };
          });

          setScheduledData(sortBy(schedules, "date"));
          setLoading(false);
        }
      } catch (error) {
        console.log("ERROR handleScheduledToPickUp : >> ", error);
        setLoading(false);
      }
    };
    if (userData !== null) {
      handleScheduledToPickUp();
    }
  }, [userData]);

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

        <Text style={styles.title}>Client Scheduled to Pick up</Text>
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
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Scheduled</Text>
      </View>
      {loading ? (
        <View style={{ padding: 20 }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={ScheduledData}
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

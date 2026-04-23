import { useAppSelector } from "@/store/hooks";
import axiosInstance from "@/utils/axiosInstance";
import socket from "@/utils/socket";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { groupBy, sortBy } from "lodash";
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

type ClientData = any;

export default function clientScheduledToPickUp() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const { clientData, pickupAddressId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ScheduledData, setScheduledData] = useState<ClientData[]>([]);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [alreadyAcceptedIds, setAlreadyAcceptedIds] = useState<Set<number>>(
    new Set(),
  );
  const [userData, setUserData] = useState<any>(null);
  const user = useAppSelector((state: any) => state.user.user);
  const client: ClientData = clientData
    ? JSON.parse(clientData as string)
    : null;

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

  const handleScheduledToPickUp = async () => {
    try {
      if (userData !== null) {
        setLoading(true);
        const response = await axiosInstance(userData.token).get(
          `/api/orderTransactions/fetchOrdersForPickupByHub?clientId=${
            client?.clientId
          }&&pickupAddressId=${parseFloat(pickupAddressId as string)}`,
        );

        const data = response.data;
        const forPickup = data?.orders.filter(
          (d: any) => d.orderStatus === "Scheduled for Pickup",
        );

        const schedulesGrouped = groupBy(forPickup, "scheduleForPickup");
        const schedules = Object.values(schedulesGrouped).map((d: any) => {
          const acceptedByRider =
            d.find((o: any) => o.acceptedBy !== null)?.acceptedBy ?? null;

          return {
            date: d[0].scheduleForPickup,
            totalItems: d.length,
            pickupAddressId: d[0].pickupAddressId,
            senderCity: d[0].senderCity,
            senderBarangay: d[0].senderBarangay,
            senderProvince: d[0].senderProvince,
            waybillNumber: d[0].waybillNumber,
            orderNumber: d[0].orderNumber,
            orderIds: d.map((o: any) => o.id ?? o.orderDetailId),
            acceptedBy: acceptedByRider,
          };
        });

        setScheduledData(sortBy(schedules, "date").reverse());
        setLoading(false);
      }
    } catch (error) {
      console.log("ERROR handleScheduledToPickUp : >> ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused && userData !== null) {
      handleScheduledToPickUp();
    }
  }, [userData, isFocused]);

  // socket listener
  useEffect(() => {
    if (!userData) return;

    socket.on("parcel_accepted", (data) => {
      setScheduledData((prev) =>
        prev.map((item) => {
          const isAffected = item.orderIds.some((id: number) =>
            data.orderIds.includes(id),
          );
          if (isAffected) {
            return { ...item, acceptedBy: data.acceptedBy };
          }
          return item;
        }),
      );
    });

    return () => socket.off("parcel_accepted");
  }, [userData]);

  const handleAccept = async (item: ClientData) => {
    setAcceptingId(item.orderIds[0]);
    console.log(">>> accepting orderIds:", item.orderIds);

    try {
      const res = await axiosInstance(userData.token).post(
        `/api/rider/accept-booking`,
        {
          orderIds: item.orderIds,
          riderId: userData.id,
          clientId: client.clientId,
        },
      );
      if (res.status === 200) {
        if (res.data?.isAccepted === true) {
          setAlreadyAcceptedIds((prev) => new Set(prev).add(item.orderIds[0]));
        } else {
          handleScheduledToPickUp();
        }
      }
    } catch (err: any) {
      console.log(">>> handleAccept ERROR status:", err?.response?.status);
      console.log(">>> handleAccept ERROR data:", err?.response?.data);
      if (err?.response?.status === 409) {
        setAlreadyAcceptedIds((prev) => new Set(prev).add(item.orderIds[0]));
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handlePress = async (item: ClientData) => {
    const isTaken =
      !!item.acceptedBy && Number(item.acceptedBy) !== Number(userData?.id);

    //block if taken by another rider
    if (isTaken) return;

    const response = await axiosInstance(userData.token).get(
      `/api/orderTransactions/fetchOrdersForPickupByHub?clientId=${
        client?.clientId
      }&&pickupAddressId=${parseFloat(
        item?.pickupAddressId,
      )}&&pickupSchedule=${moment(item?.date).format("YYYY-MM-DD")}`,
    );

    if (response.data.orders.length !== 0) {
      router.push({
        pathname: "/bookings/components/clientComponents/scanner",
        params: {
          clientData: JSON.stringify(client),
          clientScheduledToPickUpData: JSON.stringify(item),
          ScheduledData: JSON.stringify(response.data),
        },
      });
    }
  };

  const renderItem = ({ item }: { item: ClientData }) => {
    const isAccepting = acceptingId === item.orderIds?.[0];
    const isAcceptedByMe = Number(item.acceptedBy) === Number(userData?.id);
    const isTaken =
      !!item.acceptedBy && Number(item.acceptedBy) !== Number(userData?.id);
    const isAlreadyAccepted = alreadyAcceptedIds.has(item.orderIds?.[0]);
    //arrow only works if YOU accepted it
    const canNavigate = isAcceptedByMe;

    return (
      <View style={[styles.card, { width: Math.min(760, width - 40) }]}>
        {/* Top — tappable to go to scanner only if accepted by me */}
        <TouchableOpacity
          style={[styles.cardTop, !canNavigate && { opacity: 0.5 }]}
          onPress={() => handlePress(item)}
          activeOpacity={canNavigate ? 0.75 : 1}
          disabled={!canNavigate}
        >
          <View style={styles.cardInfo}>
            {/* <Text style={styles.orderNumber}>{item.orderNumber}</Text> */}
            <View style={styles.row}>
              <Feather name="calendar" size={13} color="#7f8c8d" />
              <Text style={styles.dateText}>
                {item.date
                  ? new Date(item.date).toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : ""}
              </Text>
            </View>
            <Text style={styles.totalItems}>
              Total Items: {item.totalItems}
            </Text>
          </View>
          <FontAwesome
            name="chevron-right"
            size={16}
            color={canNavigate ? "#22c55e" : "#bdc3c7"}
          />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom — accept button */}
        <View style={styles.cardBottom}>
          {isAcceptedByMe ? (
            <View style={styles.statusRow}>
              <View style={styles.dot_green} />
              <Text style={styles.statusTextGreen}>
                You accepted this pickup
              </Text>
            </View>
          ) : isTaken || isAlreadyAccepted ? (
            <View style={[styles.acceptButton, styles.acceptButtonTaken]}>
              <FontAwesome name="lock" size={14} color="#94a3b8" />
              <Text style={styles.acceptButtonTakenText}>
                Booking is already accepted
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.acceptButton,
                isAccepting && styles.acceptButtonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={isAccepting}
              onPress={() => handleAccept(item)}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome name="check-circle" size={15} color="#fff" />
                  <Text style={styles.acceptButtonText}>Accept Pickup</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
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
          <FontAwesome name="chevron-left" size={24} color="#22c55e" />
        </TouchableOpacity>
        <Text style={styles.title}>Client Scheduled to Pick up</Text>
      </View>

      <View>
        <View style={styles.clientCard}>
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
          {/* <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 30, color: "white", marginBottom: -15 }}>
              {client.total}
            </Text>
          </View> */}
        </View>
      </View>

      <View style={{ marginTop: 10 }}>
        <Text style={{ fontWeight: "bold" }}>Scheduled</Text>
      </View>

      {loading ? (
        <View style={{ padding: 20 }}>
          <ActivityIndicator size="large" color="#22c55e" />
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
  container: { flex: 1, padding: 15 },
  clientCard: {
    padding: 20,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#ffffff",
    elevation: 2,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  cardInfo: { flex: 1, gap: 4 },
  orderNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dateText: { fontSize: 13, color: "#7f8c8d" },
  totalItems: { fontSize: 13, color: "#7f8c8d" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },
  cardBottom: { paddingHorizontal: 16, paddingVertical: 12 },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    borderRadius: 10,
  },
  acceptButtonDisabled: { backgroundColor: "#86efac" },
  acceptButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  acceptButtonTaken: { backgroundColor: "#f1f5f9" },
  acceptButtonTakenText: { color: "#94a3b8", fontWeight: "600", fontSize: 14 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot_green: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
  statusTextGreen: { fontSize: 13, fontWeight: "600", color: "#16a34a" },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginRight: -10,
  },
  title: { fontSize: 15, fontWeight: "bold", color: "#22c55e" },
  subtitle: { fontSize: 16, opacity: 0.7, marginBottom: 30 },
});

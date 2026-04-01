import { store } from "@/store";
import { useAppSelector } from "@/store/hooks";
import socket from "@/utils/socket";
import { Ionicons } from "@expo/vector-icons";
import notifee, { AndroidImportance } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging, {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  requestPermission,
} from "@react-native-firebase/messaging";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Provider } from "react-redux";
import "../firebase";

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log(">>> FCM background message received!", remoteMessage);
});

async function showNotification(title: string, body: string) {
  const channelId = await notifee.createChannel({
    id: "orders",
    name: "Order Notifications",
    importance: AndroidImportance.HIGH,
    sound: "default",
  });

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      sound: "default",
      importance: AndroidImportance.HIGH,
      pressAction: { id: "default" },
    },
    ios: {
      sound: "default",
    },
  });
}

function SocketManager() {
  const [userData, setUserData] = useState<any>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const user = useAppSelector((state: any) => state.user.user);

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
      }
    };
    loadUserData();
  }, [user]);

  useEffect(() => {
    const m = getMessaging();

    requestPermission(m);

    const unsubscribeForeground = onMessage(m, async (remoteMessage) => {
      console.log(">>> FCM received in foreground!", remoteMessage);

      const title = remoteMessage.notification?.title ?? "New Notification";
      const body = remoteMessage.notification?.body ?? "";

      //show heads-up banner + sound via notifee
      await showNotification(title, body);

      //Also show in-app toast
      setToastMessage(body);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
    });

    const unsubscribeBackground = onNotificationOpenedApp(
      m,
      (remoteMessage) => {
        console.log(">>> App opened from notification!", remoteMessage);
      },
    );

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }, []);

  useEffect(() => {
    if (!userData) return;
    const riderId = userData.id;
    if (!socket.connected) socket.connect();
    socket.on("connect", () => {
      console.log(">>> socket connected!", socket.id);
      socket.emit("join_groupArea_room", { groupAreaId: riderId });
    });
    if (socket.connected) {
      socket.emit("join_groupArea_room", { groupAreaId: riderId });
    }
    socket.on("new_parcel", (parcel) => {
      console.log(">>> new_parcel received!", parcel);
    });

    const handleNewParcel = (parcel: any) => {
      console.log(">>> new_parcel received!", parcel);
    };

    socket.on("new_parcel", handleNewParcel);

    return () => {
      socket.off("connect");
      socket.off("new_parcel", handleNewParcel);
    };
  }, [userData]);

  if (!toastVisible) return null;

  return (
    <View style={styles.toast}>
      <Ionicons name="notifications" size={18} color="#fff" />
      <Text style={styles.toastText}>{toastMessage}</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SocketManager />
      <Stack screenOptions={{ headerShown: false }} />
    </Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "#22c55e",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toastText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    flex: 1,
  },
});

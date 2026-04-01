import notifee, { AndroidImportance } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";

export async function displayForegroundNotification(remoteMessage) {
  const channelId = await notifee.createChannel({
    id: "orders",
    name: "Order Notifications",
    importance: AndroidImportance.HIGH,
    sound: "default",
  });

  await notifee.displayNotification({
    title: remoteMessage.notification?.title,
    body: remoteMessage.notification?.body,
    data: remoteMessage.data,
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

export function registerForegroundHandler() {
  return messaging().onMessage(async (remoteMessage) => {
    console.log(">>> FCM foreground handler triggered", remoteMessage);
    await displayForegroundNotification(remoteMessage);
  });
}

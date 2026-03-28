import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import { getStoredUser } from "@/utils/auth";
import firebase from "@react-native-firebase/app"; // 👈 add this
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function IndexPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log("Firebase apps:", firebase.apps.length);
    console.log("Firebase name:", firebase.app().name);

    const redirectUser = async () => {
      // Check if user is already logged in
      const user = await getStoredUser();

      if (!user) {
        // No user found, redirect to login
        router.replace("/login");
        return;
      }

      // Load user into Redux store
      dispatch(setUser(user));

      // Redirect to home
      router.replace("/tabs");
    };

    redirectUser();
  }, [dispatch, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

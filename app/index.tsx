import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import { getStoredUser } from "@/utils/auth";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function IndexPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
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

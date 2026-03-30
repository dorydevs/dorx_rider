import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import { getStoredUser } from "@/utils/auth";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "../firebase"; // 👈 add this as line 1

export default function IndexPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const redirectUser = async () => {
      const user = await getStoredUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      dispatch(setUser(user));
      router.replace("/tabs");
    };

    // small delay to ensure Root Layout is mounted
    const timeout = setTimeout(redirectUser, 100);
    return () => clearTimeout(timeout);
  }, [dispatch, router]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

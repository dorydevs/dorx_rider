import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/slices/userSlice";
import { clearSession } from "@/utils/auth";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AccountScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          dispatch(clearUser());
          await clearSession();
          router.replace("/login");
        },
      },
    ]);
  }, [dispatch, router]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <FontAwesome name="user-o" size={45} color="black" />
          <View style={{ flexDirection: "column", gap: -10 }}>
            <Text style={styles.name}>{userData?.name || "User"}</Text>
            <Text style={styles.role}>{userData?.role || "Rider"}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="call-outline"
            size={20}
            color="#000"
            style={styles.icon}
          />
          <Text style={styles.rowLabel}>Phone</Text>
          <Text style={styles.rowValue}>{userData?.phoneNumber || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#000"
            style={styles.icon}
          />
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{userData?.email || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="storefront-outline"
            size={20}
            color="#000"
            style={styles.icon}
          />
          <Text style={styles.rowLabel}>Store</Text>
          <Text style={styles.rowValue}>{userData?.storeName || "N/A"}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons
            name="location-outline"
            size={20}
            color="#000"
            style={styles.icon}
          />
          <Text style={styles.rowLabel}>Address</Text>
          <Text style={styles.rowValue}>
            {userData?.storeCity || "N/A"} , {userData?.storeProvince || "N/A"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Areas</Text>
          {userData !== null && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {JSON.parse(userData?.assignedBarangays).map(
                (area: string, index: number) => (
                  <Text key={index} style={styles.pills}>
                    {area}
                  </Text>
                )
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AntDesign name="arrow-right" size={24} color="black" />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ffffff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 45,
  },
  header: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  icon: {
    width: 28,
  },
  rowLabel: {
    width: 100,
    fontSize: 14,
    color: "#333",
  },
  rowValue: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  section: {
    marginTop: 12,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#e74c3c",
      marginTop: 24,
      paddingVertical: 14,
      borderRadius: 8,
      gap: 8,
    },
    logoutText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    fontWeight: "600",
    marginBottom: 8,
  },
  pills: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },
});

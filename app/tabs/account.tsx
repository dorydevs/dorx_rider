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
  const user = useAppSelector((state: any) => state.user.user);
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
          <View style={styles.avatarContainer}>
            <FontAwesome name="user-o" size={40} color="#fff" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{userData?.name || "User"}</Text>
            <Text style={styles.role}>
              {userData?.accountType === 1 ? "Hub Rider" : "Store Rider"}
            </Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.row}>
            <View style={styles.iconContainer}>
              <Ionicons name="call-outline" size={18} color="#22c55e" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Phone Number</Text>
              <Text style={styles.rowValue}>
                {userData?.phoneNumber || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={18} color="#22c55e" />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Email Address</Text>
              <Text style={styles.rowValue}>{userData?.email || "N/A"}</Text>
            </View>
          </View>

          {userData?.storeName && (
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <Ionicons name="storefront-outline" size={18} color="#22c55e" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Store Name</Text>
                <Text style={styles.rowValue}>
                  {userData?.storeName || "N/A"}
                </Text>
              </View>
            </View>
          )}

          {(userData?.storeCity || userData?.storeProvince) && (
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={18} color="#22c55e" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Location</Text>
                <Text style={styles.rowValue}>
                  {[userData?.storeCity, userData?.storeProvince]
                    .filter(Boolean)
                    .join(", ") || "N/A"}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Areas</Text>
          {userData !== null && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {(userData?.assignedBarangays).map(
                (area: string, index: number) => (
                  <Text key={index} style={styles.pills}>
                    {area}
                  </Text>
                ),
              )}
            </View>
        )}
           </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <AntDesign name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f7fa",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginTop: 40,
  },
  header: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
  },
  role: {
    fontSize: 14,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  infoSection: {
    gap: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 15,
    color: "#2c3e50",
    fontWeight: "500",
  },
  section: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2c3e50",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  pillText: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e74c3c",
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#e74c3c",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

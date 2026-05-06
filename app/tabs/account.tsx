import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/slices/userSlice";
import { clearSession } from "@/utils/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  Store,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarInitials}>
            {(userData?.name || "U")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{userData?.name || "User"}</Text>
        <View style={styles.roleBadge}>
          <Shield size={12} color="#22c55e" strokeWidth={2} />
          <Text style={styles.roleText}>
            {userData?.accountType === 1 ? "Hub Rider" : "Store Rider"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Contact Information</Text>

          <View style={styles.row}>
            <View style={styles.iconContainer}>
              <Phone size={16} color="#22c55e" strokeWidth={2} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Phone Number</Text>
              <Text style={styles.rowValue}>
                {userData?.phoneNumber || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.iconContainer}>
              <Mail size={16} color="#22c55e" strokeWidth={2} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Email Address</Text>
              <Text style={styles.rowValue}>{userData?.email || "N/A"}</Text>
            </View>
          </View>

          {userData?.storeName && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.iconContainer}>
                  <Store size={16} color="#22c55e" strokeWidth={2} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Store Name</Text>
                  <Text style={styles.rowValue}>{userData?.storeName}</Text>
                </View>
              </View>
            </>
          )}

          {(userData?.storeCity || userData?.storeProvince) && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.iconContainer}>
                  <MapPin size={16} color="#22c55e" strokeWidth={2} />
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
            </>
          )}
        </View>

        {/* Pickup Areas Card */}
        {userData?.assignedBarangays?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Assigned Pickup Areas</Text>
            <View style={styles.pillsContainer}>
              {userData.assignedBarangays.map((area: string, index: number) => (
                <View key={index} style={styles.pill}>
                  <MapPin size={11} color="#16a34a" strokeWidth={2} />
                  <Text style={styles.pillText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <LogOut size={18} color="#fff" strokeWidth={2} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  headerBanner: {
    backgroundColor: "#22c55e",
    paddingTop: 54,
    paddingBottom: 32,
    alignItems: "center",
    gap: 8,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: "#22c55e",
  },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803d",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 10,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  pillText: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
    shadowColor: "#ef4444",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

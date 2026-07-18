import { ConfirmModal } from "@/components/ConfirmModal";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/slices/userSlice";
import { clearSession } from "@/utils/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AccountScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

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

  const handleConfirmLogout = useCallback(async () => {
    setIsLogoutModalVisible(false);
    dispatch(clearUser());
    await clearSession();
    router.replace("/login");
  }, [dispatch, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BF63" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleLabel =
    userData?.accountType === 1 ? "Hub Rider" : "Store Rider";
  const locationLabel =
    [userData?.storeCity, userData?.storeProvince].filter(Boolean).join(", ") ||
    "Location not set";
  const pickupAreas: string[] = userData?.assignedBarangays || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DashboardHeader
          eyebrow="MY ACCOUNT"
          username={userData?.name || "User"}
          role={roleLabel}
          location={locationLabel}
        />

        <View style={styles.container}>
          {/* Contact Information */}
          <View style={styles.sectionBlock}>
            <SectionHeader
              title="Contact Information"
              accentColor="#00BF63"
              icon={<Ionicons name="call" size={18} color="#00BF63" />}
            />

            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#00BF6315" }]}
                >
                  <Ionicons name="call" size={18} color="#00BF63" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>
                    {userData?.phoneNumber || "Not set"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoItem}>
                <View
                  style={[styles.iconContainer, { backgroundColor: "#00BF6315" }]}
                >
                  <Ionicons name="mail" size={18} color="#00BF63" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>
                    {userData?.email || "Not set"}
                  </Text>
                </View>
              </View>

              {userData?.storeName ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoItem}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: "#00BF6315" },
                      ]}
                    >
                      <Ionicons name="storefront" size={18} color="#00BF63" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Store Name</Text>
                      <Text style={styles.infoValue}>{userData.storeName}</Text>
                    </View>
                  </View>
                </>
              ) : null}

              {userData?.storeCity || userData?.storeProvince ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoItem}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: "#00BF6315" },
                      ]}
                    >
                      <Ionicons name="location" size={18} color="#00BF63" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Location</Text>
                      <Text style={styles.infoValue}>{locationLabel}</Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>
          </View>

          {/* Pickup Areas */}
          <View style={styles.sectionBlock}>
            <SectionHeader
              title="Pickup Areas"
              accentColor="#00BF63"
              icon={<Ionicons name="map" size={18} color="#00BF63" />}
            />

            <View style={styles.pillsCard}>
              {pickupAreas.length > 0 ? (
                <View style={styles.pillsWrap}>
                  {pickupAreas.map((area: string, index: number) => (
                    <View key={index} style={styles.pill}>
                      <Text style={styles.pillText}>{area}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No pickup areas assigned</Text>
              )}
            </View>
          </View>

          {/* Session */}
          <View style={styles.sectionBlock}>
            <SectionHeader
              title="Session"
              accentColor="#EF4444"
              icon={
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              }
            />

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => setIsLogoutModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.logoutIconContainer}>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.footer}>
            <Text style={styles.footerBrand}>Dory Express Riders</Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={isLogoutModalVisible}
        icon="log-out-outline"
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        destructive
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  sectionBlock: {
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 14,
  },
  pillsCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    backgroundColor: "#00BF6315",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 13,
    color: "#00994F",
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    paddingVertical: 6,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  footer: {
    alignItems: "center",
    marginTop: 12,
    gap: 4,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00BF63",
    letterSpacing: 0.3,
  },
  versionText: {
    fontSize: 12,
    color: "#94A3B8",
  },
});

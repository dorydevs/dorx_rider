import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearUser } from "@/store/slices/userSlice";
import { clearSession } from "@/utils/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  Bike,
  Building2,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Shield,
  Store,
  User,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getInitials(name: string) {
  if (!name) return "R";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AccountScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state.user.user);
  const [userData, setUserData] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) setUserData(JSON.parse(storedUser));
        else if (user) setUserData(user);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [user]);

  const confirmLogout = useCallback(async () => {
    setShowLogoutModal(false);
    try {
      await clearSession();
      dispatch(clearUser());
      setTimeout(() => router.replace("/login" as any), 100);
    } catch (e) {
      console.error("Logout error:", e);
    }
  }, [dispatch, router]);

  const riderType = userData?.accountType === 1 ? "Hub Rider" : "Store Rider";
  const initials = getInitials(userData?.name ?? "");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO HEADER ── */}
        <View style={styles.hero}>
          {/* glow accents */}
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />

          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Bike size={13} color="#fff" strokeWidth={2.5} />
            </View>
          </View>

          <Text style={styles.heroName}>{userData?.name || "Rider"}</Text>
          <Text style={styles.heroUsername}>
            @{userData?.username || userData?.userName || "—"}
          </Text>

          <View style={styles.heroPillRow}>
            <View style={styles.heroPill}>
              <Shield size={11} color="#22c55e" strokeWidth={2.5} />
              <Text style={styles.heroPillText}>{riderType}</Text>
            </View>
            {userData?.storeCity && (
              <View
                style={[
                  styles.heroPill,
                  { backgroundColor: "#ffffff18", borderColor: "#ffffff33" },
                ]}
              >
                <MapPin size={11} color="#93c5fd" strokeWidth={2.5} />
                <Text style={[styles.heroPillText, { color: "#93c5fd" }]}>
                  {userData.storeCity}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── INFO CARDS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Info</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon={<Phone size={17} color="#22c55e" strokeWidth={2.5} />}
              label="Phone Number"
              value={userData?.phoneNumber}
            />
            <View style={styles.divider} />
            <InfoRow
              icon={<Mail size={17} color="#22c55e" strokeWidth={2.5} />}
              label="Email Address"
              value={userData?.email}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branch</Text>
          <View style={styles.infoCard}>
            {userData?.storeName && (
              <>
                <InfoRow
                  icon={<Store size={17} color="#8b5cf6" strokeWidth={2.5} />}
                  label="Store Name"
                  value={userData.storeName}
                  color="#8b5cf6"
                />
                <View style={styles.divider} />
              </>
            )}
            {(userData?.storeCity || userData?.storeProvince) && (
              <>
                <InfoRow
                  icon={<MapPin size={17} color="#f97316" strokeWidth={2.5} />}
                  label="Location"
                  value={[userData?.storeCity, userData?.storeProvince]
                    .filter(Boolean)
                    .join(", ")}
                  color="#f97316"
                />
                <View style={styles.divider} />
              </>
            )}
            <InfoRow
              icon={<Building2 size={17} color="#3b82f6" strokeWidth={2.5} />}
              label="Rider Type"
              value={riderType}
              color="#3b82f6"
            />
          </View>
        </View>

        {/* ── PICKUP AREAS ── */}
        {userData?.assignedBarangays?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Pickup Areas</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {userData.assignedBarangays.length}
                </Text>
              </View>
            </View>
            <View style={styles.pillsWrap}>
              {userData.assignedBarangays.map((area: string, i: number) => (
                <View key={i} style={styles.pill}>
                  <MapPin size={10} color="#16a34a" strokeWidth={2.5} />
                  <Text style={styles.pillText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── ACCOUNT ACTIONS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon={<User size={17} color="#64748b" strokeWidth={2.5} />}
              label="Username"
              value={userData?.username || userData?.userName}
              color="#64748b"
            />
          </View>
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.85}
        >
          <View style={styles.logoutIconWrap}>
            <LogOut size={20} color="#ef4444" strokeWidth={2.5} />
          </View>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Dory Express Riders · v1.0.0</Text>
      </ScrollView>

      {/* ── LOGOUT CONFIRMATION MODAL ── */}
      <Modal
        transparent
        animationType="fade"
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalIconWrap}>
              <LogOut size={28} color="#ef4444" strokeWidth={2.5} />
            </View>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to sign out of your account?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  color = "#22c55e",
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  color?: string;
}) {
  return (
    <View style={infoRowStyles.row}>
      <View style={[infoRowStyles.iconWrap, { backgroundColor: color + "18" }]}>
        {icon}
      </View>
      <View style={infoRowStyles.content}>
        <Text style={infoRowStyles.label}>{label}</Text>
        <Text style={infoRowStyles.value}>{value || "N/A"}</Text>
      </View>
    </View>
  );
}
const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  value: { fontSize: 15, color: "#0f172a", fontWeight: "600" },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { paddingBottom: 48 },

  // Hero
  hero: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 20,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#0a0f2e",
  },
  heroGlowTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#7ab52840",
    top: -90,
    right: -60,
  },
  heroGlowBottom: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#6aaa2230",
    bottom: -70,
    left: -50,
  },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#4ade8066",
    shadowColor: "#22c55e",
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  avatarInitials: { fontSize: 32, fontWeight: "900", color: "#fff" },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#16a34a",
    borderWidth: 2,
    borderColor: "#0a0f2e",
    justifyContent: "center",
    alignItems: "center",
  },
  heroName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  heroUsername: {
    fontSize: 13,
    color: "#93c5fd",
    fontWeight: "600",
    marginBottom: 16,
  },
  heroPillRow: { flexDirection: "row", gap: 8 },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ffffff18",
    borderWidth: 1,
    borderColor: "#ffffff33",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroPillText: { fontSize: 12, fontWeight: "700", color: "#93c5fd" },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    shadowColor: "#94a3b8",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginHorizontal: 16 },

  // Pills
  countBadge: {
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: { fontSize: 11, fontWeight: "800", color: "#16a34a" },
  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  pillText: { fontSize: 12, color: "#16a34a", fontWeight: "600" },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 28,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "#fee2e2",
    shadowColor: "#ef4444",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { fontSize: 16, fontWeight: "700", color: "#ef4444" },

  // Footer
  versionText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 16,
  },

  // Logout modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000066",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "82%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: "#475569" },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  modalConfirmText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

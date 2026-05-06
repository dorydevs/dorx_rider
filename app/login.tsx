"../firebase";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import axiosInstance from "@/utils/axiosInstance";
import { yupResolver } from "@hookform/resolvers/yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  requestPermission,
} from "@react-native-firebase/messaging";
import { useRouter } from "expo-router";
import { Bike, Eye, EyeOff, Lock, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as yup from "yup";

const validationSchema = yup.object({
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormInputs = {
  username: string;
  password: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ).catch(() => {});
    }
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(validationSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axiosInstance().post(
        "/api/rider/login",
        JSON.stringify({ password: data.password, userName: data.username }),
        { headers: { "Content-Type": "application/json" } },
      );
      const userData = response.data;
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      dispatch(setUser(userData));

      const m = getMessaging();
      const authStatus = await requestPermission(m);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      if (enabled) {
        const fcmToken = await getToken(m);
        await axiosInstance(userData.token).put("/api/rider/fcm-token", {
          fcmToken,
        });
      }
      setTimeout(() => router.replace("/tabs" as any), 100);
      setLoading(false);
    } catch {
      setLoading(false);
      setError(
        "Something went wrong please double check your username and password",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* ── NAVY GRADIENT BACKGROUND ── */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.bgBase} />
        <View style={styles.gradTop} />
        <View style={styles.gradBottom} />
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* â”€â”€ LOGO SECTION â”€â”€ */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadgeWrap}>
              <View style={styles.logoBadge}>
                <Bike size={44} color="#fff" strokeWidth={2} />
              </View>
              <View style={styles.logoPing} />
            </View>
            <Text style={styles.brandName}>DORY EXPRESS</Text>
            <View style={styles.brandPill}>
              <Text style={styles.brandPillText}>RIDERS PORTAL</Text>
            </View>
            <Text style={styles.brandTagline}>
              Your deliveries, on the road
            </Text>
          </View>

          {/* â”€â”€ FORM CARD â”€â”€ */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to start your shift</Text>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.username && styles.inputWrapperError,
                    ]}
                  >
                    <View style={styles.inputIconWrap}>
                      <User size={17} color="#22c55e" strokeWidth={2.5} />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your username"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      editable={!loading}
                    />
                  </View>
                )}
              />
              {errors.username && (
                <Text style={styles.fieldError}>{errors.username.message}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.password && styles.inputWrapperError,
                    ]}
                  >
                    <View style={styles.inputIconWrap}>
                      <Lock size={17} color="#22c55e" strokeWidth={2.5} />
                    </View>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((v) => !v)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color="#9ca3af" />
                      ) : (
                        <Eye size={18} color="#9ca3af" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.fieldError}>{errors.password.message}</Text>
              )}
            </View>

            {/* Error */}
            {error !== null && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMsg}>{error}</Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonLoading]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.buttonInner}>
                  <View style={styles.loadingDot} />
                  <Text style={styles.buttonText}>Signing in...</Text>
                </View>
              ) : (
                <View style={styles.buttonInner}>
                  <Bike size={20} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.buttonText}>Sign In</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            © 2026 Dory Express · All rights reserved
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // Background — navy gradient
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a0f2e",
  },
  gradTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "#1a237e40",
  },
  gradBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "#00000066",
  },
  mapBlock: { display: "none" as any },
  roadH: { display: "none" as any },
  roadV: { display: "none" as any },
  glowTop: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#7ab52870",
    top: -80,
    right: -60,
  },
  glowBottom: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#6aaa2250",
    bottom: -40,
    left: -60,
  },

  // Scroll
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 32,
  },

  // Logo
  logoSection: { alignItems: "center", marginBottom: 32 },
  logoBadgeWrap: { position: "relative", marginBottom: 18 },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  logoPing: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#22c55e",
    borderWidth: 3,
    borderColor: "#0a0f2e",
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 3,
    textShadowColor: "#3f51b5aa",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  brandPill: {
    marginTop: 6,
    marginBottom: 10,
    backgroundColor: "#ffffff18",
    borderWidth: 1,
    borderColor: "#ffffff33",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  brandPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#93c5fd",
    letterSpacing: 2.5,
  },
  brandTagline: { fontSize: 13, color: "#bfdbfe", fontWeight: "500" },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 26,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 22,
  },

  // Inputs
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
  },
  inputWrapperError: { borderColor: "#ef4444", backgroundColor: "#fef2f2" },
  inputIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  eyeButton: { padding: 6 },
  fieldError: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "500",
  },

  // Error banner
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  errorMsg: {
    color: "#dc2626",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
    flex: 1,
  },

  // Button
  button: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 6,
    shadowColor: "#22c55e",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  buttonLoading: { backgroundColor: "#16a34a" },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },

  // Footer
  footer: {
    textAlign: "center",
    color: "#93c5fd88",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});

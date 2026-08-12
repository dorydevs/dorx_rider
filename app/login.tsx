"../firebase";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { yupResolver } from "@hookform/resolvers/yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  requestPermission,
} from "@react-native-firebase/messaging";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
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

// --------------------
// Validation Schema
// --------------------
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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "username" | "password" | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const dispatch = useAppDispatch();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // --------------------
  // Submit Handler
  // --------------------
  const onSubmit = async (data: LoginFormInputs) => {
    setError("");
    setLoading(true);

    try {
      const response = await axiosInstance().post("/api/rider/login", {
        password: data.password,
        userName: data.username,
      });

      const userData = response.data;

      // Save to AsyncStorage and Redux
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      dispatch(setUser(userData));

      // Request notification permission (Android 13+)
      if (Platform.OS === "android" && Platform.Version >= 33) {
        console.log(">>> Requesting Android notification permission...");
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        console.log(">>> Android notification permission:", granted);
      }

      // Request FCM permission and get token
      console.log(">>> Requesting notification permission...");
      const m = getMessaging();
      const authStatus = await requestPermission(m);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log(">>> Notification permission denied, skipping FCM token");
      } else {
        console.log(">>> Notification permission granted!");
        const fcmToken = await getToken(m);
        console.log(">>> FCM token:", fcmToken);
        await axiosInstance(userData.token).put("/api/rider/fcm-token", {
          fcmToken,
        });
        console.log(">>> FCM token saved to backend!");
      }

      setTimeout(() => {
        router.replace("/tabs");
      }, 100);

      setLoading(false);
    } catch (err: any) {
      console.error("Login error:", err);
      setLoading(false);
      setError(
        "Something went wrong please double check your username and password",
      );
    }
  };

  // --------------------
  // UI
  // --------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoBadge}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>DORX RIDERS</Text>
            <Text style={styles.brandSubtitle}>Sign in to your account</Text>
          </View>

          {/* USERNAME */}
          <View style={styles.fieldGroup}>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={
                      focusedField === "username" ? "#00BF63" : "#94A3B8"
                    }
                    style={styles.inputIconLeft}
                  />
                  <TextInput
                    placeholder="Username"
                    placeholderTextColor="#94A3B8"
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    autoCapitalize="none"
                    returnKeyType="next"
                    editable={!loading}
                    style={[
                      styles.input,
                      styles.inputWithLeftIcon,
                      errors.username
                        ? styles.inputBorderError
                        : focusedField === "username"
                          ? styles.inputBorderFocused
                          : styles.inputBorderDefault,
                    ]}
                  />
                </View>
              )}
            />
            {errors.username && (
              <Text style={styles.fieldError}>{errors.username.message}</Text>
            )}
          </View>

          {/* PASSWORD */}
          <View style={styles.fieldGroupTight}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={
                      focusedField === "password" ? "#00BF63" : "#94A3B8"
                    }
                    style={styles.inputIconLeft}
                  />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => {
                      setFocusedField(null);
                      onBlur();
                    }}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    editable={!loading}
                    style={[
                      styles.input,
                      styles.inputWithBothIcons,
                      errors.password
                        ? styles.inputBorderError
                        : focusedField === "password"
                          ? styles.inputBorderFocused
                          : styles.inputBorderDefault,
                    ]}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.inputIconRight}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text style={styles.fieldError}>{errors.password.message}</Text>
            )}
          </View>

          {/* FORGOT PASSWORD */}
          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotPasswordLink}
            hitSlop={8}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* ERROR MESSAGE */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          >
            {loading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.loginButtonSpinner}
                />
                <Text style={styles.loginButtonText}>Signing in...</Text>
              </>
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 40,
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoBadge: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
    marginBottom: 16,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldGroupTight: {
    marginBottom: 10,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  inputIconLeft: {
    position: "absolute",
    left: 14,
    zIndex: 1,
  },
  inputIconRight: {
    position: "absolute",
    right: 14,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
    color: "#1E293B",
    fontSize: 15,
  },
  inputWithLeftIcon: {
    paddingLeft: 46,
  },
  inputWithBothIcons: {
    paddingLeft: 46,
    paddingRight: 50,
  },
  inputBorderDefault: {
    borderColor: "#E2E8F0",
  },
  inputBorderFocused: {
    borderColor: "#00BF63",
  },
  inputBorderError: {
    borderColor: "#EF4444",
  },
  fieldError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  forgotPasswordLink: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: "#00BF63",
    fontSize: 13,
    fontWeight: "600",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  errorBannerText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "500",
  },
  loginButton: {
    flexDirection: "row",
    backgroundColor: "#00BF63",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#00BF63",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonSpinner: {
    marginRight: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});

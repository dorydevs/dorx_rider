import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import axiosInstance from "@/utils/axiosInstance";
import { yupResolver } from "@hookform/resolvers/yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Truck,
  User,
} from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
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

  const onSubmit = async (data: LoginFormInputs) => {
    setError(null);
    setLoading(true);

    try {
      const response = await axiosInstance().post("/api/rider/login", {
        password: data.password,
        userName: data.username,
      });

      const userData = response.data;

      // Save to AsyncStorage
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Save to Redux store
      dispatch(setUser(userData));

      // Redirect to home
      setTimeout(() => {
        router.replace("/tabs" as any);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Brand Header */}
            <View style={styles.brandContainer}>
              <View style={styles.logoCircle}>
                <Truck size={40} color="#22c55e" strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>DORY EXPRESS</Text>
              <Text style={styles.titleSub}>RIDERS</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </View>

            <View style={styles.form}>
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
                      <User
                        size={18}
                        color={errors.username ? "#ef4444" : "#9ca3af"}
                        strokeWidth={1.5}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your username"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="default"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>
                  )}
                />
                {errors.username && (
                  <View style={styles.fieldErrorRow}>
                    <AlertCircle size={12} color="#ef4444" />
                    <Text style={styles.fieldError}>
                      {errors.username.message}
                    </Text>
                  </View>
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
                      <Lock
                        size={18}
                        color={errors.password ? "#ef4444" : "#9ca3af"}
                        strokeWidth={1.5}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor="#9ca3af"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                      >
                        {showPassword ? (
                          <EyeOff size={18} color="#9ca3af" strokeWidth={1.5} />
                        ) : (
                          <Eye size={18} color="#9ca3af" strokeWidth={1.5} />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.password && (
                  <View style={styles.fieldErrorRow}>
                    <AlertCircle size={12} color="#ef4444" />
                    <Text style={styles.fieldError}>
                      {errors.password.message}
                    </Text>
                  </View>
                )}
              </View>

              {error !== null && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color="#ef4444" />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <Text style={styles.buttonText}>Signing in...</Text>
                ) : (
                  <View style={styles.buttonContent}>
                    <Truck size={18} color="#fff" strokeWidth={2} />
                    <Text style={styles.buttonText}>Sign In</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  content: {
    marginVertical: "auto" as any,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#22c55e",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#15803d",
  },
  titleSub: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 4,
    color: "#22c55e",
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    color: "#374151",
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 2,
  },
  inputWrapperError: {
    borderColor: "#ef4444",
    backgroundColor: "#fff5f5",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1f2937",
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  fieldError: {
    color: "#ef4444",
    fontSize: 12,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: "#ef4444",
    fontSize: 13,
    flex: 1,
  },
  button: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#22c55e",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#86efac",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
});

import axiosInstance from "@/utils/axiosInstance";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Riders have their own table, so they have their own portal endpoint.
const FORGOT_PASSWORD_ENDPOINT = "/api/auth/riders/forgot-password";

// What the modal shows once the request comes back.
type Result = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  success: boolean;
};

// How each backend error code is presented. The message itself always comes from the
// response body, so wording changes on the backend don't need a release here.
type Presentation = { icon: keyof typeof Ionicons.glyphMap; title: string };

const ERROR_PRESENTATION: Record<string, Presentation> = {
  NO_ACCOUNT: { icon: "mail-unread-outline", title: "No Account Found" },
  MULTIPLE_ACCOUNTS: {
    icon: "people-outline",
    title: "Multiple Accounts Detected",
  },
};

const FALLBACK_PRESENTATION: Presentation = {
  icon: "alert-circle-outline",
  title: "We Couldn't Send the Link",
};

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const onSendLink = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError("Enter a valid email address");
      return;
    }

    setEmailError("");
    setSubmitting(true);

    try {
      await axiosInstance().post(FORGOT_PASSWORD_ENDPOINT, {
        email: trimmedEmail,
      });
      // The reply is identical whether or not the address is registered, so never branch on it.
      setResult({
        icon: "mail-open-outline",
        title: "Check Your Email",
        message: `If an account exists for ${trimmedEmail}, we've sent a link to reset your password. The link expires in 30 minutes.`,
        success: true,
      });
    } catch (error: any) {
      const { icon, title } =
        ERROR_PRESENTATION[error?.response?.data?.code] ??
        FALLBACK_PRESENTATION;
      setResult({
        icon,
        title,
        message:
          error?.response?.data?.message ||
          "Something went wrong. Check your connection and try again.",
        success: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Only a successful send leaves the screen — an error should let them retry.
  const dismissResult = () => {
    const wasSuccess = result?.success;
    setResult(null);
    if (wasSuccess) router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={22} color="#1F2937" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View style={styles.content}>
          <View style={styles.iconBadge}>
            <Ionicons name="lock-closed-outline" size={36} color="#00BF63" />
          </View>
          <Text style={styles.title}>Forgot Your Password?</Text>
          <Text style={styles.subtitle}>
            Enter the email linked to your account and we'll send you a link to
            reset your password.
          </Text>

          <View style={styles.fieldGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={focused ? "#00BF63" : "#94A3B8"}
                style={styles.inputIconLeft}
              />
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError("");
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="send"
                onSubmitEditing={onSendLink}
                style={[
                  styles.input,
                  styles.inputWithLeftIcon,
                  emailError
                    ? styles.inputBorderError
                    : focused
                      ? styles.inputBorderFocused
                      : styles.inputBorderDefault,
                ]}
              />
            </View>
            {emailError ? (
              <Text style={styles.fieldError}>{emailError}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={onSendLink}
            activeOpacity={0.85}
            disabled={submitting}
            style={[styles.sendButton, submitting && styles.sendButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* RESULT MODAL */}
      <Modal
        visible={result !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismissResult}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={dismissResult}
          />

          <View style={styles.card}>
            <View style={styles.cardIconBadge}>
              <Ionicons
                name={result?.icon ?? "mail-open-outline"}
                size={26}
                color="#00BF63"
              />
            </View>

            <Text style={styles.cardTitle}>{result?.title}</Text>
            <Text style={styles.cardMessage}>{result?.message}</Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={dismissResult}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmText}>
                {result?.success ? "Back to Sign In" : "Try Again"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
    marginTop: 8,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#00BF6315",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  fieldGroup: {
    width: "100%",
    marginBottom: 20,
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
  sendButton: {
    width: "100%",
    backgroundColor: "#00BF63",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00BF63",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  cardIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#00BF6315",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  cardMessage: {
    fontSize: 14,
    fontWeight: "400",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  confirmButton: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00BF63",
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});

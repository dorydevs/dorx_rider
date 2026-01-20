import { useThemeColor } from "@/hooks/use-theme-color";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/userSlice";
import axiosInstance from "@/utils/axiosInstance";
import { yupResolver } from "@hookform/resolvers/yup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
  const [generalError, setGeneralError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<any>(null);

  const dispatch = useAppDispatch();
  const primaryColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const backgroundColor = useThemeColor({}, "background");

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
    console.log("NATAWAG");
    try {
      const response = await axiosInstance().post("/api/rider/login", {
        password: data.password,
        userName: data.username,
      });
      console.log("NATAWAG 1");
      const userData = response.data;
      console.log("Login successful, userData:", userData);

      // Save to AsyncStorage
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      console.log("Saved to AsyncStorage");

      // Save to Redux store
      dispatch(setUser(userData));
      console.log("Saved to Redux");

      // Redirect to home
      console.log("Redirecting to home...");
      setTimeout(() => {
        router.replace("/tabs");
      }, 100);
      setLoading(false);
    } catch (err: any) {
      console.log(err);
      setLoading(false);
      setError(
        "Something went wrong please double check your username and password"
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>DORY EXPRESS RIDERS</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {generalError ? (
          <Text style={styles.errorText}>{generalError}</Text>
        ) : null}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: textColor,
                      borderColor: errors.username ? "#ff0000" : primaryColor,
                      backgroundColor: backgroundColor,
                    },
                  ]}
                  placeholder="Enter your username"
                  placeholderTextColor={textColor + "80"}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="default"
                  autoCapitalize="none"
                  editable={!loading}
                />
              )}
            />
            {errors.username && (
              <Text style={styles.fieldError}>{errors.username.message}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: textColor,
                      borderColor: errors.password ? "#ff0000" : primaryColor,
                      backgroundColor: backgroundColor,
                    },
                  ]}
                  placeholder="Enter your password"
                  placeholderTextColor={textColor + "80"}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  editable={!loading}
                />
              )}
            />
            {errors.password && (
              <Text style={styles.fieldError}>{errors.password.message}</Text>
            )}
          </View>
          {error !== null && (
            <Text style={{ color: "tomato", padding: 10, textAlign: "center" }}>
              {error}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.link, { color: primaryColor }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  content: {
    marginVertical: "auto" as any,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 32,
    textAlign: "center",
    opacity: 0.7,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  fieldError: {
    color: "#ff0000",
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: "#ff0000",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  forgotPassword: {
    alignItems: "center",
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
  },
});

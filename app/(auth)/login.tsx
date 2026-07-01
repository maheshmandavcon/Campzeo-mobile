import { login } from "@/api/auth.api";
import { ThemedText } from "@/components/themed-text";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";


export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { setSession } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const onSignInPress = async () => {
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await login(email.trim(), password);

      if (!response?.success || !response?.token) {
        throw new Error(response?.message || "Invalid email or password");
      }
      // console.log("tokknn",response.token);

      await setSession(response.token, response.user);
      router.replace("/(tabs)/dashboard");
    } catch (error: any) {
      console.error("Error logging in:", error);
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error.message ||
        "Invalid email or password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={isDark ? ["#09090b", "#18181b", "#18181b"] : ["#f8fafc", "#f1f5f9", "#f1f5f9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.backgroundShapes}>
          <View style={[styles.shape, styles.shape1, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.08)" : "rgba(220, 38, 38, 0.15)" }]} />
          <View style={[styles.shape, styles.shape2, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.05)" : "rgba(220, 38, 38, 0.1)" }]} />
        </View>

        <View style={[styles.card, {
          backgroundColor: isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
        }]}>
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <View style={[styles.logoContainer, isDark && styles.logoContainerDark]}>
              <Image
                source={require("../../assets/app-images/camp-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.header}>
            <ThemedText type="title" style={[styles.title, { color: isDark ? "#ffffff" : "#111827" }]}>
              Welcome Back
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: isDark ? "#9ca3af" : "#4b5563" }]}>
              Sign in to continue to your dashboard
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: isDark ? "#d1d5db" : "#374151" }]}>Email</ThemedText>
              <Input variant="outline" size="lg" style={[styles.inputWrapper, {
                  backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#ffffff",
                  borderColor: isDark ? "#3f3f46" : "#e5e7eb"
              }]}>
                <InputSlot style={{ paddingLeft: 12 }}>
                  <Ionicons name="mail-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                </InputSlot>
                <InputField
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.inputText, { color: isDark ? "#ffffff" : "#111827" }]}
                />
              </Input>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: isDark ? "#d1d5db" : "#374151" }]}>Password</ThemedText>
              <Input variant="outline" size="lg" style={[styles.inputWrapper, {
                  backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#ffffff",
                  borderColor: isDark ? "#3f3f46" : "#e5e7eb"
              }]}>
                <InputSlot style={{ paddingLeft: 12 }}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </InputSlot>
                <InputField
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={[styles.inputText, { color: isDark ? "#ffffff" : "#111827" }]}
                />
                <InputSlot
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ paddingRight: 12 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </InputSlot>
              </Input>
            </View>

            {/* Forgot Password */}
            <Pressable
              style={styles.forgotPassword}
              onPress={() => Linking.openURL("https://campzeo.com/forgot-password")}
            >
              <ThemedText style={[styles.forgotPasswordText, { color: "#dc2626" }]}>
                Forgot Password?
              </ThemedText>
            </Pressable>

            {/* Error Message */}
            {error !== "" && (
              <View style={[styles.errorContainer, { 
                backgroundColor: isDark ? "rgba(220, 38, 38, 0.1)" : "#fef2f2",
                borderColor: isDark ? "rgba(220, 38, 38, 0.2)" : "#fee2e2"
              }]}>
                <Ionicons name="alert-circle" size={16} color={isDark ? "#ef4444" : "#dc2626"} />
                <ThemedText style={[styles.errorText, { color: isDark ? "#ef4444" : "#dc2626" }]}>{error}</ThemedText>
              </View>
            )}

            {/* Sign In Button */}
            <Button
              onPress={onSignInPress}
              disabled={loading}
              size="lg"
              style={[styles.signInButton, { opacity: loading ? 0.7 : 1, backgroundColor: "#dc2626" }]}
            >
              {loading ? (
                <ButtonSpinner color="#ffffff" />
              ) : (
                <ButtonText style={styles.signInText}>Sign In</ButtonText>
              )}
            </Button>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  backgroundShapes: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },

  shape: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 100,
  },

  shape1: {
    width: 200,
    height: 200,
    top: -50,
    left: -50,
  },

  shape2: {
    width: 150,
    height: 150,
    bottom: -30,
    right: -30,
  },

  card: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 28,
    padding: 32,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    overflow: "hidden",
  },

  logoWrapper: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainerDark: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: 160,
    height: 60,
  },

  header: {
    marginBottom: 32,
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#7f1d1d",
    marginBottom: 8,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "#991b1b",
    opacity: 0.8,
    textAlign: "center",
  },

  form: {
    gap: 20,
  },

  inputGroup: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7f1d1d",
    marginLeft: 4,
  },

  inputWrapper: {
    borderRadius: 14,
    backgroundColor: "#fff",
    borderColor: "#fecaca",
    borderWidth: 1,
    height: 56,
  },

  inputText: {
    fontSize: 16,
    color: "#450a0a",
  },

  forgotPassword: {
    alignSelf: "flex-end",
  },

  forgotPasswordText: {
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "600",
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef2f2",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },

  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "500",
  },

  signInButton: {
    height: 56,
    backgroundColor: "#dc2626",
    borderRadius: 16,
    marginTop: 10,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  signInText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },

  footerText: {
    fontSize: 14,
    color: "#7f1d1d",
  },

  signUpLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#dc2626",
  },
});

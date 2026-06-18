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
} from "react-native";


export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { setSession } = useAuth();

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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <LinearGradient
        colors={["#7f1d1d", "#dc2626", "#ef4444"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.backgroundShapes}>
          <View style={[styles.shape, styles.shape1]} />
          <View style={[styles.shape, styles.shape2]} />
        </View>

        <BlurView intensity={80} tint="light" style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/app-images/camp-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title Section */}
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Welcome Back
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in to continue to your dashboard
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <Input variant="outline" size="lg" style={styles.inputWrapper}>
                <InputSlot style={{ paddingLeft: 12 }}>
                  <Ionicons name="mail-outline" size={20} color="#991b1b" />
                </InputSlot>
                <InputField
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.inputText}
                />
              </Input>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <Input variant="outline" size="lg" style={styles.inputWrapper}>
                <InputSlot style={{ paddingLeft: 12 }}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#991b1b"
                  />
                </InputSlot>
                <InputField
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.inputText}
                />
                <InputSlot
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ paddingRight: 12 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#666"
                  />
                </InputSlot>
              </Input>
            </View>

            {/* Forgot Password */}
            <Pressable
              style={styles.forgotPassword}
              onPress={() => Linking.openURL("https://campzeo.com/forgot-password")}
            >
              <ThemedText style={styles.forgotPasswordText}>
                Forgot Password?
              </ThemedText>
            </Pressable>

            {/* Error Message */}
            {error !== "" && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#b91c1c" />
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            )}

            {/* Sign In Button */}
            <Button
              onPress={onSignInPress}
              disabled={loading}
              size="lg"
              style={styles.signInButton}
            >
              {loading ? (
                <ButtonSpinner color="#fff" />
              ) : (
                <ButtonText style={styles.signInText}>Sign In</ButtonText>
              )}
            </Button>
          </View>

          {/* Footer */}
          {/* <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Don't have an account?{" "}
            </ThemedText>
            <Pressable>
              <ThemedText style={styles.signUpLink}>Sign Up</ThemedText>
            </Pressable>
          </View> */}
        </BlurView>
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

  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
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

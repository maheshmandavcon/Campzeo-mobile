import { useSignIn } from "@clerk/clerk-expo";
// import { Button, Input, InputField } from "@gluestack-ui/themed";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable
} from "react-native";
import GoogleAuth from "./googleAuth";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";

export default function LoginScreen() {
  console.log("[Login] Component rendering");
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSignInPress = async () => {
    if (!isLoaded) {
      console.log("[Login] Clerk useSignIn not loaded yet");
      return;
    }

    if (!email || !password) {
      console.log("[Login] Missing email or password");
      setError("Email and password are required");
      return;
    }

    console.log("[Login] Starting sign-in attempt for:", email);
    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      console.log("[Login] Sign-in result:", {
        status: result.status,
        createdSessionId: result.createdSessionId,
        firstFactorVerification: result.firstFactorVerification?.status,
      });

      if (result.status === "complete") {
        console.log("[Login] Sign-in complete, setting active session");
        await setActive({ session: result.createdSessionId });
        console.log("[Login] Active session set successfully");
      } else {
        console.log("[Login] Sign-in incomplete. Status:", result.status);
        setError("Sign in not complete. Please check your email for verification.");
      }
    } catch (err: any) {
      console.error("[Login] Sign-in error:", JSON.stringify(err, null, 2));
      if (err.errors?.[0]?.code === "form_password_incorrect") {
        setError("Incorrect password. Please try again.");
      } else if (err.errors?.[0]?.code === "form_identifier_not_found") {
        setError("Account not found. Please sign up first.");
      } else {
        setError(err?.errors?.[0]?.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
      console.log("[Login] Sign-in flow finished");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <LinearGradient
        colors={["#fee2e2", "#dc2626", "#fca5a5"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <BlurView intensity={55} tint="light" style={styles.card}>
          {/* Logo */}
          <Image
            source={require("../../assets/app-images/camp-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Title */}
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue to your dashboard
          </Text>

          {/* Email */}
          <Input style={styles.inputWrapper}>
            <InputField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.inputText}
            />
          </Input>

          {/* Password */}
          <Input style={styles.inputWrapper}>
            <InputField
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.inputText}
            />
          </Input>

          {/* Error */}
          {error !== "" && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Sign In Button */}
          <Pressable
            onPress={onSignInPress}
            disabled={loading}
                        className="bg-[#dc2626] rounded-2xl py-3"

            style={({ pressed }) => [
              styles.signInButton,
              { opacity: pressed || loading ? 0.8 : 1 }
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#ff0000ff" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Google Auth */}
          <GoogleAuth />

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

  card: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 18,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.75)",
    overflow: "hidden",
  },

  logo: {
    width: 150,
    height: 50,
    alignSelf: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#991b1b",
    lineHeight: 28,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#7f1d1d",
    lineHeight: 20,
    marginBottom: 22,
  },

  inputWrapper: {
    borderRadius: 12,
    marginBottom: 14,
  },

  inputText: {
    fontSize: 15,
    lineHeight: 20,
  },

  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 10,
  },

  signInButton: {
    height: 45,
    backgroundColor: "#dc2626",
    borderRadius: 14,
    marginTop: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  signInText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },

  divider: {
    height: 1,
    backgroundColor: "#fecaca",
    marginVertical: 18,
  },
});

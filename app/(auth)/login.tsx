import { useSignIn } from "@clerk/clerk-expo";
// import { Button, Input, InputField } from "@gluestack-ui/themed";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import GoogleAuth from "./googleAuth";
import { Button } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)/dashboard");
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message || "Invalid email or password");
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
          <Button
            onPress={onSignInPress}
            isDisabled={loading}
            style={styles.signInButton}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </Button>

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
lineHeight: 22,
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

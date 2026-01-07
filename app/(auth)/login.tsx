import { useSignIn } from "@clerk/clerk-expo";
import { Button, Input, InputField } from "@gluestack-ui/themed";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import GoogleAuth from "./googleAuth";

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
      console.log(JSON.stringify(err, null, 2));
      setError(err?.errors?.[0]?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={["#ffb07c", "#ffffff", "#ffe2d0"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <BlurView
          intensity={50}
          tint="light"
          className="w-[85%] max-w-[400px] rounded-lg p-6 bg-[rgba(251,221,221,0.65)] gap-7"
        >
          {/* Logo */}
          <Image
            source={require("../../assets/app-images/camp-logo.png")}
            style={{
              width: 150,
              height: 50,
              alignSelf: "center",
              marginBottom: 25,
            }}
            resizeMode="contain"
          />

          {/* Email */}
          <Input>
            <InputField
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Input>

          {/* Password */}
          <Input>
            <InputField
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Input>

          {/* Error */}
          {error !== "" && (
            <Text className="text-red-600 font-medium text-center">
              {error}
            </Text>
          )}

          {/* Sign In */}
          <Button
            onPress={onSignInPress}
            isDisabled={loading}
            className="bg-orange-500 rounded-2xl py-3"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-center text-lg">
                Sign In
              </Text>
            )}
          </Button>

          {/* Google Auth */}
          <GoogleAuth />
        </BlurView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

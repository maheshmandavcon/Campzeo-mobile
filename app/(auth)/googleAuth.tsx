import { useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuth() {
  console.log("[GoogleAuth] Component rendering");
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      console.log("[GoogleAuth] Starting Google Sign-In flow (useSSO)");
      setLoading(true);

      const redirectUrl = Linking.createURL("auth-callback", {
        scheme: "campzeo",
      });
      console.log("[GoogleAuth] Using redirectUrl:", redirectUrl);

      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      console.log("[GoogleAuth] startSSOFlow resolved successfully");

      const { createdSessionId, setActive, signIn, signUp } = result;

      if (createdSessionId && setActive) {
        console.log(
          "[GoogleAuth] Session created, setting active:",
          createdSessionId
        );
        await setActive({ session: createdSessionId });
        console.log("[GoogleAuth] setActive completed");
      } else if (signIn?.status === "needs_new_password") {
        console.log("[GoogleAuth] User needs to set a password");
        Alert.alert(
          "Password Required",
          "Your account requires a password to be set. Please sign in via our website to complete your profile setup.",
          [{ text: "OK" }]
        );
      } else {
        console.log(
          "[GoogleAuth] No session created immediately. Result status:",
          {
            signInStatus: signIn?.status,
            signUpStatus: signUp?.status,
          }
        );
        Alert.alert(
          "Sign In Incomplete",
          `Status: ${signIn?.status || "Unknown"}`
        );
      }
    } catch (err: any) {
      console.error(
        "[GoogleAuth] Catch-all error:",
        err.message || "Unknown error"
      );
      if (
        err.code !== "ERR_CANCELED_AUTH_SESSION" &&
        !err.message?.includes("cancelled")
      ) {
        Alert.alert(
          "Authentication Error",
          err.message || "An error occurred during sign in"
        );
      }
    } finally {
      setLoading(false);
      console.log(
        "[GoogleAuth] Google Sign-In flow finished (loading set to false)"
      );
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <Pressable
        style={{
          height: 45,
          borderWidth: 1,
          borderColor: "#dc2626",
          borderRadius: 10,
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => {
          console.log("[GoogleAuth] Button pressed");
          handleGoogleSignIn();
        }}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ef4444" />
        ) : (
          <Text className="color-[#dc2626]">Continue with Google</Text>
        )}
      </Pressable>
    </View>
  );
}

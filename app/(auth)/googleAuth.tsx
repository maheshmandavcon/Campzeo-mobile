import { useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text } from "react-native";
import * as Linking from "expo-linking";


WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuth() {
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: "campzeo",
        path: "auth-callback",
      });

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL("/(tabs)/dashboard"),
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      }
    } catch (err : any) {
      console.error("Google SSO error:", err);
      Alert.alert("Google SSO error:", err)
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={{
        height: 45,
        borderWidth: 1,
        borderColor: "#991b1b",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={handleGoogleSignIn}
    >
      {loading ?<ActivityIndicator color="#ef4444" /> : <Text>Continue with Google</Text>}
    </Pressable>
  );
}

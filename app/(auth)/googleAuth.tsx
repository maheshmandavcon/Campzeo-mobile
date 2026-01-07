import { useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
// import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuth() {
    
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const { createdSessionId, setActive } =
        await startSSOFlow({
          strategy: "oauth_google",
        });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      }
            //   router.replace("/(tabs)/dashboard");

    } catch (err) {
      console.error("Google SSO error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleGoogleSignIn}
      style={{
        height: 50,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {loading ? (
        <ActivityIndicator color={"#dc2626"}/>
      ) : (
        <Text style={{ fontSize: 16, fontWeight: "600" }}>
          Continue with Google
        </Text>
      )}
    </Pressable>
  );
}

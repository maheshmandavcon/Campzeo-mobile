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
        height: 45,
        borderWidth: 1,
        borderColor: "#991b1b",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      {loading ? (
        <ActivityIndicator color={"#dc2626"}/>
      ) : (
        <Text style={{ fontSize: 16, fontWeight: "600" , color:"#991b1b"}}>
          Continue with Google
        </Text>
      )}
    </Pressable>
  );
}

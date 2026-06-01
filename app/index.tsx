import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  return (
    <Redirect href={isSignedIn ? "/(tabs)/dashboard" : "/(auth)/login"} />
  );
}

// import { useAuth } from "@clerk/clerk-expo";
// import { useRouter } from "expo-router";
// import { useEffect } from "react";
// import { ActivityIndicator, Image } from "react-native";
// import { ThemedView } from "@/components/themed-view";

// export default function Index() {
//   const { isSignedIn, isLoaded } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isLoaded) return;

//     if (isSignedIn) {
//       router.replace("/(tabs)/dashboard");
//     } else {
//       router.replace("/(auth)/login");
//     }
//   }, [isLoaded, isSignedIn, router]);

//   if (!isLoaded) {
//     return (
//       <ThemedView
//         className="flex-1 items-center justify-center"
//         style={{ backgroundColor: "#ffffff" }}
//       >
//         <Image
//           source={require("../assets/app-images/camp-logo.png")}
//           style={{ width: 200, height: 80, resizeMode: "contain", marginBottom: 20 }}
//         />
//         <ActivityIndicator size="large" color="#dc2626" />
//       </ThemedView>
//     );
//   }

//   return null;
// }

import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/(auth)/login" />;
}

import { ThemedText } from "@/components/themed-text";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import CalendarWrapper from "../(common)/calendarWrapper";
import { useColorScheme } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";

export default function CalendarScreen() {
  const routePage = useRouter();
  const colorScheme = useColorScheme();

  return (
  <SafeAreaView className="flex-1">
   

    {/* CONTENT */}
    <ThemedView style={{ flex: 1 }}>
       {/* HEADER */}
    <HStack
      className="px-3 pt-5 pb-3 items-center"
      
      style={{justifyContent:"space-between"}}
    >
      {/* LEFT: Back button */}
      <Pressable
        onPress={() => routePage.back()}
        style={{ padding: 6 }}
      >
        <Ionicons
          name="arrow-back-outline"
          size={22}
          color={colorScheme === "dark" ? "#ffffff" : "#020617"}
        />
      </Pressable>

      {/* CENTER: Title */}
      <ThemedText
        style={{
            flex: 1,
            fontSize: 24,
            fontWeight: "700",
            textAlign: "center",
            lineHeight: 30,

          }}
      >
        Scheduled Campaigns
      </ThemedText>

      {/* RIGHT: Spacer */}
      {/* <View style={{ width: 34 }} /> */}
    </HStack>
      <CalendarWrapper />
    </ThemedView>
  </SafeAreaView>
);

}

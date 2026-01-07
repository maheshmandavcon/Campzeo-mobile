import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, TouchableOpacity } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useSidebarStore } from "../../store/sidebarStore";

import {
    Box,
    Button,
    ButtonText,
    Popover,
    PopoverArrow,
    PopoverBackdrop,
    PopoverBody,
    PopoverContent,
    Text,
} from "@gluestack-ui/themed";

export default function TopBar() {
  const routePage = useRouter();
  const openSidebar = useSidebarStore((state) => state.openSidebar);
  const { user } = useUser();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Wait until Clerk user is loaded
  if (!user) return null;

  return (
    <ThemedView
      className="flex-row items-center justify-between bg-white border-b border-gray-200 p-3"
      style={{ minHeight: 60 }}
    >
      {/* Logo */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => routePage.push("/(tabs)/dashboard")}
      >
        <Image
          source={require("../../assets/app-images/camp-logo.png")}
          style={{ width: 130, height: 50, borderRadius: 6 }}
          resizeMode="contain"
          alt="CampZeo logo"
        />
      </TouchableOpacity>

      {/* Right Section */}
      <ThemedView className="flex-row items-center gap-7">
        {/* Notifications */}
        <Popover
          isOpen={isNotifOpen}
          onOpen={() => setIsNotifOpen(true)}
          onClose={() => setIsNotifOpen(false)}
          placement="bottom"
          size="lg"
          trigger={(triggerProps) => (
            <Button {...triggerProps} variant="link">
              <IconSymbol name="notifications" size={25} color="#dc2626" />
            </Button>
          )}
        >
          <PopoverBackdrop />
          <PopoverContent>
            <PopoverArrow />
            <PopoverBody className="p-3">
              <Text className="font-semibold text-center text-base my-3">
                Notifications
              </Text>

              <Box className="mb-3 p-2 rounded-lg bg-background-50 border border-background-200">
                <Text className="text-sm font-medium text-typography-900">
                  New campaign created 🎉
                </Text>
                <Text className="text-xs text-typography-600 mt-1">
                  Just now
                </Text>
              </Box>

              <Box className="mb-3 p-2 rounded-lg bg-background-50 border border-background-200">
                <Text className="text-sm font-medium text-typography-900">
                  You have 3 new leads 🔥
                </Text>
                <Text className="text-xs text-typography-600 mt-1">
                  5 minutes ago
                </Text>
              </Box>

              <Box className="mb-3 p-2 rounded-lg bg-background-50 border border-background-200">
                <Text className="text-sm font-medium text-typography-900">
                  Reminder: Follow up with John
                </Text>
                <Text className="text-xs text-typography-600 mt-1">
                  30 minutes ago
                </Text>
              </Box>

              <Button
                variant="link"
                className="self-center mt-1"
                onPress={() => {
                  setIsNotifOpen(false);
                  routePage.push("/(notifications)/allNotifications");
                }}
              >
                <ButtonText className="text-primary-600 font-medium">
                  See all notifications →
                </ButtonText>
              </Button>
            </PopoverBody>
          </PopoverContent>
        </Popover>

        {/* Avatar */}
        <TouchableOpacity activeOpacity={0.7} onPress={openSidebar}>
          <Image
            source={{ uri: user.imageUrl }}
            className="w-10 h-10 rounded-full border border-gray-300"
            alt="User avatar"
          />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

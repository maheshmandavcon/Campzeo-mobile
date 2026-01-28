import { useAuth, useUser } from "@clerk/clerk-expo";
import { router, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, TouchableOpacity } from "react-native";

import { getNotificationsApi } from "@/api/notification/notificationApi";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useSidebarStore } from "../../store/sidebarStore";
import { ThemedText } from "@/components/themed-text";
import { useColorMode } from "@gluestack-style/react";

// import {
//   Text,
//   useColorMode
// } from "@gluestack-ui/themed";

export default function TopBar() {
  const routePage = useRouter();
  const openSidebar = useSidebarStore((state) => state.openSidebar);
  const { user } = useUser();
  const { getToken } = useAuth();

  const [unreadCount, setUnreadCount] = useState<number>(0);

  const colorMode = useColorMode();
  const iconColor = colorMode === "dark" ? "#ffffff" : "#000000";

  // ---------------- FETCH UNREAD COUNT ----------------
  const fetchUnreadCount = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await getNotificationsApi(token, 1, 50);
      const notifications = Array.isArray(res?.data?.notifications)
        ? res.data.notifications
        : [];

      const unread = notifications.filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.log("Unread count fetch error:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [])
  );

  if (!user) return null;

  return (
    <ThemedView
      className="flex-row items-center justify-between border-b px-4 pb-3"
      style={{ paddingTop: 12, minHeight: 60 }}
    >
      {/* LEFT — LOGO */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => routePage.push("/(tabs)/dashboard")}
      >
        <Image
          source={require("../../assets/app-images/camp-logo.png")}
          style={{ width: 130, height: 50 }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* RIGHT — ICONS */}
      <ThemedView className="flex-row items-center gap-7">
        {/* Notifications */}
        <TouchableOpacity
          onPress={() => router.push("/allNotifications")}
          style={{ position: "relative" }}
          activeOpacity={0.7}
        >
          <IconSymbol
            name="notifications"
            size={25}
            color={iconColor}
          />

          {unreadCount > 0 && (
            <ThemedView
              style={{
                position: "absolute",
                top: -4,
                right: -6,
                backgroundColor: "#dc2626",
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 4,
              }}
            >
              <ThemedText
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </ThemedText>
            </ThemedView>
          )}
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity activeOpacity={0.7} onPress={openSidebar}>
          <Image
            source={{ uri: user.imageUrl }}
            className="w-10 h-10 rounded-full border border-gray-300"
          />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

import { useAuth, useUser } from "@/context/AuthContext";
import { router, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image, TouchableOpacity,
  useColorScheme
} from "react-native";

import { getNotificationsApi } from "@/api/notificationApi";
import { ThemedView } from "@/components/themed-view";
import { useSidebarStore } from "../../store/sidebarStore";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { getInitials } from "@/utils/userDisplay";
import { useUserDetails } from "@/hooks/useUserDetails";

export default function TopBar() {
  const routePage = useRouter();
  const openSidebar = useSidebarStore((state) => state.openSidebar);
  const { user } = useUser();
  const { getToken } = useAuth();
  const { userData } = useUserDetails(Boolean(user));

  const [unreadCount, setUnreadCount] = useState<number>(0);

  // ✅ Use React Native's useColorScheme for reactive updates
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#fff" : "#000";

  // ---------------- FETCH UNREAD COUNT ----------------
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await getNotificationsApi(token, 1, 99);
      const notifications = Array.isArray(res?.data?.notifications)
        ? res.data.notifications
        : [];

      const unread = notifications.filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.log("Unread count fetch error:", error);
    }
  }, [getToken]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  if (!user) return null;

  const initials = getInitials(userData || user);

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
          <Ionicons
            name="notifications"
            size={25}
            color={iconColor}
          />

          {unreadCount > 0 && (
            <ThemedView
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                backgroundColor: "#dc2626",
                borderRadius: 10,
                minWidth: 18,
                height: 20,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 4,
              }}
            >
              <ThemedText
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: "bold",
                  lineHeight: 12,
                  marginTop: 1,
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </ThemedText>

            </ThemedView>
          )}
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity activeOpacity={0.7} onPress={openSidebar}>
          <ThemedView
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#dc2626",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ThemedText
              style={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              {initials}
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

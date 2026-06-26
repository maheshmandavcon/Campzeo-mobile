import { useAuth, useUser } from "@/context/AuthContext";
import { router, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image, TouchableOpacity,
  useColorScheme, Modal, ActivityIndicator, View
} from "react-native";

import { getNotificationsApi } from "@/api/notificationApi";
import { getWalletBalance } from "@/api/billingApi";
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
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const handleOpenWallet = async () => {
    setShowWalletPopup(true);
    if (!walletData) {
      setLoadingWallet(true);
      try {
        const data = await getWalletBalance();
        setWalletData(data);
      } catch (err) {
        console.log("Wallet fetch error", err);
      } finally {
        setLoadingWallet(false);
      }
    }
  };

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
      const notifications = Array.isArray(res?.notifications)
        ? res.notifications
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

        <TouchableOpacity
          onPress={handleOpenWallet}
          activeOpacity={0.7}
        >
          <Ionicons
            name="wallet-outline"
            size={25}
            color={iconColor}
          />
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

      {/* WALLET POPUP MODAL */}
      <Modal
        visible={showWalletPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWalletPopup(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={() => setShowWalletPopup(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              position: "absolute",
              top: 70,
              right: 15,
              width: 320,
              backgroundColor: isDark ? "#171a20" : "#ffffff",
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
              borderWidth: 1,
              borderColor: isDark ? "#2a2f3a" : "#e2e8f0",
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4 border-b pb-3" style={{ borderColor: isDark ? "#2a2f3a" : "#e2e8f0" }}>
              <ThemedText style={{ fontSize: 16, fontWeight: "800", color: isDark ? "#fff" : "#0f172a" }}>
                Wallet Balance
              </ThemedText>
              <View style={{ backgroundColor: isDark ? "#14532d" : "#dcfce7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                <ThemedText style={{ color: isDark ? "#4ade80" : "#166534", fontSize: 10, fontWeight: "bold" }}>
                  Active
                </ThemedText>
              </View>
            </View>

            {loadingWallet ? (
              <View className="py-6 items-center justify-center">
                <ActivityIndicator size="small" color="#dc2626" />
              </View>
            ) : (
              <>
                {/* SMS Channel */}
                <View className="mb-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="chatbox-ellipses" size={16} color={isDark ? "#9ca3af" : "#64748b"} />
                      <ThemedText style={{ fontSize: 12, fontWeight: "bold", color: isDark ? "#e2e8f0" : "#334155" }}>
                        SMS Channel
                      </ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => { setShowWalletPopup(false); router.push({ pathname: "/(billing)/billingPage", params: { tab: "credits", channel: "SMS" } }); }}>
                      <ThemedText style={{ fontSize: 10, color: "#dc2626", fontWeight: "700" }}>
                        Recharge SMS credits
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-end gap-1.5">
                    <ThemedText style={{ fontSize: 24, fontWeight: "900", color: isDark ? "#fff" : "#0f172a" }}>
                      {Number(walletData?.wallet?.smsCreditsAvailable || 0).toLocaleString("en-IN")}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#64748b", marginBottom: 3, fontWeight: "600" }}>
                      Credits
                    </ThemedText>
                  </View>
                </View>

                {/* WhatsApp Channel */}
                <View className="mb-5">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="logo-whatsapp" size={16} color={isDark ? "#9ca3af" : "#64748b"} />
                      <ThemedText style={{ fontSize: 12, fontWeight: "bold", color: isDark ? "#e2e8f0" : "#334155" }}>
                        WhatsApp Channel
                      </ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => { setShowWalletPopup(false); router.push({ pathname: "/(billing)/billingPage", params: { tab: "credits", channel: "WHATSAPP" } }); }}>
                      <ThemedText style={{ fontSize: 10, color: "#16a34a", fontWeight: "700" }}>
                        Recharge WA credits
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-end gap-1.5">
                    <ThemedText style={{ fontSize: 24, fontWeight: "900", color: isDark ? "#fff" : "#0f172a" }}>
                      {Number(walletData?.wallet?.whatsappCreditsAvailable || 0).toLocaleString("en-IN")}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#64748b", marginBottom: 3, fontWeight: "600" }}>
                      Credits
                    </ThemedText>
                  </View>
                </View>
              </>
            )}

            {/* Manage Button */}
            <TouchableOpacity
              onPress={() => {
                setShowWalletPopup(false);
                router.push({ pathname: "/(billing)/billingPage", params: { tab: "credits" } });
              }}
              style={{
                backgroundColor: "#dc2626",
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6
              }}
              activeOpacity={0.8}
            >
              <ThemedText style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>
                Purchase Credits
              </ThemedText>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

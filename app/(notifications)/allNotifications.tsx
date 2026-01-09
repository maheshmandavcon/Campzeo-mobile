// app/(notifications)/allNotifications.tsx
import { useEffect, useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  getNotificationsApi,
  deleteNotificationApi,
} from "@/api/notification/notificationApi";
import { useAuth } from "@clerk/clerk-expo";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { SafeAreaView } from "@gluestack-ui/themed";
import { useColorMode } from "@gluestack-ui/themed";
import { useColorScheme } from "react-native";

export default function AllNotifications() {
  const navigation = useNavigation();
  const { getToken } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [tab, setTab] = useState<"All" | "Unread">("All");
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchText, setSearchText] = useState("");

  // const colorMode = useColorMode();

  // ---------------- FORMAT API DATA ----------------
  const formatNotification = (item: any, existingReadStatus?: boolean) => {
    const dateObj = new Date(item.createdAt);
    return {
      id: item.id,
      title: item.platform || "Notification",
      desc: item.message,
      read: existingReadStatus !== undefined ? existingReadStatus : item.isRead,
      time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: dateObj.toDateString(),
    };
  };

  // ---------------- FETCH NOTIFICATIONS ----------------
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const res = await getNotificationsApi(token, 1, 50);
      const notificationsArray =
        res?.data?.notifications && Array.isArray(res.data.notifications)
          ? res.data.notifications
          : [];

      const formatted = notificationsArray.map((item: any) => {
        const existing = notifications.find((n) => n.id === item.id);
        return formatNotification(item, existing?.read);
      });

      setNotifications(formatted);
    } catch (error) {
      console.log("Notification API error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ---------------- FILTERS ----------------
  const filteredAll =
    tab === "All"
      ? notifications
      : notifications.filter((n) => !n.read);

  const searchedNotifications = filteredAll.filter(
    (n) =>
      n.title.toLowerCase().includes(searchText.toLowerCase()) ||
      n.desc.toLowerCase().includes(searchText.toLowerCase())
  );

  const visibleNotifications = searchedNotifications.slice(0, visibleCount);
  const isAllVisible = visibleCount >= searchedNotifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasNotifications = visibleNotifications.length > 0;

  // ---------------- MARK AS READ ----------------
  const markAsRead = (id: number) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // ---------------- DELETE NOTIFICATION ----------------
  const deleteNotification = async (id: number) => {
    try {
      const token = await getToken();
      if (!token) return;

      Alert.alert(
        "Delete Notification",
        "Are you sure you want to delete this notification?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteNotificationApi(token, id);
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== id)
                );
              } catch (error: any) {
                console.log(
                  "Delete Notification API Error:",
                  error.response?.data || error
                );
                Alert.alert(
                  "Error",
                  error.response?.data?.message ||
                  "Failed to delete notification"
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.log("Delete notification error:", error);
    }
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const CARD_BG = isDark ? "#0f172a" : "#ffffff";
  const CARD_BORDER = isDark ? "#1e293b" : "#e5e7eb";
  const TEXT_SECONDARY = isDark ? "#94a3b8" : "#6b7280";
  const TEXT_MUTED = isDark ? "#64748b" : "#9ca3af";
  const SCREEN_BG = isDark ? "#020617" : "#EEF2FF";

  // ---------------- GROUP BY DATE ----------------
  const grouped: Record<string, any[]> = {};
  visibleNotifications.forEach((item) => {
    grouped[item.date] = grouped[item.date] || [];
    grouped[item.date].push(item);
  });

  const sectionData = Object.keys(grouped).map((date) => ({
    title: date,
    data: grouped[date],
  }));

  // ---------------- LOAD MORE / SEE LESS ----------------
  const handleLoadToggle = () => {
    setVisibleCount(isAllVisible ? 5 : searchedNotifications.length);
  };

  const ListFooterButton = () => {
    if (searchedNotifications.length <= 5) return null;
    return (
      <TouchableOpacity
        onPress={handleLoadToggle}
        style={{
          paddingVertical: 12,
          marginVertical: 8,
          borderRadius: 12,
          alignItems: "center",
          backgroundColor: isAllVisible ? "#fee2e2" : "#bfdbfe",
        }}
      >
        <ThemedText
          style={{
            fontWeight: "bold",
            color: isAllVisible ? "#b91c1c" : "#1d4ed8",
          }}
        >
          {isAllVisible ? "See Less" : "Load More"}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SCREEN_BG }}>
      <ThemedView className="flex-1 px-4 pt-4">
        {/* HEADER */}
        <ThemedView className="flex-row items-center justify-between my-5">
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color={isDark ? "#e5e7eb" : "#333"} />
          </TouchableOpacity>

          <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>
            Notifications
          </ThemedText>

          <ThemedView style={{ width: 32 }} />
        </ThemedView>

        {/* SEARCH + REFRESH */}
        <ThemedView className="flex-row items-center mb-3">
          <ThemedView className="flex-1 flex-row items-center rounded-full px-4 border shadow-sm"
            style={{
              backgroundColor: isDark ? "#161618" : "#fff",
              borderColor: isDark ? "#fff" : "#d1d5db",
            }}>
            <Ionicons name="search-outline" size={20} color={isDark ? "#fff" : "#777"} />
            <TextInput
              placeholder="Search..."
              className="flex-1 px-2"
              style={{ color: isDark ? "#e5e7eb" : "#374151" }}
              placeholderTextColor={isDark ? "#94a3b8" : "#9ca3af"} // placeholder color
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                setVisibleCount(5);
              }}
            />
          </ThemedView>

          <TouchableOpacity className="ml-3" onPress={fetchNotifications}>
            <Ionicons name="sync-outline" size={22} color={isDark ? "#fff" : "#444"} />
          </TouchableOpacity>
        </ThemedView>

        {/* TABS */}
        <ThemedView className="flex-row items-center justify-between mb-3">
          {/* TABS */}
          <ThemedView className="flex-row space-x-4">
            <TouchableOpacity
              onPress={() => setTab("All")}
              style={{
                backgroundColor: tab === "All"
                  ? "#dc2626"
                  : isDark
                    ? "#161618"
                    : "#ffffff",
                paddingHorizontal: 16,
                paddingVertical: 4,
                borderRadius: 9999, // fully rounded
              }}
            >
              <ThemedText
                style={{
                  fontWeight: tab === "All" ? "bold" : "normal",
                  color: tab === "All"
                    ? "#fff"
                    : isDark
                      ? "#e5e7eb"
                      : "#374151",
                }}
              >
                All ({notifications.length})
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab("Unread")}
              style={{
                backgroundColor: tab === "Unread"
                  ? "#dc2626"
                  : isDark
                    ? "#161618"
                    : "#ffffff",
                paddingHorizontal: 16,
                paddingVertical: 4,
                borderRadius: 9999,
              }}
            >
              <ThemedText
                style={{
                  fontWeight: tab === "Unread" ? "bold" : "normal",
                  color: tab === "Unread"
                    ? "#fff"
                    : isDark
                      ? "#e5e7eb"
                      : "#374151",
                }}
              >
                Unread ({unreadCount})
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          {/* MARK ALL AS READ */}
          <TouchableOpacity onPress={markAllAsRead}>
            <ThemedText
              style={{
                fontWeight: "bold",
                color: isDark ? "#fff" : "#dc2626",
              }}
            >
              Mark all as read
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* LOADING */}
        {loading && (
          <ThemedView className="mt-10 items-center">
            <ActivityIndicator size="large" color="#dc2626" />
          </ThemedView>
        )}

        {/* EMPTY STATE */}
        {!loading && !hasNotifications && (
          <ThemedView className="flex-1 items-center justify-center mt-10">
            <Ionicons name="notifications-off-outline" size={70} color="#9AA6FF" />
            <ThemedText style={{ color: TEXT_SECONDARY, marginTop: 12 }}>
              Looks like there’s nothing here
            </ThemedText>
          </ThemedView>
        )}

        {/* NOTIFICATION LIST */}
        {!loading && hasNotifications && (
          <SectionList
            sections={sectionData}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderSectionHeader={({ section }) => (
              <ThemedText
                style={{
                  fontWeight: "bold",
                  color: TEXT_SECONDARY,
                  marginTop: 16,
                  marginBottom: 4,
                }}
              >
                {section.title}
              </ThemedText>
            )}
            renderItem={({ item }) => (
              <ThemedView style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => markAsRead(item.id)} // tap marks as read
                  onLongPress={() => deleteNotification(item.id)} // long press deletes
                  style={{
                    flexDirection: "row",
                    backgroundColor: isDark ? "#161618" : "#ffffff",
                    borderColor: isDark ? "#fff" : "#e5e7eb",
                    borderRadius: 16,
                    padding: 12,
                    marginVertical: 4,
                    alignItems: "flex-start",
                    borderWidth: 1,
                  }}
                >
                  <ThemedView style={{ flex: 1 }}>
                    <ThemedText
                      style={{
                        fontWeight: item.read ? "normal" : "bold",
                        fontSize: 16,
                      }}
                    >
                      {item.title}
                    </ThemedText>

                    <ThemedText style={{ color: TEXT_SECONDARY, marginTop: 4 }}>
                      {item.desc}
                    </ThemedText>

                    <ThemedText
                      style={{
                        color: TEXT_MUTED,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {item.time}
                    </ThemedText>
                  </ThemedView>

                  {!item.read && (
                    <ThemedView
                      style={{
                        backgroundColor: "#dc2626",
                        borderRadius: 4,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        alignSelf: "flex-start",
                        marginLeft: 8,
                      }}
                    >
                      <ThemedText
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      >
                        NEW
                      </ThemedText>
                    </ThemedView>
                  )}
                </TouchableOpacity>
              </ThemedView>
            )}
            ListFooterComponent={<ListFooterButton />}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

import { useEffect, useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  getNotificationsApi,
  deleteNotificationApi,
  markAllNotificationsReadApi,
} from "@/api/notificationApi";
import { useAuth } from "@clerk/clerk-expo";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";

export default function AllNotifications() {
  const router = useRouter();
  // const navigation = useNavigation();
  const { getToken } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [tab, setTab] = useState<"All" | "Unread">("All");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [searchText, setSearchText] = useState("");

  // ---------------- FORMAT API DATA ----------------
  const formatNotification = (item: any) => {
    const dateObj = new Date(item.createdAt);
    return {
      id: item.id,
      title: item.platform || "Notification",
      desc: item.message,
      read: item.isRead, // ✅ ALWAYS TRUST SERVER
      time: dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: dateObj.toDateString(),
    };
  };

  // ---------------- FETCH NOTIFICATIONS ----------------
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const res = await getNotificationsApi(token, 1, 99);
      const notificationsArray =
        res?.data?.notifications && Array.isArray(res.data.notifications)
          ? res.data.notifications
          : [];

      const formatted = notificationsArray.map((item: any) => {
        const existing = notifications.find((n) => n.id === item.id);
        return formatNotification(item);
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

  const displayCount = (count: number) => {
    if (count > 99) return "99+";
    return count.toString();
  };

  // ---------------- MARK AS READ ----------------
  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await markAllNotificationsReadApi(token);
      console.log("MARK ALL RESPONSE:", res);

      await fetchNotifications();
      setTab("All");
    } catch (err) {
      console.log("Mark all read error", err);
    }
  };

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
                setDeletingId(id);

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
                  error.response?.data?.message || "Failed to delete notification"
                );
              } finally {
                setDeletingId(null);
              }
            }
          },
        ]
      );
    } catch (error) {
      console.log("Delete notification error:", error);
    }
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

  const NotificationSkeletonCard = ({ isDark }: { isDark: boolean }) => {
    const bg = isDark ? "#27272a" : "#e5e7eb";

    return (
      <ThemedView
        style={{
          backgroundColor: isDark ? "#161618" : "#ffffff",
          borderRadius: 16,
          padding: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isDark ? "#3f3f46" : "#e5e7eb",
        }}
      >
        {/* Title */}
        <ThemedView
          style={{
            height: 16,
            width: "50%",
            borderRadius: 6,
            backgroundColor: bg,
            marginBottom: 8,
          }}
        />

        {/* Description lines */}
        <ThemedView
          style={{
            height: 12,
            width: "90%",
            borderRadius: 6,
            backgroundColor: bg,
            marginBottom: 6,
          }}
        />
        <ThemedView
          style={{
            height: 12,
            width: "70%",
            borderRadius: 6,
            backgroundColor: bg,
            marginBottom: 8,
          }}
        />

        {/* Time */}
        <ThemedView
          style={{
            height: 10,
            width: "30%",
            borderRadius: 6,
            backgroundColor: bg,
          }}
        />
      </ThemedView>
    );
  };

  const NotificationsSkeletonList = ({ isDark }: { isDark: boolean }) => {
    return (
      <ThemedView style={{ marginTop: 12, backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <NotificationSkeletonCard key={i} isDark={isDark} />
        ))}
      </ThemedView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#EEF2FF" }}>
      <ThemedView className="flex-1 px-4"
        style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
        {/* HEADER */}
        <ThemedView className="flex-row items-center justify-between"
          style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color={isDark ? "#e5e7eb" : "#333"} />
          </TouchableOpacity>

          <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>
            Notifications
          </ThemedText>

          <ThemedView style={{ width: 32 }} />
        </ThemedView>

        {/* SEARCH + REFRESH */}
        <ThemedView className="flex-row items-center mb-3"
          style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
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
        <ThemedView className="flex-row items-center justify-between mb-3"
          style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
          {/* TABS */}
          <ThemedView className="flex-row space-x-4"
            style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
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
                All ({displayCount(notifications.length)})
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
                Unread ({displayCount(unreadCount)})
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
        {loading && <NotificationsSkeletonList isDark={isDark} />}

        {/* EMPTY STATE */}
        {!loading && !hasNotifications && (
          <ThemedView
            className="flex-1 items-center justify-center px-6"
            style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
          >
            <Ionicons
              name="notifications-circle-outline"
              size={64}
              color={isDark ? "#94a3b8" : "#4f46e5"}
            />

            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginTop: 16,
              }}
            >
              No alerts yet
            </ThemedText>

            <ThemedText
              style={{
                fontSize: 14,
                marginTop: 6,
                textAlign: "center",
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              Pull down or tap below to refresh
            </ThemedText>

            <TouchableOpacity
              onPress={fetchNotifications}
              style={{
                marginTop: 16,
                backgroundColor: "#dc2626",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 9999,
              }}
            >
              <ThemedText style={{ color: "#fff", fontWeight: "bold" }}>
                Refresh
              </ThemedText>
            </TouchableOpacity>
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
                  color: isDark ? "#94a3b8" : "#6b7280",
                  backgroundColor: isDark ? "#161618" : "#f3f4f6",
                  marginTop: 16,
                  marginBottom: 4,
                }}
              // style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
              >
                {section.title}
              </ThemedText>
            )}
            renderItem={({ item }) => (
              <ThemedView style={{ marginBottom: 12, backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
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

                    <ThemedText style={{ color: isDark ? "#94a3b8" : "#6b7280", marginTop: 4 }}>
                      {item.desc}
                    </ThemedText>

                    <ThemedText
                      style={{
                        color: isDark ? "#64748b" : "#9ca3af",
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {item.time}
                    </ThemedText>
                  </ThemedView>

                  {deletingId === item.id ? (
                    <ActivityIndicator
                      size="small"
                      color="#dc2626"
                      style={{ marginLeft: 8 }}
                    />
                  ) : (
                    !item.read && (
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
                    )
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

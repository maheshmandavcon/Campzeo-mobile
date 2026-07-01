import { getScheduledPosts } from "@/api/calanderApi";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, DeviceEventEmitter, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import CalendarView from "../(calendar)/CalendarComponents/calendarView";
import { getUser } from "@/api/dashboardApi";

const CalendarWrapper = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener("calendarScrollEnabled", (enabled) => {
      setScrollEnabled(enabled);
    });
    return () => {
      listener.remove();
    };
  }, []);

  const loadPosts = async () => {
    try {
      const user = await getUser();
      const orgId = user?.organisation?.id;
      const data = await getScheduledPosts(orgId);
      setPosts(data?.posts ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, []);



  if (error) {
    return <Text>{error}</Text>;
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#dc2626"
          colors={["#dc2626"]}
          enabled={scrollEnabled}
        />
      }
    >
      <CalendarView posts={posts} />
    </ScrollView>
  );
};

export default CalendarWrapper;

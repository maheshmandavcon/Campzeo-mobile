import { getScheduledPosts } from "@/api/calanderApi";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import CalendarView from "../(calendar)/CalendarComponents/calendarView";

const CalendarWrapper = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await getScheduledPosts();
        
        setPosts(data?.posts ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  if (loading) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#dc2626" />
        <ThemedText
          style={{
            marginTop: 12,
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          Loading Calendar…
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  return <CalendarView posts={posts} />;
};

export default CalendarWrapper;

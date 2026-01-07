import { getAnalytics } from "@/api/logsApi";
import { Ionicons } from "@expo/vector-icons";
import { HStack, Pressable, VStack } from "@gluestack-ui/themed";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { View } from "@gluestack-ui/themed";
import { TrendingUp } from "lucide-react-native";
import { ScrollView } from "react-native-gesture-handler";
import { LineChart } from "react-native-gifted-charts";

const { width } = Dimensions.get("window");

type ChartPoint = {
  value: number;
  label?: string;
};

export default function PostAnalytics() {
  const routePage = useRouter();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { postId } = useLocalSearchParams();

  const id = Number(postId);

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await getAnalytics(id);
        setAnalytics(res);
      } catch (error) {
        console.log("Error fetching analytics data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [id]);

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
          Loading Post Insights…
        </ThemedText>
      </ThemedView>
    );
  }

  const post = analytics?.post;
  const insight = post?.insight;
  const media = post?.mediaUrls;

  const isMultipleImages = Array.isArray(media) && media.length > 1;
  const isSingleImage = typeof media === "string";

  const history = analytics?.historicalData ?? [];

  // Likes line data
  const likesLineData: ChartPoint[] = history.map((item: any) => ({
    value: item.likes ?? 0,
    label: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  // Comments line data
  const commentsLineData: ChartPoint[] = history.map((item: any) => ({
    value: item.comments ?? 0,
  }));

  const handleRefreshClick = async () => {
    if (!id) {
      Alert.alert("Error", "Platform not available for refresh");
      return;
    }

    // if (isDeleted) {
    //   Alert.alert(
    //     "Post Deleted",
    //     "This post has been deleted from the platform."
    //   );
    //   return;
    // }

    try {
      await getAnalytics(id);
      Alert.alert("Success", "Post refreshed successfully");
    } catch (error) {
      console.log("Error refreshing Post:", error);
      Alert.alert("Error", "Failed to refresh Post");
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* ---------- HEADER ---------- */}
        <HStack className="mb-3">
          {/* LEFT: Back button */}
          <Pressable onPress={() => routePage.back()} style={{ padding: 6 }}>
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
            Post Insights
          </ThemedText>

          {/* RIGHT: Spacer */}
          <View style={{ width: 34 }} />
        </HStack>

        {/* ---------- POST INFO CARD ---------- */}
        <ThemedView
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: isDark ? "#1f2933" : "#ffffff",
            marginBottom: 16,
          }}
        >
          <ThemedText style={{ fontSize: 14, fontWeight: "600" }}>
            Platform: {post?.platform}
          </ThemedText>

          <ThemedText
            style={{
              marginTop: 6,
              fontSize: 15,
              fontWeight: "500",
              lineHeight: 22,
            }}
          >
            {post?.message}
          </ThemedText>

          <ThemedText
            style={{
              marginTop: 6,
              fontSize: 12,
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
          >
            Published on {new Date(post?.publishedAt).toDateString()}
          </ThemedText>

          <ThemedText
            style={{
              fontSize: 12,
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
          >
            Updated on {new Date(post?.updatedAt).toDateString()}
          </ThemedText>

          {/* Media */}
          {isMultipleImages && (
            <Carousel
              width={width - 64}
              height={220}
              data={media}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width: "100%", height: "100%", borderRadius: 12 }}
                  resizeMode="cover"
                />
              )}
            />
          )}

          {isSingleImage && (
            <Image
              source={{ uri: media }}
              style={{
                width: "100%",
                height: 220,
                borderRadius: 12,
                marginTop: 12,
              }}
              resizeMode="cover"
            />
          )}
        </ThemedView>

        {/* ---------- INSIGHTS CARD ---------- */}
        <ThemedView
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: isDark ? "#111827" : "#f9fafb",
            marginBottom: 20,
          }}
        >
          <HStack justifyContent="space-between">
            {[
              { label: "Likes", value: insight?.likes },
              { label: "Comments", value: insight?.comments },
              { label: "Impressions", value: insight?.impressions },
              { label: "Reach", value: insight?.reach },
            ].map((item) => (
              <VStack key={item.label} alignItems="center">
                <ThemedText style={{ fontSize: 16, fontWeight: "600" }}>
                  {item.value ?? 0}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 12,
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  {item.label}
                </ThemedText>
              </VStack>
            ))}

            <VStack alignItems="center">
              <TouchableOpacity onPress={handleRefreshClick}>
                <Ionicons
                  name="refresh"
                  size={20}
                  color={"#2563eb"}

                  //  isDark ? "#e5e7eb" : "#374151"
                />
              </TouchableOpacity>
              <ThemedText
                style={{ fontSize: 12, color: "#2563eb", marginTop: 4 }}
              >
                Refresh
              </ThemedText>
            </VStack>
          </HStack>
        </ThemedView>

        {/* ---------- ANALYTICS GRAPH CARD ---------- */}
        <ThemedView
          style={{
            padding: 16,
            borderRadius: 16,
            backgroundColor: isDark ? "#1f2937" : "#ffffff",
            overflow:"hidden"
          }}
        >
          <ThemedText
            style={{
              textAlign: "center",
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 12,
            }}
          >
            Performance Over Time
          </ThemedText>

          {history.length === 0 ? (
            <ThemedText
              style={{
                textAlign: "center",
                fontSize: 13,
                color: isDark ? "#9ca3af" : "#6b7280",
              }}
            >
              No analytics data available
            </ThemedText>
          ) : (
            <LineChart
              data={likesLineData}
              data2={commentsLineData}
              height={220}
              spacing={45}
              thickness={3}
              curved
              isAnimated
              animationDuration={800}
              color="#2563eb"
              color2="#16a34a"
              yAxisTextStyle={{
                color: isDark ? "#e5e7eb" : "#374151",
                fontSize: 12,
              }}
              xAxisLabelTextStyle={{
                color: isDark ? "#e5e7eb" : "#374151",
                fontSize: 12,
              }}
              maxValue={Math.max(
                ...likesLineData.map((d) => d.value),
                ...commentsLineData.map((d) => d.value),
                1
              )}
            />
          )}

          {/* Legend */}
          <HStack justifyContent="center" space="xl" mt="$4">
            <HStack alignItems="center" space="sm">
              <TrendingUp size={22} strokeWidth={2} color="#2563eb" />
              <ThemedText style={{ color: "#2563eb", fontWeight: "600" }}>
                Likes
              </ThemedText>
            </HStack>

            <HStack alignItems="center" space="sm">
              <TrendingUp size={22} strokeWidth={2} color="#16a34a" />
              <ThemedText style={{ color: "#16a34a", fontWeight: "600" }}>
                Comments
              </ThemedText>
            </HStack>
          </HStack>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

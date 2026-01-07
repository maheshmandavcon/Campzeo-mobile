import {
  View,
  Image,
  Alert,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { BlurView } from "expo-blur";
import Carousel from "react-native-reanimated-carousel";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VStack } from "@gluestack-ui/themed";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { getRefreshLog } from "@/api/logsApi";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

type LogsCardProps = {
  record: any;
  platformLabel: string | null;
};

export default function LogsCard({ record, platformLabel }: LogsCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const recordPostId = record?.id;
  const isDeleted = record?.insight?.isDeleted === true;
  const media = record?.mediaUrls;

  const hasMultipleImages = Array.isArray(media) && media.length > 1;
  const hasSingleImage =
    typeof media === "string" ||
    (Array.isArray(media) && media.length === 1);

  const singleImageUrl = typeof media === "string" ? media : media?.[0];

  const handleRefreshClick = async () => {
    if (!platformLabel) {
      Alert.alert("Error", "Platform not available for refresh");
      return;
    }

    if (isDeleted) {
      Alert.alert(
        "Post Deleted",
        "This post has been deleted from the platform."
      );
      return;
    }

    try {
      await getRefreshLog(platformLabel);
      Alert.alert("Success", "Log refreshed successfully");
    } catch (error) {
      console.log("Error refreshing log:", error);
      Alert.alert("Error", "Failed to refresh log");
    }
  };

  return (
    <ThemedView
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
    >
      {/* ---------- MEDIA ---------- */}
      {(hasSingleImage || hasMultipleImages) && (
        <ThemedView
          style={{
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          {hasSingleImage && (
            <Image
              source={{ uri: singleImageUrl }}
              style={{ width: "100%", height: 200 }}
              resizeMode="cover"
            />
          )}

          {hasMultipleImages && (
            <Carousel
              width={width - 64}
              height={200}
              data={media}
              pagingEnabled
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width: "100%", height: 200 }}
                  resizeMode="cover"
                />
              )}
            />
          )}

          {isDeleted && (
            <>
              <BlurView
                intensity={45}
                tint="dark"
                style={{
                  position: "absolute",
                  inset: 0,
                }}
              />
              <ThemedView
                style={{
                  position: "absolute",
                  inset: 0,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ThemedText
                  style={{
                    color: "#f87171",
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Post Deleted
                </ThemedText>
              </ThemedView>
            </>
          )}
        </ThemedView>
      )}

      {/* ---------- MESSAGE ---------- */}
      <ThemedText
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: isDeleted
            ? "#dc2626"
            : isDark
            ? "#e5e7eb"
            : "#111827",
          textDecorationLine: isDeleted ? "line-through" : "none",
          marginBottom: 6,
          lineHeight: 20,
        }}
      >
        {record.message}
      </ThemedText>

      {isDeleted && (
        <ThemedText
          style={{
            color: "#dc2626",
            fontSize: 12,
            fontWeight: "600",
            marginBottom: 6,
          }}
        >
          This post has been deleted
        </ThemedText>
      )}

      {/* ---------- INSIGHTS ---------- */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        {[
          { label: "Likes", value: record.insight?.likes },
          { label: "Comments", value: record.insight?.comments },
          { label: "Engagement", value: record.insight?.engagementRate },
        ].map((item) => (
          <VStack key={item.label} alignItems="center">
            <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
              {isDeleted ? "-" : item.value ?? "-"}
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
      </View>

      {/* ---------- DIVIDER ---------- */}
      <ThemedView
        style={{
          height: 1,
          backgroundColor: isDark ? "#1e293b" : "#e5e7eb",
          marginVertical: 14,
        }}
      />

      {/* ---------- ACTIONS ---------- */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
        }}
      >
        {/* Refresh */}
        <VStack alignItems="center">
          <TouchableOpacity
            disabled={isDeleted}
            onPress={handleRefreshClick}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={isDeleted ? "#9ca3af" : "#2563eb"}
            />
          </TouchableOpacity>
          <ThemedText
            style={{
              color: isDeleted ? "#9ca3af" : "#2563eb",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Refresh
          </ThemedText>
        </VStack>

        {/* Analytics */}
        <VStack alignItems="center">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(tabs)/logs/postAnalytics",
                params: { postId: Number(recordPostId) },
              })
            }
          >
            <Ionicons
              name="stats-chart"
              size={20}
              color="#2563eb"
            />
          </TouchableOpacity>
          <ThemedText
            style={{
              color: "#2563eb",
              fontSize: 12,
              marginTop: 4,
            }}
          >
            Analytics
          </ThemedText>
        </VStack>
      </View>
    </ThemedView>
  );
}

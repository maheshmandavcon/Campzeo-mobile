import {
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Text,
} from "react-native";
import { useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { refreshPost } from "@/api/logsApi";
import { useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { useAuth } from "@/context/AuthContext";
import Toast from "react-native-toast-message";


const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // accounted for parent container padding

type LogsCardProps = {
  record: any;
  platformLabel: string | null;
};

export default function LogsCard({ record, platformLabel }: LogsCardProps) {
  const router = useRouter();
  const { token } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Card local states
  const [insight, setInsight] = useState(record?.insight);
  const [syncing, setSyncing] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Sync state if record updates from parent
  useEffect(() => {
    setInsight(record?.insight);
  }, [record?.insight]);

  const isDeleted = insight?.isDeleted === true;
  const platformName = (record?.platform || "EMAIL").toUpperCase();

  // Safely parse mediaUrls JSON string
  let mediaList: string[] = [];
  try {
    if (record?.mediaUrls) {
      if (typeof record.mediaUrls === "string") {
        mediaList = JSON.parse(record.mediaUrls);
      } else if (Array.isArray(record.mediaUrls)) {
        mediaList = record.mediaUrls;
      }
    }
  } catch (err) {
    console.log("Error parsing mediaUrls JSON:", err);
    if (typeof record?.mediaUrls === "string" && record.mediaUrls.startsWith("http")) {
      mediaList = [record.mediaUrls];
    }
  }

  // Ensure media array is valid and cleaned from escape slashes
  mediaList = (mediaList || []).map((url) => url.trim());

  // Check if media contains video formats
  const isVideoFormat = (url: string) => {
    const lower = url.toLowerCase();
    return (
      lower.endsWith(".mp4") ||
      lower.endsWith(".mov") ||
      lower.endsWith(".webm") ||
      lower.includes("video")
    );
  };

  // Get brand specific configurations
  const getBrandDetails = (pName: string) => {
    switch (pName) {
      case "EMAIL": return { icon: "mail-outline", color: "#f59e0b", label: "Email" };
      case "SMS": return { icon: "chatbubble-ellipses-outline", color: "#10b981", label: "SMS" };
      case "FACEBOOK": return { icon: "logo-facebook", color: "#1877F2", label: "Facebook" };
      case "INSTAGRAM": return { icon: "logo-instagram", color: "#c13584", label: "Instagram" };
      case "LINKEDIN": return { icon: "logo-linkedin", color: "#0A66C2", label: "LinkedIn" };
      case "YOUTUBE": return { icon: "logo-youtube", color: "#FF0000", label: "YouTube" };
      case "PINTEREST": return { icon: "logo-pinterest", color: "#E60023", label: "Pinterest" };
      case "WHATSAPP": return { icon: "logo-whatsapp", color: "#25D366", label: "WhatsApp" };
      default: return { icon: "globe-outline", color: "#6b7280", label: pName };
    }
  };

  const brand = getBrandDetails(platformName);

  // Sync statistics from APIs
  const handleRefreshClick = async () => {
    if (!token) return;
    if (isDeleted) {
      Toast.show({
        type: "info",
        text1: "Post Deleted",
        text2: "This post has been deleted from the social media channel.",
      });
      return;
    }

    setSyncing(true);
    try {
      const res = await refreshPost(token, record.id, platformName, record.postId);
      if (res?.post?.insight) {
        setInsight(res.post.insight);
        Toast.show({
          type: "success",
          text1: "Performance Synced",
          text2: "Stats updated successfully with live social records.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Sync Failed",
          text2: "Social insights did not return any updated metrics.",
        });
      }
    } catch (error) {
      console.log("Error syncing live stats:", error);
      Toast.show({
        type: "error",
        text1: "Sync Error",
        text2: "Could not fetch latest social details. Please try again.",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ThemedView
      style={{
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      {/* ---------- HEADER ---------- */}
      <HStack style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <HStack style={{ alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "#1e293b" : `${brand.color}15`,
            }}
          >
            <Ionicons name={brand.icon as any} size={16} color={brand.color} />
          </View>
          <VStack style={{ gap: 2 }}>
            <ThemedText style={{ fontSize: 14, fontWeight: "800" }} numberOfLines={1}>
              {record?.campaignName || "Untitled Campaign"}
            </ThemedText>
            <Text style={{ fontSize: 11, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b" }}>
              {brand.label} • {record.publishedAt ? new Date(record.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              }) : "Sent"}
            </Text>
          </VStack>
        </HStack>

        {isDeleted && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
              backgroundColor: "#fef2f2",
            }}
          >
            <Text style={{ color: "#ef4444", fontSize: 10, fontWeight: "800" }}>DELETED</Text>
          </View>
        )}
      </HStack>

      {/* ---------- MULTI-MEDIA CAROUSEL SLIDER ---------- */}
      {mediaList.length > 0 && (
        <View style={{ marginBottom: 12, borderRadius: 14, overflow: "hidden", position: "relative" }}>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={mediaList}
            keyExtractor={(url) => url}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
              if (slide !== activeMediaIndex) {
                setActiveMediaIndex(slide);
              }
            }}
            renderItem={({ item: url }) => {
              const isVideo = isVideoFormat(url);
              
              if (isVideo) {
                return (
                  <View
                    style={{
                      width: CARD_WIDTH - 32,
                      height: 180,
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: "#000000",
                    }}
                  >
                    <WebView
                      source={{
                        html: `
                          <html>
                            <head>
                              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                              <style>
                                html, body {
                                  margin: 0;
                                  padding: 0;
                                  width: 100%;
                                  height: 100%;
                                  background: #000000;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  overflow: hidden;
                                }
                                video {
                                  width: 100%;
                                  height: 100%;
                                  object-fit: contain;
                                }
                              </style>
                            </head>
                            <body>
                              <video
                                src="${url}"
                                controls
                                playsinline
                              />
                            </body>
                          </html>
                        `,
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: "#000000",
                      }}
                      javaScriptEnabled
                      domStorageEnabled
                    />
                  </View>
                );
              }

              return (
                <View style={{ width: CARD_WIDTH - 32, height: 180, position: "relative" }}>
                  <Image
                    source={{ uri: url }}
                    style={{ width: "100%", height: "100%", borderRadius: 12 }}
                    resizeMode="cover"
                  />
                </View>
              );
            }}
          />

          {/* Dots Indicator for Multi-Images */}
          {mediaList.length > 1 && (
            <HStack
              style={{
                position: "absolute",
                bottom: 8,
                left: 0,
                right: 0,
                justifyContent: "center",
                gap: 5,
              }}
            >
              {mediaList.map((_, idx) => (
                <View
                  key={idx}
                  style={{
                    width: idx === activeMediaIndex ? 14 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: idx === activeMediaIndex ? "#ffffff" : "rgba(255,255,255,0.5)",
                  }}
                />
              ))}
            </HStack>
          )}
        </View>
      )}

      {/* ---------- POST MESSAGE ---------- */}
      {record.message && (
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: "500",
            lineHeight: 18,
            color: isDark ? "#cbd5e1" : "#334155",
            marginBottom: 12,
            textDecorationLine: isDeleted ? "line-through" : "none",
          }}
          numberOfLines={2}
        >
          {record.message}
        </ThemedText>
      )}

      {/* ---------- METRICS COUNTERS GRID ---------- */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          backgroundColor: isDark ? "#0f172a" : "#f8fafc",
          borderRadius: 12,
          padding: 10,
          borderWidth: 1,
          borderColor: isDark ? "#1e293b" : "#f1f5f9",
          gap: 8,
        }}
      >
        {[
          { label: "Reach", value: insight?.reach },
          { label: "Likes", value: insight?.likes },
          { label: "Comments", value: insight?.comments },
          { label: "Engagement", value: `${((insight?.engagementRate ?? 0) * 100).toFixed(1)}%` },
        ].map((item) => (
          <VStack key={item.label} style={{ alignItems: "center", width: "22%" }}>
            <ThemedText style={{ fontSize: 13, fontWeight: "800" }}>
              {isDeleted ? "-" : item.value ?? 0}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: isDark ? "#94a3b8" : "#64748b",
                marginTop: 2,
              }}
            >
              {item.label}
            </ThemedText>
          </VStack>
        ))}
      </View>

      {/* ---------- SEPARATOR ---------- */}
      <View
        style={{
          height: 1,
          backgroundColor: isDark ? "#1e293b" : "#e2e8f0",
          marginVertical: 12,
        }}
      />

      {/* ---------- CARD INTERACTIVE ACTIONS ---------- */}
      <HStack style={{ justifyContent: "flex-end", alignItems: "center" }}>
        {/* Refresh Sync Action */}
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={syncing || isDeleted}
          onPress={handleRefreshClick}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 4,
            paddingHorizontal: 8,
          }}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="#dc2626" />
          ) : (
            <Ionicons name="sync-outline" size={16} color={isDeleted ? "#94a3b8" : "#dc2626"} />
          )}
          <Text style={{ fontSize: 12, fontWeight: "700", color: isDeleted ? "#94a3b8" : "#dc2626" }}>
            {syncing ? "Syncing..." : "Sync Stats"}
          </Text>
        </TouchableOpacity>

        {/* View Details Analytics Action */}
        {/* <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/logs/postAnalytics",
              params: { postId: Number(record.id) },
            })
          }
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingVertical: 4,
            paddingHorizontal: 8,
          }}
        >
          <Ionicons name="bar-chart-outline" size={16} color="#3b82f6" />
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#3b82f6" }}>
            Analytics
          </Text>
        </TouchableOpacity> */}
      </HStack>
    </ThemedView>
  );
}

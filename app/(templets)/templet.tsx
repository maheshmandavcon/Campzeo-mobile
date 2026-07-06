import React, { useState, useCallback } from "react";
import {
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  useColorScheme,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTemplatesApi, deleteTemplateApi } from "@/api/templetsApi";
import { useAuth } from "@/context/AuthContext";
import { getUser } from "@/api/dashboardApi";

type PlatformType =
  | "ALL"
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "YOUTUBE"
  | "LINKEDIN"
  | "PINTEREST";

interface Template {
  id: string | number;
  name: string;
  content: string;
  platform: PlatformType;
  createdDate: string;
  metadata?: string;
  mediaUrls?: string[];
}

const PLATFORM_FILTERS: {
  label: string;
  value: PlatformType;
  icon?: string;
  iconLib?: "ionicons" | "fontawesome";
  color: string;
}[] = [
    { label: "All", value: "ALL", color: "#6b7280" },
    { label: "Email", value: "EMAIL", icon: "mail", iconLib: "ionicons", color: "#f59e0b" },
    { label: "Instagram", value: "INSTAGRAM", icon: "instagram", iconLib: "fontawesome", color: "#c13584" },
    { label: "Facebook", value: "FACEBOOK", icon: "facebook-square", iconLib: "fontawesome", color: "#1877F2" },
    { label: "YouTube", value: "YOUTUBE", icon: "youtube-play", iconLib: "fontawesome", color: "#FF0000" },
    { label: "LinkedIn", value: "LINKEDIN", icon: "linkedin-square", iconLib: "fontawesome", color: "#0A66C2" },
    { label: "Pinterest", value: "PINTEREST", icon: "pinterest", iconLib: "fontawesome", color: "#E60023" },
    { label: "SMS", value: "SMS", icon: "chatbubble-ellipses-outline", iconLib: "ionicons", color: "#10b981" },
    { label: "WhatsApp", value: "WHATSAPP", icon: "logo-whatsapp", iconLib: "ionicons", color: "#25D366" },
  ];


const getPlatformColor = (platform: PlatformType): string =>
  PLATFORM_FILTERS.find((p) => p.value === platform)?.color ?? "#6b7280";

const getPlatformIcon = (platform: PlatformType) => {
  const p = PLATFORM_FILTERS.find((f) => f.value === platform);
  return p;
};

const MOCK_TEMPLATES: Template[] = [];

const NON_ALL_PLATFORMS = PLATFORM_FILTERS.filter((f) => f.value !== "ALL");

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Templates() {
  const isDark = useColorScheme() === "dark";

  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("ALL");
  const [orderedPlatformFilters, setOrderedPlatformFilters] = useState(
    NON_ALL_PLATFORMS.map((f) => f.value) as PlatformType[]
  );
  const platformScrollRef = React.useRef<ScrollView>(null);

  const handlePlatformSelect = (platform: PlatformType) => {
    setSelectedPlatform(platform);
    if (platform === "ALL") {
      setTimeout(() => platformScrollRef.current?.scrollTo({ x: 0, animated: false }), 0);
      return;
    }
    setOrderedPlatformFilters((prev) => {
      if (platform === selectedPlatform) return prev;
      const filtered = prev.filter(
        (p) => p !== platform && p !== selectedPlatform
      );
      const tail = selectedPlatform !== "ALL" ? [...filtered, selectedPlatform] : filtered;
      return [platform, ...tail];
    });
    setTimeout(() => platformScrollRef.current?.scrollTo({ x: 0, animated: false }), 0);
  };
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { getToken } = useAuth();
  const [organisationId, setOrganisationId] = useState<number | undefined>(undefined);

  React.useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const user = await getUser();
        if (user?.organisation?.id) {
          setOrganisationId(user.organisation.id);
        }
      } catch (err) {
        console.warn("Could not fetch organisationId:", err);
      }
    };
    fetchOrgId();
  }, []);

  const fetchTemplates = useCallback(async (isRefresh = false) => {
    if (!organisationId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const token = await getToken();
      const res = await getTemplatesApi(organisationId, token || undefined);
      setTemplates(res || []);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [organisationId, getToken]);

  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
    }, [fetchTemplates])
  );

  // Filter logic
  const filteredTemplates = templates.filter((t) => {
    const matchesPlatform =
      selectedPlatform === "ALL" || t.platform === selectedPlatform;
    const matchesSearch =
      (t.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.content || "").toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const handleDelete = async (id: string | number) => {
    if (!organisationId) return;
    try {
      const token = await getToken();
      await deleteTemplateApi(organisationId, Number(id), token || undefined);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const renderPlatformIcon = (platform: PlatformType, size = 14) => {
    const config = getPlatformIcon(platform);
    if (!config?.icon) return null;
    if (config.iconLib === "fontawesome") {
      return <FontAwesome name={config.icon as any} size={size} color={config.color} />;
    }
    return <Ionicons name={config.icon as any} size={size} color={config.color} />;
  };

  const renderTemplateCard = ({ item }: { item: Template }) => {
    const platformColor = getPlatformColor(item.platform);
    return (
      <ThemedView
        style={{
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isDark ? "#374151" : "#e5e7eb",
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: `${platformColor}22`,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 20,
              marginRight: 10,
            }}
          >
            {renderPlatformIcon(item.platform)}
            <ThemedText style={{ fontSize: 11, fontWeight: "600", color: platformColor, marginLeft: 4 }}>
              {item.platform}
            </ThemedText>
          </View>

          <ThemedText
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: "700",
              color: isDark ? "#f3f4f6" : "#111827",
            }}
            numberOfLines={1}
          >
            {item.name}
          </ThemedText>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: "/(templets)/createTemplet",
                  params: {
                    editId: String(item.id),
                    editName: item.name,
                    editPlatform: item.platform,
                    editContent: item.content,
                    editSubject: item.metadata ? (() => { try { return JSON.parse(item.metadata!).subject || ""; } catch { return ""; } })() : "",
                    editMetadata: item.metadata || "",
                    editMediaUrls: item.mediaUrls ? JSON.stringify(item.mediaUrls) : "",
                  },
                });
              }}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: isDark ? "#374151" : "#f3f4f6",
              }}
            >
              <Ionicons name="pencil-outline" size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: isDark ? "#374151" : "#f3f4f6",
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content preview */}
        <ThemedText
          style={{
            fontSize: 13,
            color: isDark ? "#9ca3af" : "#6b7280",
            lineHeight: 20,
          }}
          numberOfLines={3}
        >
          {item.content}
        </ThemedText>

        {item.mediaUrls && item.mediaUrls.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
            {item.mediaUrls.map((url, idx) => {
              const urlLower = url.toLowerCase();
              const isVideo = urlLower.includes('.mp4') || urlLower.includes('.mov');
              const isPdf = urlLower.includes('.pdf');
              return (
                <View
                  key={idx}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    backgroundColor: isDark ? "#374151" : "#f3f4f6",
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isDark ? "#4b5563" : "#e5e7eb",
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8
                  }}
                >
                  {!isPdf && !isVideo ? (
                    <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Ionicons
                      name={isVideo ? "videocam-outline" : "document-text-outline"}
                      size={24}
                      color={isDark ? "#9ca3af" : "#6b7280"}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        <ThemedText
          style={{
            fontSize: 11,
            color: isDark ? "#6b7280" : "#9ca3af",
            marginTop: 8,
            textAlign: "right",
          }}
        >
          {item.createdDate ? new Date(item.createdDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }) : ""}
        </ThemedText>
      </ThemedView>
    );
  };

  const EmptyState = () => (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 64,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: isDark ? "#1f2937" : "#fef2f2",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Ionicons
          name="document-text-outline"
          size={38}
          color={isDark ? "#dc2626" : "#dc2626"}
        />
      </View>
      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 8,
          color: isDark ? "#f3f4f6" : "#111827",
        }}
      >
        {search || selectedPlatform !== "ALL"
          ? "No templates match your filter"
          : "No templates yet"}
      </ThemedText>
      <ThemedText
        style={{
          fontSize: 14,
          textAlign: "center",
          color: isDark ? "#9ca3af" : "#6b7280",
          lineHeight: 20,
          marginBottom: 24,
        }}
      >
        {search || selectedPlatform !== "ALL"
          ? "Try clearing your search or selecting a different platform."
          : 'Tap “New Template” to create your first reusable message.'}

      </ThemedText>
      {!search && selectedPlatform === "ALL" && (
        <TouchableOpacity
          onPress={() => router.push("/(templets)/createTemplet")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#dc2626",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 24,
            gap: 8,
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <ThemedText style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
            New Template
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
    >
      <ThemedView
        style={{
          flex: 1,
          backgroundColor: isDark ? "#161618" : "#f3f4f6",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            backgroundColor: isDark ? "#161618" : "#f3f4f6",
          }}
        >
          <ThemedText
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: isDark ? "#f3f4f6" : "#111827",
            }}
          >
            Message Templates
          </ThemedText>

          <TouchableOpacity
            onPress={() => router.push("/(templets)/createTemplet")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#dc2626",
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 24,
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <ThemedText style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
              New Template
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        <View
          style={{
            paddingHorizontal: 16,
            backgroundColor: isDark ? "#161618" : "#f3f4f6",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: isDark ? "#374151" : "#e5e7eb",
              paddingHorizontal: 12,
              paddingVertical: 2,
            }}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={isDark ? "#9ca3af" : "#6b7280"}
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search templates..."
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              style={{
                flex: 1,
                paddingVertical: 10,
                fontSize: 14,
                color: isDark ? "#f3f4f6" : "#111827",
              }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={isDark ? "#9ca3af" : "#9ca3af"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          ref={platformScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginTop: 8 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 4,
            gap: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {(() => {
            const allFilter = PLATFORM_FILTERS.find((f) => f.value === "ALL")!;
            const isActive = selectedPlatform === "ALL";
            return (
              <TouchableOpacity
                key="ALL"
                onPress={() => handlePlatformSelect("ALL")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: isActive ? allFilter.color : isDark ? "#374151" : "#e5e7eb",
                  backgroundColor: isActive
                    ? `${allFilter.color}22`
                    : isDark
                      ? "#1f2937"
                      : "#ffffff",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? allFilter.color : isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  {allFilter.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })()}

          {orderedPlatformFilters.map((pValue) => {
            const filter = PLATFORM_FILTERS.find((f) => f.value === pValue)!;
            const isActive = selectedPlatform === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => handlePlatformSelect(filter.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: isActive ? filter.color : isDark ? "#374151" : "#e5e7eb",
                  backgroundColor: isActive
                    ? `${filter.color}22`
                    : isDark
                      ? "#1f2937"
                      : "#ffffff",
                }}
              >
                {filter.icon &&
                  (filter.iconLib === "fontawesome" ? (
                    <FontAwesome
                      name={filter.icon as any}
                      size={13}
                      color={isActive ? filter.color : isDark ? "#9ca3af" : "#6b7280"}
                    />
                  ) : (
                    <Ionicons
                      name={filter.icon as any}
                      size={14}
                      color={isActive ? filter.color : isDark ? "#9ca3af" : "#6b7280"}
                    />
                  ))}
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? filter.color : isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  {filter.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filteredTemplates.length > 0 && (
          <ThemedText
            style={{
              paddingHorizontal: 16,
              paddingBottom: 8,
              fontSize: 12,
              color: isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} found
          </ThemedText>
        )}

        <FlatList
          data={filteredTemplates}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTemplateCard}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 120,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTemplates(true)}
              tintColor="#dc2626"
              colors={["#dc2626"]}
            />
          }
        />
      </ThemedView>
    </SafeAreaView>
  );
}

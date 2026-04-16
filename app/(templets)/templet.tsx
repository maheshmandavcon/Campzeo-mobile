import React, { useState, useRef, useEffect, useCallback } from "react";

import {
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  useColorScheme,
  Alert,
  Image,
  Modal,
} from "react-native";


import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { templetApi, TemplateData } from "@/api/templetApi";
import { Animated } from "react-native";


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

interface Template extends TemplateData {
  id: number;
}

interface FilterOption {
  label: string;
  value: PlatformType;
  icon?: string;
  iconLib?: "ionicons" | "fontawesome";
  color: string;
}

const getPlatformColor = (platform: PlatformType): string => {
  const PLATFORMS_MAP = [
    { label: "All", value: "ALL", color: "#6b7280" },
    { label: "Email", value: "EMAIL", color: "#f59e0b" },
    { label: "Instagram", value: "INSTAGRAM", color: "#c13584" },
    { label: "Facebook", value: "FACEBOOK", color: "#1877F2" },
    { label: "YouTube", value: "YOUTUBE", color: "#FF0000" },
    { label: "LinkedIn", value: "LINKEDIN", color: "#0A66C2" },
    { label: "Pinterest", value: "PINTEREST", color: "#E60023" },
    { label: "SMS", value: "SMS", color: "#10b981" },
    { label: "WhatsApp", value: "WHATSAPP", color: "#25D366" },
  ];
  return PLATFORMS_MAP.find((p) => p.value === platform)?.color ?? "#6b7280";
};

const getPlatformIcon = (platform: PlatformType) => {
  const PLATFORMS_MAP = [
    { value: "ALL", icon: "apps-outline", iconLib: "ionicons", color: "#6b7280" },
    { value: "EMAIL", icon: "mail", iconLib: "ionicons", color: "#f59e0b" },
    { value: "INSTAGRAM", icon: "instagram", iconLib: "fontawesome", color: "#c13584" },
    { value: "FACEBOOK", icon: "facebook-square", iconLib: "fontawesome", color: "#1877F2" },
    { value: "YOUTUBE", icon: "youtube-play", iconLib: "fontawesome", color: "#FF0000" },
    { value: "LINKEDIN", icon: "linkedin-square", iconLib: "fontawesome", color: "#0A66C2" },
    { value: "PINTEREST", icon: "pinterest", iconLib: "fontawesome", color: "#E60023" },
    { value: "SMS", icon: "chatbubble-ellipses-outline", iconLib: "ionicons", color: "#10b981" },
    { value: "WHATSAPP", icon: "logo-whatsapp", iconLib: "ionicons", color: "#25D366" },
  ];
  return PLATFORMS_MAP.find((f) => f.value === platform);
};

const getPlatformLabel = (platform: string) => {
  const PLATFORMS_MAP = [
    { label: "All", value: "ALL" },
    { label: "Email", value: "EMAIL" },
    { label: "Instagram", value: "INSTAGRAM" },
    { label: "Facebook", value: "FACEBOOK" },
    { label: "YouTube", value: "YOUTUBE" },
    { label: "LinkedIn", value: "LINKEDIN" },
    { label: "Pinterest", value: "PINTEREST" },
    { label: "SMS", value: "SMS" },
    { label: "WhatsApp", value: "WHATSAPP" },
  ];
  const filter = PLATFORMS_MAP.find((p) => p.value === platform);
  return filter ? filter.label : platform;
};


export default function Templates() {

  const isDark = useColorScheme() === "dark";

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterOption[]>([
    { label: "All", value: "ALL", icon: "apps-outline", iconLib: "ionicons", color: "#6b7280" },
    { label: "Email", value: "EMAIL", icon: "mail", iconLib: "ionicons", color: "#f59e0b" },
    { label: "Instagram", value: "INSTAGRAM", icon: "instagram", iconLib: "fontawesome", color: "#c13584" },
    { label: "Facebook", value: "FACEBOOK", icon: "facebook-square", iconLib: "fontawesome", color: "#1877F2" },
    { label: "YouTube", value: "YOUTUBE", icon: "youtube-play", iconLib: "fontawesome", color: "#FF0000" },
    { label: "LinkedIn", value: "LINKEDIN", icon: "linkedin-square", iconLib: "fontawesome", color: "#0A66C2" },
    { label: "Pinterest", value: "PINTEREST", icon: "pinterest", iconLib: "fontawesome", color: "#E60023" },
    { label: "SMS", value: "SMS", icon: "chatbubble-ellipses-outline", iconLib: "ionicons", color: "#10b981" },
    { label: "WhatsApp", value: "WHATSAPP", icon: "logo-whatsapp", iconLib: "ionicons", color: "#25D366" },
  ]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("ALL");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handlePlatformFilter = (platform: PlatformType, index: number) => {
    setSelectedPlatform(platform);
    if (index === 0) return;

    setFilters((prev) => {
      const allTab = prev[0];
      const others = prev.slice(1);
      const otherIndex = index - 1;
      const rotatedOthers = [
        ...others.slice(otherIndex),
        ...others.slice(0, otherIndex)
      ];
      return [allTab, ...rotatedOthers];
    });
  };

  const filterScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (filterScrollRef.current) {
      filterScrollRef.current.scrollTo({ x: 0, animated: true });
    }
  }, [selectedPlatform]);

  const getTemplateCount = (platform: PlatformType) => {
    if (platform === "ALL") return templates.length;
    return templates.filter((t) => t.platform === platform).length;
  };

  const fetchTemplates = async () => {

    setLoading(true);
    try {
      const response = await templetApi.getTemplates();
      if (response.success) {
        setTemplates(response.data as Template[]);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
    }, [])
  );

  const filteredTemplates = templates.filter((t) => {
    const matchesPlatform =
      selectedPlatform === "ALL" || t.platform === selectedPlatform;
    const matchesSearch =
      (t.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.content || "").toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const handleDelete = (id: number) => {
    Alert.alert("Delete Template", "Are you sure you want to delete this template?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await templetApi.deleteTemplate(id);
            if (response.success) {
              setTemplates((prev) => prev.filter((t) => t.id !== id));
              Alert.alert("Success", response.message || "Template deleted successfully");
            } else {
              Alert.alert("Error", response.message || "Failed to delete template");
            }
          } catch (err: any) {
            console.error("Delete error:", err);
            Alert.alert("Error", err.response?.data?.message || err.message || "An error occurred while deleting.");
          }
        },
      },
    ]);
  };

  const renderPlatformIcon = (platform: PlatformType, size = 14) => {
    const config = getPlatformIcon(platform);
    if (!config?.icon) return null;
    if (config.iconLib === "fontawesome") {
      return <FontAwesome name={config.icon as any} size={size} color={config.color} />;
    }
    return <Ionicons name={config.icon as any} size={size} color={config.color} />;
  };

  const MiniPreview = ({ item }: { item: Template }) => {
    const platform = item.platform as PlatformType;
    const mediaUrl = item.mediaUrls && item.mediaUrls.length > 0 ? item.mediaUrls[0] : null;

    if (platform === "SMS" || platform === "WHATSAPP") {
      const isWhatsApp = platform === "WHATSAPP";
      const hasMedia = isWhatsApp && item.mediaUrls && item.mediaUrls.length > 0;

      return (
        <View style={{
          backgroundColor: isDark ? (isWhatsApp ? "#056162" : "#374151") : (isWhatsApp ? "#DCF8C6" : "#007AFF"),
          borderRadius: 12,
          borderBottomRightRadius: 2,
          padding: 10,
          marginTop: 8,
          alignSelf: "flex-end",
          maxWidth: "94%",
          minWidth: hasMedia ? 200 : undefined,
        }}>
          {hasMedia && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setPreviewImage(item.mediaUrls![0])}
              style={{ marginBottom: 6, borderRadius: 6, overflow: "hidden", width: "100%" }}
            >
              <Image source={{ uri: item.mediaUrls![0] }} style={{ width: "100%", aspectRatio: 4 / 3 }} resizeMode="cover" />
            </TouchableOpacity>
          )}
          <ThemedText style={{ fontSize: 13, color: (isDark || !isWhatsApp) ? "#fff" : "#000" }}>{item.content}</ThemedText>
        </View>

      );
    }

    return (
      <View style={{
        marginTop: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDark ? "#374151" : "#e5e7eb",
        overflow: "hidden",
        backgroundColor: isDark ? "#111827" : "#f9fafb"
      }}>
        {(platform === "FACEBOOK" || platform === "INSTAGRAM" || platform === "LINKEDIN") && (
          <View style={{ padding: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#E4E6EB", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="person" size={12} color="#8A8D91" />
            </View>
            <ThemedText style={{ fontSize: 11, fontWeight: "700" }}>Your Brand</ThemedText>
          </View>
        )}

        {mediaUrl && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setPreviewImage(mediaUrl)}
            style={{ aspectRatio: 1.91, backgroundColor: "#000" }}
          >
            <Image source={{ uri: mediaUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          </TouchableOpacity>
        )}

        <View style={{ padding: 10 }}>
          {item.subject ? (
            <ThemedText style={{ fontSize: 13, fontWeight: "700", marginBottom: 4 }} numberOfLines={1}>{item.subject}</ThemedText>
          ) : null}
          <ThemedText style={{ fontSize: 12, color: isDark ? "#9ca3af" : "#6b7280" }} numberOfLines={2}>{item.content}</ThemedText>
        </View>
      </View>
    );
  };

  const SkeletonCard = () => {
    const opacity = React.useRef(new Animated.Value(0.3)).current;

    React.useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    return (
      <ThemedView
        style={{
          backgroundColor: isDark ? "#1f2937" : "#ffffff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isDark ? "#374151" : "#e5e7eb",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Animated.View style={{ width: 60, height: 20, borderRadius: 10, backgroundColor: isDark ? "#374151" : "#e5e7eb", opacity }} />
          <Animated.View style={{ flex: 1, height: 20, borderRadius: 4, backgroundColor: isDark ? "#374151" : "#e5e7eb", marginLeft: 10, opacity }} />
        </View>
        <Animated.View style={{ height: 60, borderRadius: 8, backgroundColor: isDark ? "#374151" : "#e5e7eb", marginBottom: 12, opacity }} />
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Animated.View style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: isDark ? "#374151" : "#e5e7eb", opacity }} />
        </View>
      </ThemedView>
    );
  };

  const renderTemplateCard = ({ item }: { item: Template }) => {

    const platformColor = getPlatformColor(item.platform as PlatformType);

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

            {renderPlatformIcon(item.platform as PlatformType)}

            <ThemedText style={{ fontSize: 11, fontWeight: "600", color: platformColor, marginLeft: 4 }}>
              {getPlatformLabel(item.platform)}
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
                  params: { id: item.id },
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

        <MiniPreview item={item} />

        <ThemedText
          style={{
            fontSize: 11,
            color: isDark ? "#6b7280" : "#9ca3af",
            marginTop: 8,
            textAlign: "right",
          }}
        >
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN", {
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
      edges={["top", "bottom"]}
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
            paddingBottom: 8,
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
          ref={filterScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginVertical: 10 }}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            gap: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >

          {filters.map((filter, index) => {
            const isActive = selectedPlatform === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                onPress={() => handlePlatformFilter(filter.value, index)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  height: 36,
                  justifyContent: "center",
                  borderRadius: 18,
                  borderWidth: 1.5,
                  borderColor: isActive ? filter.color : isDark ? "#374151" : "#e5e7eb",
                  backgroundColor: isActive
                    ? `${filter.color}22`
                    : isDark
                      ? "#1f2937"
                      : "#ffffff",
                }}
              >
                {(filter.value === "ALL" ? "apps" : filter.icon) &&
                  (filter.iconLib === "fontawesome" ? (
                    <FontAwesome
                      name={(filter.value === "ALL" ? "th-large" : filter.icon) as any}
                      size={13}
                      color={isActive ? filter.color : isDark ? "#9ca3af" : "#6b7280"}
                    />
                  ) : (
                    <Ionicons
                      name={(filter.value === "ALL" ? "apps" : filter.icon) as any}
                      size={13}
                      color={isActive ? filter.color : isDark ? "#9ca3af" : "#6b7280"}
                    />
                  ))}
                <ThemedText
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? filter.color : isDark ? "#9ca3af" : "#6b7280",
                    includeFontPadding: false,
                    textAlignVertical: "center",
                  }}
                  numberOfLines={1}
                >
                  {filter.label}
                </ThemedText>

                {filter.value !== "ALL" && getTemplateCount(filter.value) > 0 && (
                  <View style={{
                    backgroundColor: isActive ? filter.color : isDark ? "#374151" : "#e5e7eb",
                    paddingHorizontal: 6,
                    height: 18,
                    minWidth: 18,
                    borderRadius: 9,
                    marginLeft: 4,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <ThemedText style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: isActive ? "#fff" : isDark ? "#fff" : "#666",
                      includeFontPadding: false,
                      textAlignVertical: "center"
                    }}>
                      {getTemplateCount(filter.value)}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>


            );
          })}
        </ScrollView>

        {loading && (
          <View style={{ paddingHorizontal: 16 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        )}

        {!loading && filteredTemplates.length > 0 && (
          <ThemedText
            style={{
              paddingHorizontal: 16,
              paddingBottom: 4,
              fontSize: 12,
              color: isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} found
          </ThemedText>

        )}

        <FlatList
          data={loading ? [] : filteredTemplates}

          keyExtractor={(item) => item.id.toString()}

          renderItem={renderTemplateCard}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 120,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={!loading ? <EmptyState /> : null}
        />

      </ThemedView>

      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            style={{ position: "absolute", top: 40, right: 20, zIndex: 1, padding: 10 }}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{ width: "100%", height: "80%" }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}


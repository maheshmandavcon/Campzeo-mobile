import React, { useState, useCallback } from "react";
import {
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  useColorScheme,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ──────────────────────────────────────────────────────────────────

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
  id: string;
  title: string;
  content: string;
  platform: PlatformType;
  createdAt: string;
}

// ─── Platform filter config ──────────────────────────────────────────────────

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

const handlePlatformFilter = (platform: PlatformType, setSelectedPlatform: (p: PlatformType) => void) => {
  if (platform === "SMS" || platform === "WHATSAPP") {
    Alert.alert(
      "Admin Approval Required",
      "You need admin approval and a credits pack to view/manage templates for SMS/WhatsApp.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Purchase Pack", onPress: () => router.push("/(tabs)/accounts" as any) }
      ]
    );
    return;
  }
  setSelectedPlatform(platform);
};

const getPlatformColor = (platform: PlatformType): string =>
  PLATFORM_FILTERS.find((p) => p.value === platform)?.color ?? "#6b7280";

const getPlatformIcon = (platform: PlatformType) => {
  const p = PLATFORM_FILTERS.find((f) => f.value === platform);
  return p;
};

// ─── Mock data (replace with API call) ──────────────────────────────────────

const MOCK_TEMPLATES: Template[] = [
  // Uncomment below to see real data; empty array triggers empty state
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Templates() {
  const isDark = useColorScheme() === "dark";

  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("ALL");
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);
  // const [loading, setLoading] = useState(false); // enable when API is wired up

  // Fetch templates from API (replace MOCK_TEMPLATES with real API call)
  useFocusEffect(
    useCallback(() => {
      // TODO: Replace with actual API fetch
      // const fetchTemplates = async () => { ... };
      // fetchTemplates();
    }, [])
  );

  // Filter logic
  const filteredTemplates = templates.filter((t) => {
    const matchesPlatform =
      selectedPlatform === "ALL" || t.platform === selectedPlatform;
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const handleDelete = (id: string) => {
    Alert.alert("Delete Template", "Are you sure you want to delete this template?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setTemplates((prev) => prev.filter((t) => t.id !== id)),
      },
    ]);
  };

  // ─── Render helpers ────────────────────────────────────────────────────────

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
        {/* Header row */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          {/* Platform badge */}
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
            {item.title}
          </ThemedText>

          {/* Action buttons */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                // TODO: navigate to edit template screen
                Alert.alert("Edit", "Navigate to edit template");
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

        {/* Date */}
        <ThemedText
          style={{
            fontSize: 11,
            color: isDark ? "#6b7280" : "#9ca3af",
            marginTop: 8,
            textAlign: "right",
          }}
        >
          {new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
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

  // ─── Main UI ───────────────────────────────────────────────────────────────

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
      {/* ── Header ── */}
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

      {/* ── Platform Filter Chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 12,
          gap: 8,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        {PLATFORM_FILTERS.map((filter) => {
          const isActive = selectedPlatform === filter.value;
          return (
            <TouchableOpacity
              key={filter.value}
              onPress={() => handlePlatformFilter(filter.value, setSelectedPlatform)}
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

      {/* ── Template Count ── */}
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

      {/* ── Template List ── */}
      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id}
        renderItem={renderTemplateCard}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />
    </ThemedView>
    </SafeAreaView>
  );
}

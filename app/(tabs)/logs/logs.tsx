import { getLogs } from "@/api/logsApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Text, View } from "@gluestack-ui/themed";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    View as RNView,
    TouchableOpacity
} from "react-native";
import LogsCard from "./logs-Components/logsCards";

export default function Logs() {
  const [selected, setSelected] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Platform icons
  const icons = [
    { name: "mail", label: "Email", library: Ionicons, color: "#E60023" },
    {
      name: "chatbubble-ellipses-outline",
      label: "SMS",
      library: Ionicons,
      color: "#f59e0b",
    },
    {
      name: "instagram",
      label: "Instagram",
      library: FontAwesome,
      color: "#c13584",
    },
    {
      name: "logo-whatsapp",
      label: "Whatsapp",
      library: Ionicons,
      color: "#25D366",
    },
    {
      name: "facebook-square",
      label: "Facebook",
      library: FontAwesome,
      color: "#1877F2",
    },
    {
      name: "youtube-play",
      label: "YouTube",
      library: FontAwesome,
      color: "#FF0000",
    },
    {
      name: "linkedin-square",
      label: "LinkedIn",
      library: FontAwesome,
      color: "#0A66C2",
    },
    {
      name: "pinterest",
      label: "Pinterest",
      library: FontAwesome,
      color: "#E60023",
    },
  ];

  // Platform click handler
  const handlePlatformSelect = async (platformLabel: string) => {
    try {
      setSelected(platformLabel);
      setLoading(true);
      setError(null);

      const platformMap: Record<string, string> = {
        Facebook: "FACEBOOK",
        Instagram: "INSTAGRAM",
        LinkedIn: "LINKEDIN",
      };

      const backendPlatform = platformMap[platformLabel];

      if (!backendPlatform) {
        setLogs([]);
        return;
      }

      const response = await getLogs(backendPlatform);
      setLogs(response.posts || []);
    } catch (err) {
      setError("Failed to fetch logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Header
  const renderHeader = () => (
    <ThemedView>
      {/* HEADING */}
      <ThemedView style={{ marginBottom: 16, paddingHorizontal: 12 }}>
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: "600",
            // color: "#111827",
            marginTop: 7,
            textAlign: "center",
          }}
        >
          Select a platform to view its logs
        </ThemedText>
      </ThemedView>
      {/* PLATFORM ICONS */}
      <ThemedView className="flex-row flex-wrap mb-4">
        {icons.map((icon, index) => {
          const IconComponent = icon.library;
          const isSelected = selected === icon.label;

          return (
            <ThemedView key={index} className="w-1/4 mb-5 items-center">
              <RNView
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: icon.color,
                  shadowOpacity: isSelected ? 0.5 : 0,
                  shadowRadius: isSelected ? 10 : 0,
                  elevation: isSelected ? 8 : 0,
                }}
              >
                <TouchableOpacity
                  onPress={() => handlePlatformSelect(icon.label)}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: icon.color,
                    // backgroundColor: "#fff",
                  }}
                >
                  <IconComponent
                    name={icon.name as any}
                    size={28}
                    color={icon.color}
                  />
                </TouchableOpacity>
              </RNView>

              <ThemedText className="mt-2 text-center text-sm font-medium">
                {icon.label}
              </ThemedText>
            </ThemedView>
          );
        })}
      </ThemedView>

      {/* SEARCH (future use) */}
      {/* <ThemedView className="flex-row items-center mx-3 mb-4">
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search logs..."
          className="flex-1 px-3 py-2 rounded-xl border border-gray-300 bg-white mr-2"
        />
        <TouchableOpacity className="px-3 py-2 rounded-xl bg-green-100">
          <Ionicons name="share-social" size={20} color="#16a34a" />
        </TouchableOpacity>
      </ThemedView> */}
    </ThemedView>
  );

  // Loading state
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
                Loading Logs…
              </ThemedText>
            </ThemedView>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ThemedText>{error}</ThemedText>
      </ThemedView>
    );
  }

  // Empty state
  if (selected && !loading && logs.length === 0) {
    return (
      <View className="flex-1 p-3">
        {renderHeader()}
        <View className="items-center mt-10">
          <Text>No logs found for this platform</Text>
        </View>
      </View>
    );
  }

  return (
    <ThemedView className="flex-1">
      {/* SCROLLABLE LIST */}
      <ThemedView className="flex-1 px-3">
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <LogsCard record={item} platformLabel={selected} />
          )}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
    </ThemedView>
  );
}

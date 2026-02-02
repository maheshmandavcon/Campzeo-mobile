import { getLogs } from "@/api/logsApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View as RNView,
  TouchableOpacity,
} from "react-native";
import DateTimePicker from "react-native-modal-datetime-picker";
import LogsCard from "./logs-Components/logsCards";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";


export default function Logs() {
  const [selected, setSelected] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [backendPlatform, setBackendPlatform] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  // const [search, setSearch] = useState("");

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

      const platform = platformMap[platformLabel];
      setBackendPlatform(platform);

      if (!platform) {
        setLogs([]);
        return;
      }

      const response = await getLogs({ platform });
      setLogs(response.posts || []);
    } catch (err) {
      setError("Failed to fetch logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // const buildQuery = () => {
  //   const params = new URLSearchParams();

  //   params.append("platform", backendPlatform);
  //   params.append("page", "1");
  //   params.append("limit", "10");

  //   if (startDate) params.append("startDate", startDate);
  //   if (endDate) params.append("endDate", endDate);

  //   return params.toString();
  // };

  const formatDate = (date: Date | null) => {
    if (!date) return undefined;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const handleApplyFilters = async () => {
    if (!backendPlatform) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getLogs({
        platform: backendPlatform,
        page: 1,
        limit: 10,
        startDate: startDate ? formatDate(startDate) : undefined,
        endDate: endDate ? formatDate(endDate) : undefined,
      });

      setLogs(response.posts || []);

      // console.log("APPLY FILTERS →", {
      //   platform: backendPlatform,
      //   startDate: startDate ? formatDate(startDate) : null,
      //   endDate: endDate ? formatDate(endDate) : null,
      // });
    } catch (err) {
      setError("Failed to apply filters");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = async () => {
    if (!backendPlatform) return;

    try {
      setStartDate(null);
      setEndDate(null);
      setLoading(true);
      setError(null);

      const response = await getLogs({
        platform: backendPlatform,
        page: 1,
        limit: 10,
      });

      setLogs(response.posts || []);
    } catch (err) {
      setError("Failed to reset filters");
    } finally {
      setLoading(false);
    }
  };

  // const fetchLogs = async () => {
  //   const params = new URLSearchParams();

  //   params.append("platform", selectedPlatform);
  //   params.append("page", "1");
  //   params.append("limit", "10");

  //   if (startDate) params.append("startDate", formatDate(startDate));
  //   if (endDate) params.append("endDate", formatDate(endDate));

  //   await getLogsWithQuery(params.toString());
  // };

  const renderDateFilters = () => {
    return (
      <ThemedView
        style={{
          marginHorizontal: 12,
          marginBottom: 16,
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          // backgroundColor: "#ffffff",
        }}
      >
        {/* TITLE */}
        <ThemedText
          style={{
            fontSize: 13,
            fontWeight: "600",
            marginBottom: 9,
          }}
        >
          Filter by Date
        </ThemedText>

        {/* DATE FIELDS */}
        <HStack space="md">
          {/* FROM */}
          {/*  flex={1} */}
          <VStack style={{flex:1}}>
            <ThemedText
              style={{
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              From
            </ThemedText>

            <Pressable
              onPress={() => setOpenFrom(true)}
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <HStack style={{ alignItems:"center" , justifyContent:"space-between"}}>
                <ThemedText
                  style={{
                    fontSize: 13,
                  }}
                >
                  {startDate ? formatDate(startDate) : "Select date"}
                </ThemedText>
                <Ionicons name="calendar-outline" size={18} color="#6b7280" />
              </HStack>
            </Pressable>
          </VStack>

          {/* TO */}
          <VStack style = {{flex:1}}>
            <ThemedText
              style={{
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              To
            </ThemedText>

            <Pressable
              onPress={() => setOpenTo(true)}
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <HStack style={{alignItems:"center", justifyContent:"space-between"}} >
                <ThemedText
                  style={{
                    fontSize: 13,
                    // color: endDate ? "#111827" : "#9ca3af",
                  }}
                >
                  {endDate ? formatDate(endDate) : "Select date"}
                </ThemedText>
                <Ionicons name="calendar-outline" size={18} color="#6b7280" />
              </HStack>
            </Pressable>
          </VStack>
        </HStack>

        {/* ACTION BUTTONS */}
        <HStack space="md"  style={{marginTop:14}}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "#dc2626",
              paddingVertical: 12,
              borderRadius: 10,
            }}
            onPress={() => {
              // console.log(" APPLY BUTTON PRESSED");
              handleApplyFilters();
            }}
          >
            <ThemedText
              style={{
                color: "#ffffff",
                textAlign: "center",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Apply Filter
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#d1d5db",
              paddingVertical: 12,
              borderRadius: 10,
            }}
            onPress={handleClearFilters}
          >
            <ThemedText
              style={{
                textAlign: "center",
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Clear
            </ThemedText>
          </TouchableOpacity>
        </HStack>

        {/* DATE PICKERS */}
        <DateTimePicker
          isVisible={openFrom}
          mode="date"
          date={startDate || new Date()}
          onConfirm={(date) => {
            setOpenFrom(false);
            setStartDate(date);
          }}
          onCancel={() => setOpenFrom(false)}
        />

        <DateTimePicker
          isVisible={openTo}
          mode="date"
          date={endDate || new Date()}
          minimumDate={startDate || undefined}
          onConfirm={(date) => {
            setOpenTo(false);
            setEndDate(date);
          }}
          onCancel={() => setOpenTo(false)}
        />
      </ThemedView>
    );
  };

  // Header
  const renderHeader = () => (
    <ThemedView>
      {/* HEADING */}
      <ThemedView style={{ marginBottom: 16, paddingHorizontal: 10 }}>
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: "600",
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
                  borderRadius: isSelected ? 50 : 32,
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

      {/* ✅ DATE FILTERS */}
      {renderDateFilters()}
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
      <ThemedView className="flex-1 p-3">
        {renderHeader()}
        <ThemedView className="items-center mt-10">
          <ThemedText>No logs found for this platform</ThemedText>
        </ThemedView>
      </ThemedView>
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

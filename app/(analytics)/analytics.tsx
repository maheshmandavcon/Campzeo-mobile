import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  useColorScheme,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

const { width } = Dimensions.get("window");

const AnalyticsScreen = () => {
  const isDark = useColorScheme() === "dark";
  const [platforms, setPlatforms] = useState([
    { id: "EMAIL", name: "EMAIL", icon: "mail", color: "#EA4335" },
    { id: "SMS", name: "SMS", icon: "chatbox-ellipses", color: "#4CAF50" },
    { id: "WHATSAPP", name: "WHATSAPP", icon: "logo-whatsapp", color: "#25D366" },
    { id: "FACEBOOK", name: "FACEBOOK", icon: "logo-facebook", color: "#1877F2" },
    { id: "INSTAGRAM", name: "INSTAGRAM", icon: "logo-instagram", color: "#E4405F" },
    { id: "LINKEDIN", name: "LINKEDIN", icon: "logo-linkedin", color: "#0A66C2" },
    { id: "YOUTUBE", name: "YOUTUBE", icon: "logo-youtube", color: "#FF0000" },
    { id: "PINTEREST", name: "PINTEREST", icon: "logo-pinterest", color: "#BD081C" },
  ]);
  const [selectedPlatform, setSelectedPlatform] = useState("EMAIL");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: 0, animated: true });
    }
  }, [selectedPlatform]);

  const handlePlatformSelect = (id: string, index: number) => {
    setSelectedPlatform(id);
    // Rotating queue logic: Move clicked item and everything after it to the front
    setPlatforms((prev) => [
      ...prev.slice(index),
      ...prev.slice(0, index)
    ]);
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: isDark ? "#101012" : "#f8f9fa",
      }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#1a1a1a",
              marginBottom: 4,
            }}
          >
            {selectedPlatform} Posts
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
              lineHeight: 20,
            }}
          >
            Performance metrics for your recent posts
          </Text>
        </View>

        {/* Platform Selector Section */}
        <View style={{ marginBottom: 25 }}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
          >
            {platforms.map((platform, index) => {
              const isSelected = selectedPlatform === platform.id;
              return (
                <TouchableOpacity
                  key={platform.id}
                  onPress={() => handlePlatformSelect(platform.id, index)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
                    borderRadius: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 2,
                    borderColor: isSelected
                      ? platform.color
                      : isDark
                        ? "#2c2c2e"
                        : "#e2e8f0",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0.2 : 0.05,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: `${platform.color}15`,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 6,
                    }}
                  >
                    <Ionicons
                      name={platform.icon as any}
                      size={16}
                      color={platform.color}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: isSelected
                        ? platform.color
                        : isDark
                          ? "#e5e7eb"
                          : "#475569",
                    }}
                  >
                    {platform.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filters Section */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 12
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280", marginBottom: 6 }}>From:</Text>
            <TouchableOpacity
              onPress={() => setShowFromPicker(true)}
              style={{
                backgroundColor: isDark ? "#1c1c1e" : "#fff",
                padding: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isDark ? "#2c2c2e" : "#e2e8f0",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#1e293b", fontSize: 12 }}>{formatDate(fromDate)}</Text>
              <Ionicons name="calendar-outline" size={14} color={isDark ? "#9ca3af" : "#64748b"} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280", marginBottom: 6 }}>To:</Text>
            <TouchableOpacity
              onPress={() => setShowToPicker(true)}
              style={{
                backgroundColor: isDark ? "#1c1c1e" : "#fff",
                padding: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isDark ? "#2c2c2e" : "#e2e8f0",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#1e293b", fontSize: 12 }}>{formatDate(toDate)}</Text>
              <Ionicons name="calendar-outline" size={14} color={isDark ? "#9ca3af" : "#64748b"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          <TouchableOpacity
            style={{
              flex: 1.2,
              backgroundColor: isDark ? "#1e40af" : "#2563eb",
              paddingVertical: 12,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              elevation: 2
            }}
          >
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>Export Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 0.8,
              backgroundColor: isDark ? "#1c1c1e" : "#fff",
              paddingVertical: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isDark ? "#2c2c2e" : "#e2e8f0",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}
          >
            <Ionicons name="refresh" size={18} color={isDark ? "#fff" : "#2563eb"} />
            <Text style={{ color: isDark ? "#fff" : "#2563eb", fontWeight: "bold", fontSize: 13 }}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        <View
          style={{
            padding: 30,
            borderRadius: 20,
            backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: isDark ? "#2c2c2e" : "#f1f5f9",
            borderStyle: "dashed",
          }}
        >
          <View
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: isDark ? "#2c2c2e" : "#f8fafc",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={36}
              color={isDark ? "#4b5563" : "#cbd5e1"}
            />
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: isDark ? "#e5e7eb" : "#334155",
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            No posts found for this platform.
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#9ca3af" : "#64748b",
              textAlign: "center",
              lineHeight: 18
            }}
          >
            Try adjusting your date range or select another platform to see metrics.
          </Text>
        </View>

        {/* Date Pickers */}
        {showFromPicker && (
          <DateTimePicker
            value={fromDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowFromPicker(false);
              if (date) setFromDate(date);
            }}
          />
        )}
        {showToPicker && (
          <DateTimePicker
            value={toDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setShowToPicker(false);
              if (date) setToDate(date);
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;

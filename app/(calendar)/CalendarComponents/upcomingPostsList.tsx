import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React, { useState } from "react";
import { ScrollView, StyleSheet, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { WebView } from "react-native-webview";
import { Image } from "react-native";

import {
  formatReadableDate,
  formatReadableTime,
  getDateLabel,
} from "../../../utils/dateHelpers";

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { View } from "react-native";

interface UpcomingPostsListProps {
  groupedEvents: Record<string, any>;
}

const PLATFORM_CONFIGS: Record<string, { name: string; color: string; icon: string }> = {
  facebook: { name: "Facebook", color: "#1877F2", icon: "logo-facebook" },
  instagram: { name: "Instagram", color: "#E4405F", icon: "logo-instagram" },
  linkedin: { name: "LinkedIn", color: "#0A66C2", icon: "logo-linkedin" },
  youtube: { name: "YouTube", color: "#FF0000", icon: "logo-youtube" },
  pinterest: { name: "Pinterest", color: "#BD081C", icon: "logo-pinterest" },
  whatsapp: { name: "WhatsApp", color: "#25D366", icon: "logo-whatsapp" },
  sms: { name: "SMS", color: "#10B981", icon: "chatbubble-ellipses-outline" },
  email: { name: "Email", color: "#EA4335", icon: "mail-outline" },
};

const UpcomingPostsList: React.FC<UpcomingPostsListProps> = ({
  groupedEvents,
}) => {
  const [showActionsheet, setShowActionsheet] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const handleClose = () => setShowActionsheet(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const now = new Date();

  const isVideoFile = (url: string) => {
    return (
      url?.includes(".mp4") ||
      url?.includes(".mov") ||
      url?.includes(".webm") ||
      url?.includes("#video")
    );
  };

  const filteredGroupedEvents: Record<string, any[]> = {};

  Object.entries(groupedEvents).forEach(([dateKey, events]) => {
    const futureEvents = (events as any[]).filter(
      (event: any) => new Date(event.start) > now
    );

    if (futureEvents.length > 0) {
      filteredGroupedEvents[dateKey] = futureEvents;
    }
  });

  const filteredDateKeys = Object.keys(filteredGroupedEvents).sort();

  const activePlatformConfig = selectedEvent
    ? PLATFORM_CONFIGS[selectedEvent.platform?.toLowerCase() || "facebook"] || {
        name: selectedEvent.platform || "Platform",
        color: "#6b7280",
        icon: "document-text-outline",
      }
    : null;

  if (filteredDateKeys.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText
          style={{
            fontSize: 22,
            fontWeight: "700",
            marginVertical: 10,
            lineHeight: 30,
            color: isDark ? "#f1f5f9" : "#020617",
          }}
        >
          Upcoming Posts
        </ThemedText>

        <ThemedView
          style={{
            paddingVertical: 40,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "#0f172a" : "#f8fafc",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
            marginVertical: 10,
          }}
        >
          <Ionicons
            name="calendar-clear-outline"
            size={40}
            color={isDark ? "#475569" : "#cbd5e1"}
            style={{ marginBottom: 12 }}
          />
          <ThemedText
            style={{
              fontSize: 15,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
              paddingHorizontal: 20,
              lineHeight: 20,
            }}
          >
            You don't have any upcoming posts scheduled.
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          <ThemedText
            style={{
              fontSize: 22,
              fontWeight: "700",
              marginVertical: 12,
              lineHeight: 30,
              color: isDark ? "#f1f5f9" : "#020617",
            }}
          >
            Upcoming Posts
          </ThemedText>

          {filteredDateKeys.map((dateKey) => {
            const eventsForDate = filteredGroupedEvents[dateKey];
            const readableDateLabel = getDateLabel(dateKey);

            return (
              <ThemedView key={dateKey} style={styles.dateSection}>
                <ThemedText
                  style={[
                    styles.dateHeader,
                    { color: isDark ? "#cbd5e1" : "#334155" },
                  ]}
                >
                  {readableDateLabel}
                </ThemedText>

                {eventsForDate.map((event) => {
                  const platformKey = event.platform?.toLowerCase() || "facebook";
                  const config = PLATFORM_CONFIGS[platformKey] || {
                    name: event.platform || "Platform",
                    color: "#6b7280",
                    icon: "document-text-outline",
                  };

                  return (
                    <Pressable
                      key={event.id}
                      onPress={() => {
                        setSelectedEvent(event);
                        setShowActionsheet(true);
                      }}
                    >
                      <ThemedView
                        style={[
                          styles.card,
                          {
                            backgroundColor: isDark ? "#1e293b" : "#ffffff",
                            borderColor: isDark ? "#334155" : "#e2e8f0",
                            borderLeftColor: config.color,
                            borderLeftWidth: 4,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderRadius: 12,
                            marginBottom: 8,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          },
                        ]}
                      >
                        <HStack style={{ alignItems: "center", gap: 10, flex: 1 }}>
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "#f8fafc",
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 1,
                              borderColor: isDark ? "#334155" : "#e2e8f0",
                            }}
                          >
                            <Ionicons name={config.icon as any} size={16} color={config.color} />
                          </View>
                          <VStack style={{ flex: 1 }}>
                            <ThemedText
                              style={[
                                styles.title,
                                { color: isDark ? "#f8fafc" : "#020617", fontSize: 14, fontWeight: "700" },
                              ]}
                              numberOfLines={1}
                            >
                              {event.campaign || "No Campaign Name"}
                            </ThemedText>
                            <Text
                              style={{
                                color: isDark ? "#94a3b8" : "#64748b",
                                fontSize: 11,
                                fontWeight: "600",
                              }}
                            >
                              {config.name}
                            </Text>
                          </VStack>
                        </HStack>

                        <ThemedText
                          style={[
                            styles.time,
                            {
                              color: isDark ? "#cbd5e1" : "#475569",
                              marginLeft: 12,
                              fontWeight: "600",
                              fontSize: 13,
                            },
                          ]}
                        >
                          {formatReadableTime(event.start)}
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  );
                })}
              </ThemedView>
            );
          })}
        </ThemedView>
      </ScrollView>

      {/* DETAILED ACTION SHEET */}
      <Actionsheet isOpen={showActionsheet} onClose={handleClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent
          style={{
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingBottom: 24,
            borderWidth: 1,
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
          }}
        >
          {/* DRAG INDICATOR */}
          <ActionsheetDragIndicatorWrapper style={{ marginBottom: 14 }}>
            <ActionsheetDragIndicator
              style={{
                backgroundColor: isDark ? "#334155" : "#cbd5e1",
                width: 48,
                height: 5,
                borderRadius: 999,
              }}
            />
          </ActionsheetDragIndicatorWrapper>

          {/* TITLE */}
          <HStack style={{ marginBottom: 20, gap: 10, alignItems: "center", alignSelf: "flex-start" }}>
            {activePlatformConfig && (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "#f8fafc",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                }}
              >
                <Ionicons
                  name={activePlatformConfig.icon as any}
                  size={16}
                  color={activePlatformConfig.color}
                />
              </View>
            )}
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#f8fafc" : "#020617",
              }}
            >
              Post Details
            </ThemedText>
          </HStack>

          {/* DETAILS */}
          {selectedEvent && activePlatformConfig && (
            <ScrollView style={{ width: "100%", maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <VStack style={{ gap: 16, width: "100%" }}>
                {/* CAMPAIGN */}
                <VStack>
                  <ThemedText
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    Campaign
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: isDark ? "#f1f5f9" : "#020617",
                    }}
                  >
                    {selectedEvent.campaign || "No Campaign Name"}
                  </ThemedText>
                </VStack>

                {/* PLATFORM */}
                <VStack>
                  <ThemedText
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    Platform
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: activePlatformConfig.color,
                    }}
                  >
                    {activePlatformConfig.name}
                  </ThemedText>
                </VStack>

                {/* TIME */}
                <VStack>
                  <ThemedText
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    Scheduled Time
                  </ThemedText>

                  <HStack style={{ gap: 15 }}>
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isDark ? "#cbd5e1" : "#334155",
                      }}
                    >
                      {formatReadableDate(selectedEvent.start)}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isDark ? "#cbd5e1" : "#334155",
                      }}
                    >
                      {formatReadableTime(selectedEvent.start)}
                    </ThemedText>
                  </HStack>
                </VStack>

                {/* SUBJECT */}
                {selectedEvent.platform?.toLowerCase() !== "sms" && selectedEvent.subject && (
                  <VStack>
                    <ThemedText
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: isDark ? "#94a3b8" : "#64748b",
                        marginBottom: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      Subject
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isDark ? "#cbd5e1" : "#334155",
                        lineHeight: 20,
                      }}
                    >
                      {selectedEvent.subject}
                    </ThemedText>
                  </VStack>
                )}

                {/* MESSAGE */}
                <VStack>
                  <ThemedText
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    Message
                  </ThemedText>
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#e5e7eb",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: isDark ? "#e2e8f0" : "#334155",
                        lineHeight: 20,
                      }}
                    >
                      {selectedEvent.message || "No message content."}
                    </ThemedText>
                  </View>
                </VStack>

                {/* MEDIA PREVIEW */}
                {selectedEvent?.mediaUrls && (
                  <VStack>
                    <ThemedText
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: isDark ? "#94a3b8" : "#64748b",
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Media Preview
                    </ThemedText>

                    <View
                      style={{
                        width: 240,
                        height: 180,
                        borderRadius: 12,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: isDark ? "#334155" : "#e2e8f0",
                      }}
                    >
                      {isVideoFile(selectedEvent.mediaUrls) ? (
                        <WebView
                          source={{
                            html: `
                              <html>
                                <body style="margin:0;background:black;">
                                  <video
                                    src="${selectedEvent.mediaUrls}"
                                    controls
                                    style="width:100%;height:100%;object-fit:cover;"
                                  />
                                </body>
                              </html>
                            `,
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: "black",
                          }}
                          javaScriptEnabled
                          domStorageEnabled
                        />
                      ) : (
                        <Image
                          source={{ uri: selectedEvent.mediaUrls }}
                          style={{
                            width: "100%",
                            height: "100%",
                          }}
                          resizeMode="cover"
                        />
                      )}
                    </View>
                  </VStack>
                )}

                {/* POST STATUS */}
                <VStack>
                  <ThemedText
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 6,
                      textTransform: "uppercase",
                    }}
                  >
                    Post Status
                  </ThemedText>

                  <View
                    style={{
                      alignSelf: "flex-start",
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 999,
                      backgroundColor: selectedEvent.isPostSent
                        ? isDark
                          ? "rgba(34,197,94,0.15)"
                          : "#dcfce7"
                        : isDark
                          ? "rgba(251,191,36,0.15)"
                          : "#fef3c7",
                      borderWidth: 1,
                      borderColor: selectedEvent.isPostSent
                        ? isDark
                          ? "#22c55e"
                          : "#86efac"
                        : isDark
                          ? "#fbbf24"
                          : "#fcd34d",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        letterSpacing: 0.5,
                        color: selectedEvent.isPostSent
                          ? isDark
                            ? "#4ade80"
                            : "#15803d"
                          : isDark
                            ? "#facc15"
                            : "#b45309",
                      }}
                    >
                      {selectedEvent.isPostSent ? "SENT" : "SCHEDULED"}
                    </ThemedText>
                  </View>
                </VStack>
              </VStack>
            </ScrollView>
          )}

          {/* FOOTER ACTIONS */}
          <HStack
            style={{
              marginTop: 20,
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <Pressable
              onPress={handleClose}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 10,
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: isDark ? "#cbd5e1" : "#475569",
                }}
              >
                Close
              </Text>
            </Pressable>
          </HStack>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
};

export default UpcomingPostsList;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  dateSection: {
    marginBottom: 14,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  card: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
  },
});

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, useColorScheme } from "react-native";

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
import { Calendar } from "lucide-react-native";
import { View } from "react-native";

interface UpcomingPostsListProps {
  groupedEvents: Record<string, any>;
  selectedMonth: Date;
}

const UpcomingPostsList: React.FC<UpcomingPostsListProps> = ({
  groupedEvents,
  selectedMonth,
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
  const isCurrentMonth =
    selectedMonth.getMonth() === now.getMonth() &&
    selectedMonth.getFullYear() === now.getFullYear();

  const filteredGroupedEvents: Record<string, any[]> = {};

  Object.entries(groupedEvents).forEach(([dateKey, events]) => {
    const eventDate = new Date(dateKey);

    const isSameMonth =
      eventDate.getMonth() === selectedMonth.getMonth() &&
      eventDate.getFullYear() === selectedMonth.getFullYear();

    if (!isSameMonth) return;

    const filteredEvents = isCurrentMonth
      ? events.filter((event: any) => new Date(event.start) > now) // future only
      : events; // show all if not current month

    if (filteredEvents.length > 0) {
      filteredGroupedEvents[dateKey] = filteredEvents;
    }
  });

  const filteredDateKeys = Object.keys(filteredGroupedEvents).sort();
  // useEffect(() => {
  //   console.log("ppp",selectedEvent);
  // }, [selectedEvent]);
  if (filteredDateKeys.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText
          style={{
            fontSize: 25,
            fontWeight: "700",
            marginVertical: 10,
            lineHeight: 36,
          }}
        >
          {isCurrentMonth
            ? "Upcoming Posts"
            : `Posts for ${selectedMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}`}
        </ThemedText>

        <ThemedView
          style={{
            paddingVertical: 30,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ThemedText
            style={{
              fontSize: 15,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
            }}
          >
            {isCurrentMonth
              ? "You don’t have any upcoming posts scheduled."
              : "There are no posts scheduled for this month."}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <>
      <ScrollView>
        <ThemedView style={styles.container}>
          <ThemedText
            style={{
              fontSize: 25,
              fontWeight: "700",
              marginVertical: 10,
              lineHeight: 36,
            }}
          >
            {isCurrentMonth
              ? "Upcoming Posts"
              : `Posts for ${selectedMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}`}
          </ThemedText>

          {filteredDateKeys.map((dateKey) => {
            const eventsForDate = filteredGroupedEvents[dateKey];
            const readableDateLabel = getDateLabel(dateKey);

            return (
              <ThemedView key={dateKey} style={styles.dateSection}>
                <ThemedText
                  style={[
                    styles.dateHeader,
                    { color: isDark ? "#e5e7eb" : "#020617" },
                  ]}
                >
                  {readableDateLabel}
                </ThemedText>

                {eventsForDate.map((event) => (
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
                          backgroundColor: isDark ? "#020617" : "#ffffff",
                          borderColor: isDark ? "#1f2933" : "#e5e7eb",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.title,
                          { color: isDark ? "#f9fafb" : "#020617", flex: 1 },
                        ]}
                        numberOfLines={1}
                      >
                        {event.platform.toUpperCase()} — {event.campaign}
                      </ThemedText>

                      <ThemedText
                        style={[
                          styles.time,
                          {
                            color: isDark ? "#9ca3af" : "#6b7280",
                            marginLeft: 12,
                          },
                        ]}
                      >
                        {formatReadableTime(event.start)}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                ))}
              </ThemedView>
            );
          })}
        </ThemedView>
      </ScrollView>
      <Actionsheet isOpen={showActionsheet} onClose={handleClose}>
        <ActionsheetBackdrop />
        <ActionsheetContent
          style={{
            backgroundColor: isDark ? "#020617" : "#ffffff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingBottom: 24,
          }}
        >
          {/* DRAG INDICATOR */}
          <ActionsheetDragIndicatorWrapper style={{ marginBottom: 12 }}>
            <ActionsheetDragIndicator
              style={{
                backgroundColor: isDark ? "#475569" : "#dc2626",
                width: 48,
                height: 5,
                borderRadius: 999,
              }}
            />
          </ActionsheetDragIndicatorWrapper>

          {/* TITLE */}
          <HStack style={{ marginBottom: 16, gap: 7 }}>
            <Calendar size={24} color={"#dc2626"} />

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
          {selectedEvent && (
            <>
              <VStack
                style={{ gap: 14 }}
                //  key ={eventDetail.id}
              >
                {/* PLATFORM */}
                <VStack>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 2,
                    }}
                  >
                    Platform
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isDark ? "#f1f5f9" : "#020617",
                    }}
                  >
                    {selectedEvent.title}
                  </ThemedText>
                </VStack>

                {/* TIME */}
                <VStack>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 2,
                    }}
                  >
                    Scheduled Time
                  </ThemedText>

                  <HStack style={{ gap: 15 }}>
                    <ThemedText
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: isDark ? "#f1f5f9" : "#020617",
                      }}
                    >
                      {formatReadableDate(selectedEvent.start)}
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: isDark ? "#f1f5f9" : "#020617",
                      }}
                    >
                      {formatReadableTime(selectedEvent.start)}
                    </ThemedText>
                  </HStack>
                </VStack>

                {/* SUBJECT */}
                {selectedEvent.platform?.toLowerCase() !== "sms" && (
                  <VStack>
                    <ThemedText
                      style={{
                        fontSize: 12,
                        color: isDark ? "#94a3b8" : "#64748b",
                        marginBottom: 2,
                      }}
                    >
                      Subject
                    </ThemedText>
                    <ThemedText
                      style={{
                        fontSize: 15,
                        fontWeight: "500",
                        color: isDark ? "#e5e7eb" : "#020617",
                        lineHeight: 22,
                      }}
                    >
                      {selectedEvent.subject}
                    </ThemedText>
                  </VStack>
                )}

                {/* Message */}
                <VStack>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 2,
                    }}
                  >
                    Message
                  </ThemedText>
                  <ThemedText
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      color: isDark ? "#e5e7eb" : "#020617",
                      lineHeight: 22,
                    }}
                  >
                    {selectedEvent.message}
                  </ThemedText>
                </VStack>

                {/* Media Preview */}
                {selectedEvent?.mediaUrls && (
                  <VStack>
                    <ThemedText
                      style={{
                        fontSize: 12,
                        color: isDark ? "#94a3b8" : "#64748b",
                        marginBottom: 8,
                      }}
                    >
                      Media Preview
                    </ThemedText>

                    <View
                      style={{
                        width: 240,
                        height: 220,
                        borderRadius: 16,
                        overflow: "hidden",
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

                {/* Post status */}
                <VStack>
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 6,
                    }}
                  >
                    Post status
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
                        fontSize: 12,
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

              <HStack
                style={{
                  marginTop: 24,
                  gap: 12,
                  justifyContent: "flex-end",
                }}
              >
                {/* SECONDARY */}
                <Pressable
                  onPress={handleClose}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isDark ? "#e5e7eb" : "#020617",
                    }}
                  >
                    Close
                  </Text>
                </Pressable>

                {/* PRIMARY */}
                {/* <Pressable
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 10,
                    backgroundColor: "#dc2626",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#ffffff",
                    }}
                  >
                    Edit Post
                  </Text>
                </Pressable> */}
              </HStack>
            </>
          )}
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
    fontSize: 18,
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

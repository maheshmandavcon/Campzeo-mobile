import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CalendarEvent } from "@/types/types";
import React, { useState } from "react";
import { StyleSheet, useColorScheme, ScrollView } from "react-native";
import { formatReadableTime, getDateLabel } from "../../../utils/dateHelpers";

import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetBackdrop,
} from "@/components/ui/actionsheet";
import { HStack, Pressable, VStack } from "@gluestack-ui/themed";
import { Text } from "@gluestack-ui/themed";
import { Calendar } from "lucide-react-native";

interface UpcomingPostsListProps {
  groupedEvents: Record<string, CalendarEvent[]>;
}

const UpcomingPostsList: React.FC<UpcomingPostsListProps> = ({
  groupedEvents,
}) => {
  const [showActionsheet, setShowActionsheet] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const handleClose = () => setShowActionsheet(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const now = new Date();

  // 🔥 Filter only future events
  const futureGroupedEvents: Record<string, CalendarEvent[]> = {};

  Object.entries(groupedEvents).forEach(([dateKey, events]) => {
    const futureEvents = events.filter((event) => new Date(event.start) > now);

    if (futureEvents.length > 0) {
      futureGroupedEvents[dateKey] = futureEvents;
    }
  });

  const futureDateKeys = Object.keys(futureGroupedEvents).sort();

  // ✅ No upcoming posts case
  if (futureDateKeys.length === 0) {
    return (
      <ThemedView>
        <ThemedText className="text-center  my-7">
          No upcoming posts.
        </ThemedText>
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
            Upcoming Posts
          </ThemedText>

          {futureDateKeys.map((dateKey) => {
            const eventsForDate = futureGroupedEvents[dateKey];
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
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.title,
                          { color: isDark ? "#f9fafb" : "#020617" },
                        ]}
                      >
                        {event.platform.toUpperCase()} — {event.campaign}
                      </ThemedText>

                      <ThemedText
                        style={[
                          styles.time,
                          { color: isDark ? "#9ca3af" : "#6b7280" },
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

                  {futureDateKeys.map((dateKey) => {
                    const eventsForDate = futureGroupedEvents[dateKey];
                    const readableDateLabel = getDateLabel(dateKey);

                    return (
                      <HStack key={dateKey} style={{ gap: 15 }}>
                        <ThemedText
                          style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: isDark ? "#f1f5f9" : "#020617",
                          }}
                        >
                          {readableDateLabel}
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
                    );
                  })}
                </VStack>

                {/* SUBJECT */}
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
                    {selectedEvent.message}
                  </ThemedText>
                </VStack>

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
                <Pressable
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
                </Pressable>
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

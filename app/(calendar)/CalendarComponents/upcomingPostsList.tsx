import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CalendarEvent } from "@/types/types";
import React from "react";
import { StyleSheet, useColorScheme, View, ScrollView } from "react-native";
// import { ScrollView } from "react-native-gesture-handler";
import { formatReadableTime, getDateLabel } from "../../../utils/dateHelpers";
// import { Center } from "@gluestack-ui/themed";

interface UpcomingPostsListProps {
  groupedEvents: Record<string, CalendarEvent[]>;
}

const UpcomingPostsList: React.FC<UpcomingPostsListProps> = ({
  groupedEvents,
}) => {
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
                <ThemedView
                  key={event.id}
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
              ))}
            </ThemedView>
          );
        })}
      </ThemedView>
    </ScrollView>
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

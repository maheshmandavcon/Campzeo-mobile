import React, { useEffect, useMemo, useState } from "react";
import { Calendar } from "react-native-big-calendar";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Post } from "@/types/types";
import { ScrollView, StyleSheet, useColorScheme, TouchableOpacity } from "react-native";
import { groupEventsByDate } from "../../../utils/groupEventsByDate";
import { mapEvents } from "../../../utils/mapEvents";
import CalendarHeader from "./calendarHeader";
import EventModal from "./eventModal";
import UpcomingPostsList from "./upcomingPostsList";

import { Ionicons } from "@expo/vector-icons";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";

import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { HStack, Pressable, Text, VStack } from "@gluestack-ui/themed";
import { View } from "react-native";

import { formatReadableTime } from "../../../utils/dateHelpers";

interface CalendarViewProps {
  posts: Post[]; // Raw posts loaded by CalendarWrapper
}

const PLATFORM_CONFIGS: Record<
  string,
  { name: string; color: string; lightColor: string; icon: string; textColor: string }
> = {
  facebook: {
    name: "Facebook",
    color: "#1877F2",
    lightColor: "rgba(24, 119, 242, 0.12)",
    icon: "logo-facebook",
    textColor: "#1877F2",
  },
  instagram: {
    name: "Instagram",
    color: "#E4405F",
    lightColor: "rgba(228, 64, 95, 0.12)",
    icon: "logo-instagram",
    textColor: "#E4405F",
  },
  linkedin: {
    name: "LinkedIn",
    color: "#0A66C2",
    lightColor: "rgba(10, 102, 194, 0.12)",
    icon: "logo-linkedin",
    textColor: "#0A66C2",
  },
  youtube: {
    name: "YouTube",
    color: "#FF0000",
    lightColor: "rgba(255, 0, 0, 0.12)",
    icon: "logo-youtube",
    textColor: "#FF0000",
  },
  pinterest: {
    name: "Pinterest",
    color: "#BD081C",
    lightColor: "rgba(189, 8, 28, 0.12)",
    icon: "logo-pinterest",
    textColor: "#BD081C",
  },
  whatsapp: {
    name: "WhatsApp",
    color: "#25D366",
    lightColor: "rgba(37, 211, 102, 0.12)",
    icon: "logo-whatsapp",
    textColor: "#25D366",
  },
  sms: {
    name: "SMS",
    color: "#10B981",
    lightColor: "rgba(16, 185, 129, 0.12)",
    icon: "chatbubble-ellipses-outline",
    textColor: "#10B981",
  },
  email: {
    name: "Email",
    color: "#EA4335",
    lightColor: "rgba(234, 67, 53, 0.12)",
    icon: "mail-outline",
    textColor: "#EA4335",
  },
};

const CalendarView: React.FC<CalendarViewProps> = ({ posts }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Controls Month / Week / Day View
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Controls which date the calendar focuses on
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Interactive selected date in the custom monthly grid
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Event Modal State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  // Same-time multi-posts selection states
  const [multiPosts, setMultiPosts] = useState<any[]>([]);
  const [isMultiPostModalVisible, setMultiPostModalVisible] = useState(false);

  // Convert backend posts → CalendarEvents format
  const events = useMemo(() => mapEvents(posts), [posts]);

  // Group events by date for upcoming posts list
  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);

  // Generate all grid dates for the custom month grid
  const days = useMemo(() => {
    const startMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);
    const startDate = startOfWeek(startMonth);
    const endDate = endOfWeek(endMonth);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Set the first day with posts as the selected date by default if posts loaded
  useEffect(() => {
    if (events.length > 0) {
      // Find the first event scheduled on or after today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const futureEvents = events.filter((e) => e.start >= today).sort((a, b) => a.start.getTime() - b.start.getTime());
      
      if (futureEvents.length > 0) {
        setSelectedDate(futureEvents[0].start);
        setCurrentDate(futureEvents[0].start);
      } else {
        setSelectedDate(events[0].start);
        setCurrentDate(events[0].start);
      }
    }
  }, [posts]);

  // Handle tap on event in Week / Day views
  const handleEventPress = (event: any) => {
    // Find all posts scheduled at the exact same hour/minute
    const sameTimePosts = events.filter(
      (e) =>
        isSameDay(e.start, event.start) &&
        e.start.getHours() === event.start.getHours() &&
        e.start.getMinutes() === event.start.getMinutes()
    );

    if (sameTimePosts.length > 1) {
      // Show multi-post selection actionsheet
      setMultiPosts(sameTimePosts);
      setMultiPostModalVisible(true);
    } else {
      // Only one post, open directly
      setSelectedEvent(event);
      setModalVisible(true);
    }
  };

  // Custom event renderer for Week/Day views in react-native-big-calendar
  const renderEvent = (event: any, touchableOpacityProps: any) => {
    const platformKey = event.platform?.toLowerCase() || "facebook";
    const config = PLATFORM_CONFIGS[platformKey] || {
      name: event.platform || "Platform",
      color: "#dc2626",
      icon: "document-text-outline",
    };

    if (viewMode === "week") {
      return (
        <TouchableOpacity
          {...touchableOpacityProps}
          activeOpacity={0.8}
          style={[
            touchableOpacityProps.style,
            {
              backgroundColor: config.color,
              borderRadius: 4,
              padding: 2,
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Ionicons name={config.icon as any} size={11} color="#ffffff" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        {...touchableOpacityProps}
        activeOpacity={0.8}
        style={[
          touchableOpacityProps.style,
          {
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderColor: config.color,
            borderLeftWidth: 4,
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            borderWidth: 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.8)" : "#f8fafc",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: isDark ? "#334155" : "#e2e8f0",
          }}
        >
          <Ionicons name={config.icon as any} size={13} color={config.color} />
        </View>
        <VStack style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: isDark ? "#f8fafc" : "#020617",
            }}
            numberOfLines={1}
          >
            {event.campaign || "No Campaign"}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: isDark ? "#cbd5e1" : "#475569",
              fontWeight: "600",
            }}
          >
            {formatReadableTime(event.start)} • {config.name}
          </Text>
        </VStack>
      </TouchableOpacity>
    );
  };

  // Shared selected day details panel component renderer
  const renderSelectedDayPanel = (marginT = 0) => {
    const dayPosts = events.filter((e) => isSameDay(e.start, selectedDate));
    return (
      <View style={[styles.selectedDayPanel, { marginTop: marginT }]}>
        <HStack style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#f1f5f9" : "#020617",
            }}
          >
            {format(selectedDate, "EEEE, MMMM d")}
          </ThemedText>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 3.5,
              borderRadius: 8,
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: isDark ? "#94a3b8" : "#475569",
              }}
            >
              {dayPosts.length} Posts
            </Text>
          </View>
        </HStack>

        {/* List of posts for selected date */}
        {(() => {
          if (dayPosts.length === 0) {
            return (
              <View
                style={{
                  paddingVertical: 26,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: isDark ? "#334155" : "#cbd5e1",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={28}
                  color={isDark ? "#334155" : "#cbd5e1"}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "#94a3b8" : "#64748b",
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                >
                  No campaigns scheduled for this date.
                </Text>
              </View>
            );
          }

          return (
            <View style={{ gap: 8 }}>
              {dayPosts.map((post) => {
                const platformKey = post.platform?.toLowerCase() || "facebook";
                const config = PLATFORM_CONFIGS[platformKey] || {
                  name: post.platform || "Platform",
                  color: "#6b7280",
                  icon: "document-text-outline",
                };

                return (
                  <Pressable
                    key={post.id}
                    onPress={() => {
                      setSelectedEvent(post);
                      setModalVisible(true);
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: isDark ? "#1e293b" : "#ffffff",
                        borderColor: isDark ? "#334155" : "#e2e8f0",
                        borderLeftColor: config.color,
                        borderLeftWidth: 4,
                        padding: 14,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderWidth: 1,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
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
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: isDark ? "#f8fafc" : "#020617",
                            }}
                            numberOfLines={1}
                          >
                            {post.campaign || "No Campaign Name"}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: isDark ? "#94a3b8" : "#64748b",
                              fontWeight: "600",
                            }}
                          >
                            {config.name}
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack style={{ alignItems: "center", gap: 8 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: isDark ? "#cbd5e1" : "#475569",
                          }}
                        >
                          {formatReadableTime(post.start)}
                        </Text>
                        <Ionicons
                          name="chevron-forward-outline"
                          size={16}
                          color={isDark ? "#475569" : "#cbd5e1"}
                        />
                      </HStack>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          );
        })()}
      </View>
    );
  };

  return (
    <ThemedView style={{ marginBottom: 50 }}>
      {/* HEADER (View Mode Switcher + Month Label + Navigation) */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onChangeView={setViewMode}
        onChangeDate={(date) => {
          setCurrentDate(date);
          setSelectedDate(date);
        }}
      />

      {/* RENDER DYNAMIC CALENDAR ACCORDING TO VIEW MODE */}
      {viewMode === "month" ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* CUSTOM MONTH GRID CALENDAR */}
          <View
            style={[
              styles.monthCard,
              {
                backgroundColor: isDark ? "#0f172a" : "#ffffff",
                borderColor: isDark ? "#1e293b" : "#e2e8f0",
              },
            ]}
          >
            {/* Weekday Labels Header */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => (
                <Text
                  key={idx}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontWeight: "700",
                    fontSize: 12,
                    color: isDark ? "#475569" : "#94a3b8",
                  }}
                >
                  {dayName}
                </Text>
              ))}
            </View>

            {/* Days Grid Grid Layout */}
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {days.map((day, idx) => {
                const isCurrentMonthDay = isSameMonth(day, currentDate);
                const isSelected = isSameDay(day, selectedDate);
                const isDayToday = isToday(day);

                // Find posts scheduled for this day
                const dayPosts = events.filter((e) => isSameDay(e.start, day));

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedDate(day);
                      setCurrentDate(day);
                    }}
                    style={{
                      width: "14.28%", // exact columns division
                      alignItems: "center",
                      justifyContent: "center",
                      marginVertical: 5,
                      height: 54,
                    }}
                  >
                    {/* Day circle */}
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isSelected
                          ? "#dc2626"
                          : isDayToday
                          ? isDark
                            ? "rgba(220, 38, 38, 0.15)"
                            : "#fef2f2"
                          : "transparent",
                        borderWidth: isDayToday && !isSelected ? 1.5 : 0,
                        borderColor: isDayToday ? "#dc2626" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected || isDayToday ? "700" : "500",
                          color: isSelected
                            ? "#ffffff"
                            : isDayToday
                            ? "#dc2626"
                            : !isCurrentMonthDay
                            ? isDark
                              ? "#334155"
                              : "#cbd5e1"
                            : isDark
                            ? "#cbd5e1"
                            : "#334155",
                        }}
                      >
                        {format(day, "d")}
                      </Text>
                    </View>

                    {/* Brand dots underneath day number */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 2,
                        marginTop: 4,
                        height: 6,
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      {dayPosts.slice(0, 4).map((post, postIdx) => {
                        const platformKey = post.platform?.toLowerCase() || "facebook";
                        const config = PLATFORM_CONFIGS[platformKey] || { color: "#6b7280" };
                        return (
                          <View
                            key={postIdx}
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: 2.5,
                              backgroundColor: config.color,
                            }}
                          />
                        );
                      })}
                      {dayPosts.length > 4 && (
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: isDark ? "#475569" : "#94a3b8",
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* DEDICATED SELECTED DAY POSTS PANEL */}
          {renderSelectedDayPanel()}

          {/* UPCOMING POSTS LIST UNDERNEATH */}
          <UpcomingPostsList groupedEvents={groupedEvents} selectedMonth={currentDate} />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* MAIN CALENDAR (Week or Day hourly view) */}
          <Calendar
            events={events}
            mode={viewMode}
            date={currentDate}
            height={500}
            onPressEvent={handleEventPress}
            onPressDateHeader={(date) => {
              setSelectedDate(date);
              setCurrentDate(date);
            }}
            onPressCell={(date) => {
              setSelectedDate(date);
              setCurrentDate(date);
            }}
            onSwipeEnd={(date) => {
              setCurrentDate(date);
              setSelectedDate(date);
            }}
            swipeEnabled={true}
            renderEvent={renderEvent}
          />

          {/* DEDICATED SELECTED DAY POSTS PANEL (WITH SENT POSTS HISTORY) */}
          {renderSelectedDayPanel(16)}

          {/* UPCOMING POSTS LIST UNDERNEATH */}
          <UpcomingPostsList groupedEvents={groupedEvents} selectedMonth={currentDate} />
        </ScrollView>
      )}

      {/* EVENT MODAL DETAILED PREVIEW */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalVisible}
        onClose={() => setModalVisible(false)}
      />

      {/* MULTIPLE POSTS AT SAME TIME SELECTOR */}
      <Actionsheet isOpen={isMultiPostModalVisible} onClose={() => setMultiPostModalVisible(false)}>
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

          <HStack style={{ marginBottom: 16, gap: 10, alignItems: "center", alignSelf: "flex-start" }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#dc2626",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="copy-outline" size={16} color="#ffffff" />
            </View>
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: isDark ? "#f8fafc" : "#020617",
              }}
            >
              Select Platform Post
            </ThemedText>
          </HStack>

          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#94a3b8" : "#64748b",
              marginBottom: 16,
              alignSelf: "flex-start",
              lineHeight: 18,
            }}
          >
            Multiple posts are scheduled at the same time slot. Select one to view details:
          </Text>

          <ScrollView style={{ width: "100%", maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            <VStack style={{ gap: 10, width: "100%", paddingBottom: 10 }}>
              {multiPosts.map((post) => {
                const platformKey = post.platform?.toLowerCase() || "facebook";
                const config = PLATFORM_CONFIGS[platformKey] || {
                  name: post.platform || "Platform",
                  color: "#6b7280",
                  icon: "document-text-outline",
                };

                return (
                  <Pressable
                    key={post.id}
                    onPress={() => {
                      setMultiPostModalVisible(false);
                      // Let the sheet animate out before opening event details
                      setTimeout(() => {
                        setSelectedEvent(post);
                        setModalVisible(true);
                      }, 250);
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: isDark ? "#1e293b" : "#ffffff",
                        borderWidth: 1,
                        borderColor: isDark ? "#334155" : "#e2e8f0",
                        borderLeftColor: config.color,
                        borderLeftWidth: 4,
                        padding: 14,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
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
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: isDark ? "#f8fafc" : "#020617",
                            }}
                            numberOfLines={1}
                          >
                            {post.campaign || "No Campaign"}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: config.color,
                              fontWeight: "600",
                            }}
                          >
                            {config.name}
                          </Text>
                        </VStack>
                      </HStack>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={18}
                        color={isDark ? "#475569" : "#cbd5e1"}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </VStack>
          </ScrollView>
        </ActionsheetContent>
      </Actionsheet>
    </ThemedView>
  );
};

export default CalendarView;

const styles = StyleSheet.create({
  monthCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDayPanel: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
});

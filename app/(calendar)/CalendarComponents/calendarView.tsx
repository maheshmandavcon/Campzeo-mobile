import React, { useEffect, useMemo, useState } from "react";
import { Calendar } from "react-native-big-calendar";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Post } from "@/types/types";
import {
  ScrollView,
  FlatList,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  DeviceEventEmitter,
  RefreshControl,
  PanResponder,
} from "react-native";
import { groupEventsByDate } from "../../../utils/groupEventsByDate";
import { mapEvents } from "../../../utils/mapEvents";
import CalendarHeader from "./calendarHeader";
import EventModal from "./eventModal";
import UpcomingPostsList from "./upcomingPostsList";
import { Calendar as RNCalendar } from "react-native-calendars";

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
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  setYear,
  setMonth,
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
  refreshing?: boolean;
  onRefresh?: () => void;
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

const CalendarView: React.FC<CalendarViewProps> = ({ posts, refreshing, onRefresh }) => {
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
  
  // Custom Header States
  const [pickerMode, setPickerMode] = useState<"calendar" | "month" | "year">("calendar");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearsList = Array.from({ length: 51 }, (_, i) => 2000 + i);

  const togglePickerMode = () => {
    let newMode: "calendar" | "month" | "year" = "calendar";
    if (pickerMode === "calendar") newMode = "month";
    else if (pickerMode === "month") newMode = "year";
    
    setPickerMode(newMode);
  };

  useEffect(() => {
    DeviceEventEmitter.emit("calendarScrollEnabled", pickerMode !== "year");
  }, [pickerMode]);

  const handlePrevAction = () => {
    if (pickerMode === "month") {
      const newDate = setYear(currentDate, currentDate.getFullYear() - 1);
      setCurrentDate(newDate);
    } else if (pickerMode === "calendar") {
      const newDate = addMonths(currentDate, -1);
      setCurrentDate(newDate);
    }
  };

  const handleNextAction = () => {
    if (pickerMode === "month") {
      const newDate = setYear(currentDate, currentDate.getFullYear() + 1);
      setCurrentDate(newDate);
    } else if (pickerMode === "calendar") {
      const newDate = addMonths(currentDate, 1);
      setCurrentDate(newDate);
    }
  };

  const handleSelectMonth = (monthIndex: number) => {
    const newDate = setMonth(currentDate, monthIndex);
    setCurrentDate(newDate);
    setPickerMode("calendar");
  };

  const handleSelectYear = (year: number) => {
    const newDate = setYear(currentDate, year);
    setCurrentDate(newDate);
    setPickerMode("month");
  };

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
        setSelectedDate(new Date());
        setCurrentDate(new Date());
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

  const renderEvent = (event: any, touchableOpacityProps: any) => {
    const platformKey = event.platform?.toLowerCase() || "facebook";
    const config = PLATFORM_CONFIGS[platformKey] || {
      name: event.platform || "Platform",
      color: "#dc2626",
      icon: "document-text-outline",
    };

    const { key, style, ...restProps } = touchableOpacityProps;

    if (viewMode === "week") {
      return (
        <TouchableOpacity
          key={key}
          {...restProps}
          activeOpacity={0.8}
          style={[
            style,
            {
              backgroundColor: isDark ? "#1e293b" : "#ffffff",
              borderLeftWidth: 3,
              borderLeftColor: config.color,
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
              borderRadius: 6,
              padding: 4,
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "space-between",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
            },
          ]}
        >
          <VStack style={{ width: '100%' }}>
            <Text style={{ fontSize: 7, fontWeight: "800", color: event.isPostSent ? "#10b981" : "#3b82f6", textTransform: "uppercase", marginBottom: 1 }} numberOfLines={1}>
              {event.isPostSent ? "SENT" : "SCHED"}
            </Text>
            <Text style={{ fontSize: 9, color: isDark ? '#f8fafc' : '#0f172a', fontWeight: '700', flexShrink: 1, marginBottom: 2 }} numberOfLines={2}>
              {event.campaign || config.name}
            </Text>
          </VStack>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2, marginTop: 'auto' }}>
            <Ionicons name={config.icon as any} size={8} color={config.color} />
            <Text style={{ fontSize: 8, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }} numberOfLines={1}>
              {formatReadableTime(event.start)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={key}
        {...restProps}
        activeOpacity={0.8}
        style={[
          style,
          {
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderLeftWidth: 4,
            borderLeftColor: config.color,
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "space-between",
            borderWidth: 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}
      >
        <VStack gap={4}>
          <Text style={{ fontSize: 9, fontWeight: "800", color: event.isPostSent ? "#10b981" : "#3b82f6", textTransform: "uppercase" }}>
            {event.isPostSent ? "SENT" : "SCHEDULED"}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: isDark ? "#f8fafc" : "#0f172a",
              marginBottom: 4
            }}
            numberOfLines={2}
          >
            {event.campaign || "No Campaign"}
          </Text>
        </VStack>
        
        <HStack style={{ alignItems: "center", justifyContent: "space-between" }}>
          <HStack style={{ alignItems: "center", gap: 6 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: config.lightColor || (isDark ? "rgba(30, 41, 59, 0.8)" : "#f8fafc"),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={config.icon as any} size={11} color={config.color} />
            </View>
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#cbd5e1" : "#475569",
                fontWeight: "500",
              }}
            >
              {config.name}
            </Text>
          </HStack>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={isDark ? "#94a3b8" : "#94a3b8"} />
        </HStack>
      </TouchableOpacity>
    );
  };

  const renderSelectedDayPanel = (marginT = 0) => {
    const now = new Date();
    
    const dayPosts = events.filter((e) => {
      if (!isSameDay(e.start, selectedDate)) return false;
      return true;
    });

    if (dayPosts.length === 0) {
      return null;
    }

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
          return (
            <View style={{ gap: 12 }}>
              {dayPosts.map((post) => {
                const platformKey = post.platform?.toLowerCase() || "facebook";
                const config = PLATFORM_CONFIGS[platformKey] || {
                  name: post.platform || "Platform",
                  color: "#6b7280",
                  lightColor: "rgba(107, 114, 128, 0.12)",
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
                        borderColor: isDark ? "#334155" : "transparent",
                        padding: 16,
                        borderRadius: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderWidth: isDark ? 1 : 0,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 3,
                      }}
                    >
                      <HStack style={{ alignItems: "center", gap: 14, flex: 1 }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: config.lightColor || (isDark ? "rgba(30, 41, 59, 0.8)" : "#f8fafc"),
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name={config.icon as any} size={20} color={config.color} />
                        </View>
                        <VStack style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              color: isDark ? "#f8fafc" : "#0f172a",
                              marginBottom: 2,
                            }}
                            numberOfLines={1}
                          >
                            {post.campaign || "No Campaign Name"}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: isDark ? "#94a3b8" : "#64748b",
                              fontWeight: "500",
                            }}
                          >
                            {config.name}
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack style={{ alignItems: "center", gap: 8 }}>
                        <View style={{ backgroundColor: isDark ? "#0f172a" : "#f1f5f9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}>
                           <Text style={{ fontSize: 12, fontWeight: "600", color: isDark ? "#cbd5e1" : "#475569" }}>
                             {formatReadableTime(post.start)}
                           </Text>
                        </View>
                        <Ionicons name="chevron-forward-outline" size={18} color={isDark ? "#475569" : "#cbd5e1"} />
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

  const headerPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20; 
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          
          if (viewMode === "month") {
            setCurrentDate((prev) => subMonths(prev, 1));
          } else if (viewMode === "week") {
            setCurrentDate((prev) => subWeeks(prev, 1));
          } else if (viewMode === "day") {
            setCurrentDate((prev) => subDays(prev, 1));
          }
        } else if (gestureState.dx < -50) {
          // swipe left -> next week
          if (viewMode === "month") {
            setCurrentDate((prev) => addMonths(prev, 1));
          } else if (viewMode === "week") {
            setCurrentDate((prev) => addWeeks(prev, 1));
          } else if (viewMode === "day") {
            setCurrentDate((prev) => addDays(prev, 1));
          }
        }
      },
    })
  ).current;

  const renderCustomWeekHeader = (props: any) => {
    return (
      <View {...headerPanResponder.panHandlers} style={[{ flexDirection: "row", paddingBottom: 10, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: isDark ? "#334155" : "#e2e8f0" }, props.style]}>
        <View style={{ width: 50 }} />
        {props.dateRange.map((d: any, index: number) => {
          const dateObj = d.toDate ? d.toDate() : new Date(d);
          const isToday = isSameDay(dateObj, new Date());
          const isSelected = isSameDay(dateObj, selectedDate);
          
          const dayEvents = events.filter((e) => isSameDay(e.start, dateObj));
          const dots = dayEvents.slice(0, 3).map((e) => {
            const platformKey = e.platform?.toLowerCase() || "facebook";
            const config = PLATFORM_CONFIGS[platformKey] || { color: "#6b7280" };
            return config.color;
          });

          return (
            <TouchableOpacity
              key={index}
              style={{ flex: 1, alignItems: "center" }}
              onPress={() => {
                setSelectedDate(dateObj);
                setCurrentDate(dateObj);
              }}
            >
              <Text style={{
                fontSize: 12,
                color: isToday ? "#dc2626" : (isDark ? "#94a3b8" : "#64748b"),
                fontWeight: isToday ? "700" : "500",
                marginBottom: 2
              }}>
                {format(dateObj, "EEE")}
              </Text>
              <View style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: isSelected ? (isDark ? "rgba(220, 38, 38, 0.25)" : "rgba(220, 38, 38, 0.12)") : "transparent",
                alignItems: "center", justifyContent: "center"
              }}>
                <Text style={{
                  fontSize: 15,
                  color: isSelected ? "#dc2626" : (isDark ? "#f8fafc" : "#0f172a"),
                  fontWeight: isSelected ? "700" : "600"
                }}>
                  {format(dateObj, "d")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginTop: 2, height: 6, alignItems: "center" }}>
                {dots.map((color, i) => (
                  <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, marginHorizontal: 1 }} />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ThemedView style={{ flex: 1, marginBottom: 50 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={pickerMode !== "year"}
      >
            <View
          style={[
            styles.monthCard,
            {
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              borderColor: isDark ? "#334155" : "#e2e8f0",
              borderWidth: 1,
              padding: 16,
            },
          ]}
        >
          {/* UNIFIED HEADER ROW 1 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: pickerMode === "calendar" ? 16 : 0 }}>
            
            <View style={{ width: 40, alignItems: 'flex-start' }}>
              {pickerMode !== "year" && (
                <TouchableOpacity onPress={handlePrevAction} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="chevron-back" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <TouchableOpacity 
                onPress={togglePickerMode}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                {pickerMode !== "year" && (
                  <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
                    {format(currentDate, "MMM")}
                  </Text>
                )}
                <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
                  {format(currentDate, "yyyy")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ width: 40, alignItems: 'flex-end' }}>
              {pickerMode !== "year" && (
                <TouchableOpacity onPress={handleNextAction} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="chevron-forward" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* UNIFIED HEADER ROW 2 (TABS) */}
          {pickerMode === "calendar" && (
            <View style={{ flexDirection: "row", backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderRadius: 16, padding: 4, marginBottom: 12 }}>
              {["month", "week", "day"].map((mode) => {
                const isActive = viewMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setViewMode(mode as any)}
                    style={[
                      {
                        flex: 1,
                        paddingVertical: 8,
                        alignItems: "center",
                        borderRadius: 12,
                      },
                      isActive && {
                        backgroundColor: isDark ? "#334155" : "#ffffff",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 14, fontWeight: isActive ? "700" : "500", color: isActive ? (isDark ? "#f8fafc" : "#0f172a") : (isDark ? "#94a3b8" : "#64748b"), textTransform: "capitalize" }}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* CONTENT AREA */}
          {pickerMode === "year" ? (
            <FlatList
              style={{ maxHeight: 400 }}
              data={yearsList}
              numColumns={3}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              bounces={false}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              contentContainerStyle={{ paddingVertical: 10 }}
              initialScrollIndex={Math.max(0, Math.floor((currentDate.getFullYear() - 2000) / 3))}
              getItemLayout={(data, index) => ({
                length: 56,
                offset: 56 * index,
                index,
              })}
              renderItem={({ item: year }) => {
                const isCurrentYear = year === currentDate.getFullYear();
                return (
                  <TouchableOpacity
                    onPress={() => handleSelectYear(year)}
                    style={{
                      width: '30%',
                      marginVertical: 6,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderRadius: 12,
                      backgroundColor: isCurrentYear ? "#dc2626" : (isDark ? "#1e293b" : "#f1f5f9"),
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: isCurrentYear ? "#ffffff" : (isDark ? "#f8fafc" : "#0f172a") }}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          ) : pickerMode === "month" ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {monthNames.map((month, index) => {
                const isCurrentMonth = index === currentDate.getMonth();
                return (
                  <TouchableOpacity
                    key={month}
                    onPress={() => handleSelectMonth(index)}
                    style={{
                      width: '30%',
                      marginVertical: 10,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderRadius: 12,
                      backgroundColor: isCurrentMonth ? "#dc2626" : (isDark ? "#1e293b" : "#f1f5f9"),
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: isCurrentMonth ? "#ffffff" : (isDark ? "#f8fafc" : "#0f172a") }}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : viewMode === "month" ? (
            <View style={{ marginHorizontal: -10 }}>
              <RNCalendar
                key={`${format(currentDate, "yyyy-MM")}-${isDark ? "dark" : "light"}`}
                current={format(currentDate, "yyyy-MM-dd")}
                onDayPress={(day: any) => {
                  const date = new Date(day.timestamp);
                  setSelectedDate(date);
                  setCurrentDate(date);
                }}
                onMonthChange={(month: any) => {
                  const date = new Date(month.timestamp);
                  setCurrentDate(date);
                }}
                hideArrows={true}
                hideExtraDays={false}
                renderHeader={() => null} 
                theme={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  calendarBackground: isDark ? "#0f172a" : "#ffffff",
                  textSectionTitleColor: isDark ? "#94a3b8" : "#64748b",
                  selectedDayBackgroundColor: "transparent",
                  selectedDayTextColor: "#dc2626",
                  todayTextColor: isDark ? "#f8fafc" : "#0f172a",
                  dayTextColor: isDark ? "#f8fafc" : "#0f172a",
                  textDisabledColor: isDark ? "#334155" : "#cbd5e1",
                  dotColor: "#dc2626",
                  textDayFontWeight: "600",
                  textDayHeaderFontWeight: "700",
                  textDayFontSize: 15,
                  textDayHeaderFontSize: 12,
                  "stylesheet.calendar.header": {
                    dayTextAtIndex0: { color: isDark ? "#94a3b8" : "#64748b" },
                    dayTextAtIndex1: { color: isDark ? "#94a3b8" : "#64748b" },
                    dayTextAtIndex2: { color: isDark ? "#94a3b8" : "#64748b" },
                    dayTextAtIndex3: { color: isDark ? "#94a3b8" : "#64748b" },
                    dayTextAtIndex4: { color: isDark ? "#94a3b8" : "#64748b" },
                    dayTextAtIndex5: { color: isDark ? "#94a3b8" : "#64748b" },
                    dayTextAtIndex6: { color: isDark ? "#94a3b8" : "#64748b" },
                  },
                  "stylesheet.day.multiDot": {
                    base: {
                      width: 36,
                      height: 36,
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    today: {
                      backgroundColor: isDark ? "rgba(220, 38, 38, 0.25)" : "rgba(220, 38, 38, 0.12)",
                      borderRadius: 18,
                    }
                  },
                } as any}
                markingType={"multi-dot"}
                dayComponent={({ date, state, marking }: any) => {
                  const isToday = date.dateString === format(new Date(), "yyyy-MM-dd");
                  const defaultTextColor = isDark ? "#f8fafc" : "#0f172a";
                  const disabledTextColor = isDark ? "#334155" : "#cbd5e1";
                  
                  let textColor = state === 'disabled' ? disabledTextColor : defaultTextColor;
                  let bgColor = "transparent";
                  
                  if (marking?.selected) {
                    if (marking.selectedTextColor) textColor = marking.selectedTextColor;
                    if (marking.selectedColor) bgColor = marking.selectedColor;
                  }
                  
                  return (
                    <TouchableOpacity 
                      onPress={() => {
                        const d = new Date(date.timestamp);
                        setSelectedDate(d);
                        setCurrentDate(d);
                      }} 
                      style={{ alignItems: "center", justifyContent: "flex-start", height: 48, width: 36 }}
                    >
                      <View style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 16, 
                        backgroundColor: bgColor,
                        alignItems: "center", 
                        justifyContent: "center" 
                      }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: textColor }}>
                          {date.day}
                        </Text>
                      </View>
                      
                      {marking?.dots && marking.dots.length > 0 && (
                        <View style={{ flexDirection: "row", marginTop: 2, height: 6, alignItems: 'center' }}>
                          {marking.dots.map((dot: any, index: number) => (
                            <View key={index} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: dot.color, marginHorizontal: 1 }} />
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                markedDates={(() => {
                  const marks: any = {};
                  events.forEach((event) => {
                    const dateString = format(event.start, "yyyy-MM-dd");
                    if (!marks[dateString]) {
                      marks[dateString] = { dots: [] };
                    }
                    const platformKey = event.platform?.toLowerCase() || "facebook";
                    const config = PLATFORM_CONFIGS[platformKey] || { color: "#6b7280" };
                    
                    if (marks[dateString].dots.length < 3) {
                      marks[dateString].dots.push({ key: event.id, color: config.color });
                    }
                  });

                  const selectedDateString = format(selectedDate, "yyyy-MM-dd");
                  const todayString = format(new Date(), "yyyy-MM-dd");
                  
                  const todayBgColor = isDark ? "rgba(220, 38, 38, 0.25)" : "rgba(220, 38, 38, 0.12)";
                  const defaultTextColor = isDark ? "#f8fafc" : "#0f172a";
                  
                  if (!marks[todayString]) {
                    marks[todayString] = {};
                  }
                  marks[todayString].selected = true;
                  marks[todayString].selectedColor = todayBgColor;
                  marks[todayString].selectedTextColor = defaultTextColor;

                  if (selectedDateString !== todayString) {
                    if (!marks[selectedDateString]) {
                      marks[selectedDateString] = {};
                    }
                    marks[selectedDateString].selected = true;
                    marks[selectedDateString].selectedColor = "transparent";
                    marks[selectedDateString].selectedTextColor = "#dc2626";
                  }

                  return marks;
                })()}
              />
            </View>
          ) : (
            <View style={{ marginHorizontal: -10 }}>
              <Calendar
                key={`big-calendar-${isDark ? "dark" : "light"}`}
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
                renderHeader={renderCustomWeekHeader}
                calendarContainerStyle={{ backgroundColor: 'transparent' }}
                headerContainerStyle={{ backgroundColor: 'transparent' }}
                bodyContainerStyle={{ backgroundColor: 'transparent' }}
                theme={{
                  palette: {
                    primary: {
                      main: "#dc2626",
                      contrastText: "#ffffff",
                    },
                    nowIndicator: "#dc2626",
                    gray: {
                      100: isDark ? "#1e293b" : "#f1f5f9",
                      200: isDark ? "#334155" : "#e2e8f0",
                      300: isDark ? "#475569" : "#cbd5e1",
                      500: isDark ? "#94a3b8" : "#64748b",
                      800: isDark ? "#f8fafc" : "#0f172a",
                    },
                  },
                } as any}
              />
            </View>
          )}
        </View>

        {/* SELECTED DAY PANEL UNDERNEATH */}
        {renderSelectedDayPanel(16)}

        {/* UPCOMING POSTS LIST UNDERNEATH */}
        <UpcomingPostsList 
          groupedEvents={groupedEvents} 
          selectedDate={selectedDate} 
          viewMode={viewMode}
          currentDate={currentDate} 
        />
      </ScrollView>

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
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  selectedDayPanel: {
    marginHorizontal: 0,
    marginBottom: 20,
  },
});

import React, { useMemo, useState } from "react";
import { Calendar } from "react-native-big-calendar";

import { ThemedView } from "@/components/themed-view";
import { CalendarEvent, Post } from "@/types/types";
// import { ScrollView } from "react-native-gesture-handler";
import { ScrollView } from "react-native";
import { groupEventsByDate } from "../../../utils/groupEventsByDate";
import { mapEvents } from "../../../utils/mapEvents";
import CalendarHeader from "./calendarHeader";
import EventModal from "./eventModal";
import UpcomingPostsList from "./upcomingPostsList";

interface CalendarViewProps {
  posts: Post[]; // Raw posts loaded by CalendarWrapper
}

const CalendarView: React.FC<CalendarViewProps> = ({ posts }) => {
  // Controls Month / Week / Day View
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Controls which date the calendar focuses on
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Event Modal State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [isModalVisible, setModalVisible] = useState(false);

  // Convert backend posts → CalendarEvents format
  const events = useMemo(() => mapEvents(posts), [posts]);

  // Group events by date for upcoming posts list
  const groupedEvents = useMemo(() => groupEventsByDate(events), [events]);

  // When user taps an event in the calendar
  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  return (
    <ThemedView style={{ marginBottom: 50 }}>
      {/* HEADER (View Mode Switcher + Month Label + Navigation) */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onChangeView={setViewMode}
        onChangeDate={setCurrentDate}
      />

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* MAIN CALENDAR */}
        <Calendar
          events={events}
          mode={viewMode}
          date={currentDate}
          height={520}
          onPressEvent={handleEventPress}
          swipeEnabled={true}
        />

        {/* UPCOMING POSTS LIST BELOW CALENDAR */}
        <UpcomingPostsList groupedEvents={groupedEvents} />
      </ScrollView>

      {/* EVENT MODAL */}
      <EventModal
        event={selectedEvent}
        isOpen={isModalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ThemedView>
  );
};

export default CalendarView;

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { addDays, addMonths, addWeeks, format } from "date-fns";
import { CircleChevronLeft, CircleChevronRight } from "lucide-react-native";
import React from "react";
import { TextStyle, TouchableOpacity, useColorScheme } from "react-native";

/* ----------------------------- TYPES ----------------------------- */

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: "month" | "week" | "day";
  onChangeView: (mode: "month" | "week" | "day") => void;
  onChangeDate: (date: Date) => void;
}

/* --------------------------- COMPONENT --------------------------- */

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onChangeView,
  onChangeDate,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  /* ---------------------------- COLORS ---------------------------- */

  const ACTIVE_COLOR = "#dc2626";


  /* ------------------------- FORMAT LABEL ------------------------- */

  const monthLabel = format(currentDate, "MMMM yyyy");

  /* ----------------------- DATE NAVIGATION ------------------------ */

  const handlePrev = () => {
    if (viewMode === "month") onChangeDate(addMonths(currentDate, -1));
    else if (viewMode === "week") onChangeDate(addWeeks(currentDate, -1));
    else onChangeDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (viewMode === "month") onChangeDate(addMonths(currentDate, 1));
    else if (viewMode === "week") onChangeDate(addWeeks(currentDate, 1));
    else onChangeDate(addDays(currentDate, 1));
  };

  /* ---------------------- VIEW MODE STYLES ------------------------ */

  const getViewModeStyle = (mode: "month" | "week" | "day"): TextStyle => ({
    fontSize: 16,
    fontWeight: viewMode === mode ? "700" : "400",
    color:  ACTIVE_COLOR,
    // opacity: viewMode === mode ? 1 : 0.75,
  });

  /* ------------------------------ UI ------------------------------ */

  return (
    <ThemedView
      style={{
        padding: 12,
        gap: 12,
      }}
    >
      {/* ================= TOP ROW ================= */}

      <ThemedView
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* PREV */}
        <TouchableOpacity onPress={handlePrev}>
          <CircleChevronLeft size={34} color={ACTIVE_COLOR} />
        </TouchableOpacity>

        {/* MONTH LABEL */}
        <ThemedText
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: ACTIVE_COLOR,
          }}
        >
          {monthLabel}
        </ThemedText>

        {/* NEXT */}
        <TouchableOpacity onPress={handleNext}>
          <CircleChevronRight size={34} color={ACTIVE_COLOR} />
        </TouchableOpacity>
      </ThemedView>

      {/* ================= VIEW MODES ================= */}

      <ThemedView
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <TouchableOpacity onPress={() => onChangeView("month")}>
          <ThemedText style={getViewModeStyle("month")}>Month</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onChangeView("week")}>
          <ThemedText style={getViewModeStyle("week")}>Week</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onChangeView("day")}>
          <ThemedText style={getViewModeStyle("day")}>Day</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

export default CalendarHeader;

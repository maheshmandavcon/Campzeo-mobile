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

  const getPillStyle = (mode: "month" | "week" | "day") => ({
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: viewMode === mode ? ACTIVE_COLOR : "transparent",
  });

  const getTextStyle = (mode: "month" | "week" | "day"): TextStyle => ({
    fontSize: 14,
    fontWeight: viewMode === mode ? "700" : "600",
    color: viewMode === mode ? "#ffffff" : isDark ? "#94a3b8" : "#64748b",
  });

  /* ------------------------------ UI ------------------------------ */

  return (
    <ThemedView
      style={{
        padding: 16,
        paddingBottom: 8,
        gap: 16,
        backgroundColor: "transparent"
      }}
    >
      {/* ================= VIEW MODES ================= */}

      <ThemedView
        style={{
          flexDirection: "row",
          justifyContent: "center",
          backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          borderRadius: 24,
          padding: 4,
          alignSelf: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      >
        <TouchableOpacity onPress={() => onChangeView("month")} style={getPillStyle("month")}>
          <ThemedText style={getTextStyle("month")}>Month</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onChangeView("week")} style={getPillStyle("week")}>
          <ThemedText style={getTextStyle("week")}>Week</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onChangeView("day")} style={getPillStyle("day")}>
          <ThemedText style={getTextStyle("day")}>Day</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

export default CalendarHeader;

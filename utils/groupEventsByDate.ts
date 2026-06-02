import { CalendarEvent } from "@/types/types";
import { format } from "date-fns";

export const groupEventsByDate = (events: CalendarEvent[]) => {
  const grouped: Record<string, CalendarEvent[]> = {};

  events.forEach((event) => {
    // Convert event.start into a date string (YYYY-MM-DD)
    const dateKey = format(event.start, "yyyy-MM-dd");

    // Create array if not present
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }

    // Push event into its date bucket
    grouped[dateKey].push(event);
  });

  // Sort events inside each date by time
  Object.keys(grouped).forEach((date) => {
    grouped[date].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );
  });

  return grouped;
};

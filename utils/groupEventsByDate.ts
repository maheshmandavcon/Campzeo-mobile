import { format } from "date-fns";

export const groupEventsByDate = (events: any[]) => {
  const grouped: Record<string, any[]> = {};

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

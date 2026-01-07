import { format, isToday, parseISO } from "date-fns";
// export default
// Convert ISO → readable date (e.g., "December 9, 2025")
export const formatReadableDate = (isoString: string | Date) => {
  const date = isoString instanceof Date ? isoString : parseISO(isoString);
  return format(date, "MMMM d, yyyy");
};

// Convert ISO → readable time (e.g., "9:00 AM")
export const formatReadableTime = (isoString: string | Date) => {
  const date = isoString instanceof Date ? isoString : parseISO(isoString);
  return format(date, "h:mm a");
};

// Check if given ISO date is today
export const isTodayDate = (isoString: string | Date) => {
  const date = isoString instanceof Date ? isoString : parseISO(isoString);
  return isToday(date);
};

// Convert "yyyy-MM-dd" key → readable date
export const formatDateKey = (key: string) => {
  // Convert key ("2025-12-09") into Date
  const date = new Date(key + "T00:00:00");
  return format(date, "MMMM d, yyyy");
};

// Label for upcoming list ("Today" or formatted date)
export const getDateLabel = (key: string) => {
  const date = new Date(key + "T00:00:00");

  if (isToday(date)) return "Today";

  return format(date, "MMMM d, yyyy");
};

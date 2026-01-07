import { CalendarEvent } from "@/types/types";

export const mapEvents = (posts: any[]): CalendarEvent[] => {
  return posts.map((post) => {
    const start = new Date(post.scheduledPostTime);

    return {
      id: post.id,

      // ✅ TITLE IS NOW PLATFORM
      title: post.type, // SMS, WHATSAPP, FACEBOOK

      start,
      end: start,

      platform: post.type,
      message: post.message,

      // keep campaign if you still want it in modal
      campaign: post.campaign?.name ?? ""
    };
  });
};

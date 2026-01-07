// api/notification/notificationApi.ts
import axios from "axios";
import { BASE_URL } from "../config";

export type AuthToken = string;

// ---------------- GET NOTIFICATIONS ----------------
export const getNotificationsApi = async (
  token: AuthToken,
  page: number = 1,
  limit: number = 5
) => {
  try {
    const response = await axios.get(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });
    return response.data; // Return API response
  } catch (error: any) {
    console.error("Get Notifications API Error:", error.response || error.message);
    throw error;
  }
};

// ---------------- DELETE NOTIFICATION ----------------
export const deleteNotificationApi = async (token: AuthToken, notificationId: number) => {
  try {
    const response = await axios.delete(`${BASE_URL}/notifications/${notificationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // Return API response
  } catch (error: any) {
    console.error("Delete Notification API Error:", error.response || error.message);
    throw error;
  }
};

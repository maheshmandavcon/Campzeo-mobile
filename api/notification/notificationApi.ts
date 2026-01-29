import https from "../https";

export type AuthToken = string;

// ---------------- GET NOTIFICATIONS ----------------

export const getNotificationsApi = async (
  token: AuthToken,
  page: number = 1,
  limit: number = 5
) => {
  try {
    const res = await https.get("/notifications", {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, limit },
    });

    return res.data; // Return API response
  } catch (error: any) {
    console.error("Get Notifications API Error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to fetch notifications"
    );
  }
};

// ---------------- MARK ALL NOTIFICATIONS AS READ ----------------

export const markAllNotificationsReadApi = async (token: AuthToken) => {
  try {
    const res = await https.patch(
      "/notifications",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.data;
  } catch (error: any) {
    console.error(
      "Mark All Notifications Read API Error:",
      error.response || error.message
    );
    throw new Error(
      error?.response?.data?.message ||
        "Failed to mark all notifications as read"
    );
  }
};

// ---------------- DELETE NOTIFICATION ----------------

export const deleteNotificationApi = async (token: AuthToken, notificationId: number) => {
  try {
    const res = await https.delete(`/notifications/${notificationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data; // Return API response
  } catch (error: any) {
    console.error("Delete Notification API Error:", error.response || error.message);
    throw new Error(
      error?.response?.data?.message || error?.response?.data || "Failed to delete notification"
    );
  }
};

import https from "./https";

// Fetch available platforms from organization
export const getPlatform = async (token: string) => {
  try {
    const response = await https.get(`Organization/getplatform`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });    
    return response.data;
  } catch (error) {
    console.error("Fetching platform Error:", error);
    throw error;
  }
};

// Fetch campaign posts with dynamic pagination, date range, and optional platform
export const getPosts = async (
  token: string,
  orgId: number,
  platform: string,
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    let url = `Analytics/posts?page=${page}&limit=${limit}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    // Platform is optional; if it's "all" or empty, skip appending it
    if (platform && platform.toLowerCase() !== "all") {
      url += `&platform=${platform}`;
    }

    const response = await https.get(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });    
    return response.data;
  } catch (error) {
    console.error("Fetching posts Error:", error);
    throw error;
  }
};

// Fetch Funnel statistics (Reach, Engagement, New Contacts)
export const getFunnel = async (token: string, startDate: string, endDate: string) => {
  try {
    let url = `Analytics/funnel`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const response = await https.get(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });    
    return response.data;
  } catch (error) {
    console.error("Fetching funnel stats Error:", error);
    throw error;
  }
};

// Fetch general engagement statistics with trend metrics
export const getEngagement = async (token: string, startDate: string, endDate: string, platform?: string) => {
  try {
    let url = `Analytics/organisation`;
    const params: string[] = [];
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (platform && platform.toLowerCase() !== "all") {
      params.push(`platform=${platform}`);
    }
    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const response = await https.get(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });    
    return response.data;
  } catch (error) {
    console.error("Fetching engagement stats Error:", error);
    throw error;
  }
};

// Refresh individual campaign post statistics dynamically
export const refreshPost = async (token: string, id: number, platform: string, postId: string) => {
  try {
    const response = await https.get(`Analytics/post-details/${id}?fresh=true&platform=${platform}&postId=${postId}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error refreshing posts:", error);
    throw error;
  }
};
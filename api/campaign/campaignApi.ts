import https from "../https";

// import * as FileSystem from "expo-file-system";

// ---------------------- Types ---------------------- //
// export type AuthToken = string;

export interface CampaignData {
  id?: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  contactIds: number[];
}

export interface CampaignPostData {
  senderEmail: string;
  subject: string;
  message: string;
  type: string;
  mediaUrls?: string[];
  scheduledPostTime: string;
  pinterestBoard?: string;

  metadata?: {
    boardId?: string;
    boardName?: string;
    destinationLink?: string;
    tags?: string[];
    postType?: string;
    privacy?: string;
    thumbnailUrl?: string | null;
    playlistId?: string;
    playlistTitle?: string;
    coverImage?: string | null;
  };
}

// ---------------------- Campaign APIs ---------------------- //

// Create a new campaign

export const createCampaignApi = async (data: CampaignData) => {
  try {
    const response = await https.post("/campaigns", data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Create Campaign API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Get campaigns

export const getCampaignsApi = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  try {
    const params: any = { page, limit };
    if (search) params.search = search;
    const response = await https.get("/campaigns", { params });
    return response.data;
  } catch (error: any) {
    console.error("Get Campaigns API Error:", error.response || error.message);
    throw error;
  }
};

// Get single campaign by ID

export const getCampaignByIdApi = async (id: number) => {
  try {
    const response = await https.get(`/campaigns/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      "Get Campaign By ID API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Update campaign by ID

export const updateCampaignApi = async (id: number, data: CampaignData) => {
  try {
    const response = await https.put(`/campaigns/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Update Campaign API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Delete campaign

export const deleteCampaignApi = async (id: number) => {
  try {
    const response = await https.delete(`/campaigns/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(
      "Delete Campaign API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// ---------------------- Campaign Post APIs ---------------------- //

// Get posts for a specific campaign

export const getPostsByCampaignIdApi = async (campaignId: number) => {
  try {
    const res = await https.get(`/campaigns/${campaignId}/posts`);
    return res.data;
  } catch (error: any) {
    console.error("Get Posts Error:", error.response?.data || error.message);
    return null;
  }
};

// Create a post for a specific campaign

export const createPostForCampaignApi = async (
  campaignId: number,
  data: CampaignPostData,
  token?: string,
) => {
  try {
    const response = await https.post(`/campaigns/${campaignId}/posts`, data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    console.log("Create Post API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Create Post API Error:", error.response || error.message);
    throw error;
  }
};

// Delete a post for a specific campaign
// Note: Can only delete posts in DRAFT or SCHEDULED status

// export const deletePostForCampaignApi = async (
//   campaignId: number,
//   postId: number,
// ) => {
//   try {
//     const response = await https.delete(
//       `/campaigns/${campaignId}/posts/${postId}`,
//       {
//         headers: { "Content-Type": "application/json" },
//       },
//     );
//     console.log("Delete Post API Response:", response.data);
//     return response.data;
//   } catch (error: any) {
//     console.error(
//       "Delete Post API Error:",
//       error.response?.data || error.message,
//     );
//     throw error;
//   }
// };

// Share a campaign post

export const shareCampaignPostApi = async (
  campaignId: number,
  postId: number,
  contactIds: number[],
  // token: AuthToken
) => {
  try {
    const response = await https.post(
      `/campaigns/${campaignId}/posts/${postId}/send`,
      { contactIds },
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    console.log("Share Post API Response:", response);
    return response.data;
  } catch (error: any) {
    console.error(
      "Send Campaign Post API Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Update (Edit) a post for a specific campaign

export const updatePostForCampaignApi = async (
  campaignId: number,
  postId: number,
  data: CampaignPostData,
  token?: string,
) => {
  try {
    const response = await https.put(
      `/campaigns/${campaignId}/posts/${postId}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error("Update Post API Error:", error.response || error.message);
    throw error;
  }
};

// Delete a post for a specific campaign

export const deletePostForCampaignApi = async (
  campaignId: number,
  postId: number,
) => {
  try {
    const response = await https.delete(
      `/campaigns/${campaignId}/posts/${postId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Delete Post API Error:", error.response || error.message);
    throw error;
  }
};

// ---------------------- AI APIs ---------------------- //

// Generate AI Content

export interface AIContentRequest {
  prompt: string;
  context: { platform: string; existingContent: string };
  mode: string;
}

export interface AIVariation {
  subject: string;
  content: string;
}

export interface AIContentResponse {
  success: boolean;
  content: string;
  subject: string;
  variations: AIVariation[];
}

export const generateAIContentApi = async (
  data: AIContentRequest,
  token?: string,
) => {
  try {
    const response = await https.post("/ai/generate-content", data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "AI Content Generation API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Generate AI Image

export interface AIImageRequest {
  prompt: string;
  count?: number;
}

export interface AIImageResponse {
  success: boolean;
  images?: string[];
  imagePrompt: string;
  message: string;
}

export const generateAIImageApi = async (
  data: AIImageRequest,
  token?: string,
) => {
  try {
    const response = await https.post("/ai/generate-image", data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "AI Image Generation API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// ---------------------- Pinterest APIs ---------------------- //

// Create Pinterest Boards

export const createPinterestBoardApi = async (
  payload: {
    name: string;
    description?: string;
    privacy: "PUBLIC";
  },
  token?: string,
) => {
  try {
    const response = await https.post(
      "/socialmedia/pinterest/boards",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Create Pinterest Board API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Get Pinterest Boards

export const getPinterestBoardsApi = async (token?: string) => {
  try {
    const res = await https.get("/socialmedia/pinterest/boards", {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data.boards || [];
  } catch (error: any) {
    console.error(
      "Get Pinterest Boards API Error:",
      error.response || error.message,
    );
    return [];
  }
};

// ---------------------- Facebook APIs ---------------------- //

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
}

export const getFacebookPagesApi = async (
  token?: string,
): Promise<FacebookPage[]> => {
  try {
    const response = await https.get("/socialmedia/facebook/pages", {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (response.data.error) throw new Error(response.data.error);
    return response.data.pages || [];
  } catch (error: any) {
    console.error(
      "Get Facebook Pages API Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// ---------------------- YouTube APIs ---------------------- //

export interface YouTubePlaylist {
  id: string;
  title: string;
}

export const getYouTubePlaylistsApi = async (token?: string): Promise<YouTubePlaylist[]> => {
  try {
    const response = await https.get("/youtube/playlists", {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data.playlists || response.data || [];
  } catch (error: any) {
    console.error(
      "Get YouTube Playlists API Error:",
      error.response?.data || error.message,
    );
    return [];
  }
};

// ---------------------- Upload Media API ---------------------- //

export const uploadMediaApi = async (
  attachment: { uri: string; name: string; type: string },
  token: string,
  onProgress?: (percentage: number) => void
): Promise<string> => {
  try {
    console.log("🔄 Starting upload process for:", attachment.name);

    // Get Base URL from env and ensure correct formatting
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";
    const uploadRefUrl = `${baseUrl}/upload`;
    
    console.log("📍 Token Endpoint:", uploadRefUrl);

    // 1️⃣ Get upload token and details from backend using FETCH
    const payload = {
      type: "blob.generate-client-token",
      payload: {
        pathname: attachment.name,
        clientPayload: JSON.stringify({ token }),
        multipart: false,
      },
    };

    const tokenRes = await fetch(uploadRefUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
      },
      body: JSON.stringify(payload),
    });

    if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        throw new Error(`Token request failed: ${tokenRes.status} ${errorText}`);
    }

    const data = await tokenRes.json();

    if (!data.clientToken) {
        throw new Error("Upload failed: No clientToken returned from backend");
    }

    // 2️⃣ Read file as Blob
    const fileResponse = await fetch(attachment.uri);
    const blob = await fileResponse.blob();

    // 3️⃣ Upload to Vercel Blob directly
    // If backend didn't give a URL, we construct the standard Vercel Blob upload URL
    const uploadBase = "https://blob.vercel-storage.com";
    const pathname = attachment.name.startsWith("/") ? attachment.name : `/${attachment.name}`;
    
    // Vercel Blob often requires the token in the query params for direct client uploads
    const clientToken = data.clientToken;
    const urlWithToken = data.url || `${uploadBase}${pathname}?token=${clientToken}`;

    const putHeaders: any = {
      ...(data.headers || {}),
      "Content-Type": attachment.type,
      "x-vercel-blob-token": clientToken, 
      "x-vercel-blob-add-random-suffix": "1",
      "Authorization": `Bearer ${clientToken}`, // Explicitly adding Authorization header as requested by 403 error
    };

    console.log("📤 Uploading to Blob Store:", urlWithToken);

    const uploadRes = await fetch(urlWithToken, {
      method: "PUT",
      headers: putHeaders,
      body: blob,
    });

    if (!uploadRes.ok) {
        const text = await uploadRes.text();
        throw new Error(`Upload to Vercel Blob failed: ${uploadRes.status} ${text}`);
    }
    
    // 4️⃣ Get public URL from response
    // The successful PUT response from Vercel Blob contains the file metadata
    const uploadResult = await uploadRes.json();
    const publicUrl = uploadResult.url;

    if (!publicUrl) {
       throw new Error("Upload succeeded but no URL returned in body");
    }
    
    console.log("✅ File uploaded successfully:", publicUrl);
    return publicUrl;

  } catch (error: any) {
    console.error("Upload Media API Error:", error.message);
    throw error;
  }
};

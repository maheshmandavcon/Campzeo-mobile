import https from "../https";

export type AuthToken = string;

// ---------------------- Types ---------------------- //
export interface CampaignData {
  id?: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  contactIds: number[];
}

export interface CampaignPostData {
  subject: string;
  message: string;
  type: string;
  mediaUrls?: string[];
  scheduledPostTime: string;
  pinterestBoard?: string;
  destinationLink?: string;
  metadata?: {
    boardId?: string;
    boardName?: string;
    link?: string;
  };
}

// ---------------------- Campaign APIs ---------------------- //

// Create a new campaign
export const createCampaignApi = async (data: CampaignData, token: AuthToken) => {
  try {
    const response = await https.post("/campaigns", data, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Create Campaign API Error:", error.response || error.message);
    throw error;
  }
};

// Get campaigns with pagination & search
export const getCampaignsApi = async (
  token: AuthToken,
  page: number = 1,
  limit: number = 10,
  search: string = ""
) => {
  try {
    const params: any = { page, limit };
    if (search) params.search = search;

    const response = await https.get("/campaigns", {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error("Get Campaigns API Error:", error.response || error.message);
    throw error;
  }
};

// Get single campaign by ID
export const getCampaignByIdApi = async (id: number, token: AuthToken) => {
  try {
    const response = await https.get(`/campaigns/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Get Campaign By ID API Error:", error.response || error.message);
    throw error;
  }
};

// Update campaign by ID
export const updateCampaignApi = async (id: number, data: CampaignData, token: AuthToken) => {
  try {
    const response = await https.put(`/campaigns/${id}`, data, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Update Campaign API Error:", error.response || error.message);
    throw error;
  }
};

// Delete campaign
export const deleteCampaignApi = async (id: number, token: AuthToken) => {
  try {
    const response = await https.delete(`/campaigns/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Delete Campaign API Error:", error.response || error.message);
    throw error;
  }
};

// ---------------------- Campaign Posts APIs ---------------------- //

// Get posts for a specific campaign
export const getPostsByCampaignIdApi = async (campaignId: number, token: AuthToken) => {
  try {
    // console.log("Fetching posts for campaign:", campaignId);
    const res = await https.get(`/campaigns/${campaignId}/posts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
  token: AuthToken
) => {
  try {
    const response = await https.post(`/campaigns/${campaignId}/posts`, data, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    console.log("Create Post API Response:", response);

  
    return response.data;
  } catch (error: any) {
    console.error("Create Post API Error:", error.response || error.message);
    throw error;
  }
};

// Share a campaign post
export const shareCampaignPostApi = async (
  campaignId: number,
  postId: number,
  contactIds: number[], 
  token: AuthToken
) => {
  try {
    const response = await https.post(
      `/campaigns/${campaignId}/posts/${postId}/send`,
      { contactIds },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Share Post API Response:", response);

    return response.data; 
  } catch (error: any) {
    console.error("Send Campaign Post API Error:", error.response?.data || error.message);
    throw error;
  }
};

// Update (Edit) a post for a specific campaign
export const updatePostForCampaignApi = async (
  campaignId: number,
  postId: number,
  data: CampaignPostData,
  token: AuthToken
) => {
  try {
    const response = await https.put(`/campaigns/${campaignId}/posts/${postId}`, data, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
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
  token: AuthToken
) => {
  try {
    const response = await https.delete(`/campaigns/${campaignId}/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    console.error("Delete Post API Error:", error.response || error.message);
    throw error;
  }
};

// ---------------------- AI Content Generation API ---------------------- //

export interface AIContentRequest {
  prompt: string;
  context: {
    platform: string; 
    existingContent: string;
  };
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
  token?: AuthToken
): Promise<AIContentResponse> => {
  try {
    const response = await https.post("/ai/generate-content", data, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("AI Content Generation API Error:", error.response || error.message);
    throw error;
  }
};

// ---------------------- AI Image Generation API ---------------------- //

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
  token?: AuthToken
): Promise<AIImageResponse> => {
  try {
    const response = await https.post("/ai/generate-image", data, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("AI Image Generation API Error:", error.response || error.message);
    throw error;
  }
};

// ---------------------- Pinterest APIs ---------------------- //

// Create Pinterest Boards

export const createPinterestBoardApi = async (
  payload: {
    name: string;
    description?: string;
    privacy: "PUBLIC"
  },
  token: AuthToken
) => {
  try {
    const response = await https.post(
      "/socialmedia/pinterest/boards",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Create Pinterest Board API Error:",
      error.response || error.message
    );
    throw error;
  }
};

// Get Pinterest Boards

export const getPinterestBoardsApi = async (token: string) => {
  try {
    const res = await https.get("/socialmedia/pinterest/boards", {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Assuming the response looks like { boards: [{ id, name, description, privacy }, ...] }
    return res.data.boards || [];
  } catch (error: any) {
    console.error("Get Pinterest Boards API Error:", error.response || error.message);
    return [];
  }
};

// ---------------------- Facebook APIs ---------------------- //

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
}

export const getFacebookPagesApi = async (token: AuthToken): Promise<FacebookPage[]> => {
  try {
    const response = await https.get("/socialmedia/facebook/pages", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return response.data.pages || [];
    
  } catch (error: any) {
    console.error("Get Facebook Pages API Error:", error.response?.data || error.message);
    throw error;
  }
};

// ---------------------- Upload API ---------------------- //

export const uploadMediaApi = async (
  attachment: { uri: string; name: string; type: string },
  token: string
): Promise<string> => {
  try {
    const payload = {
      type: "blob.generate-client-token",
      payload: {
        pathname: attachment.name,
        clientPayload: null,
        multipart: false,
      },
    };

    const response = await https.post(
      "/upload", // ✅ FIXED
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const clientToken = response.data?.clientToken;
    if (!clientToken) {
      throw new Error("Upload failed: no clientToken returned");
    }

    return clientToken;
  } catch (error: any) {
    console.error("Upload Media API Error:", error.response || error.message);
    throw error;
  }
};

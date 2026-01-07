import axios from "axios";
import { BASE_URL } from "../config";

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
}

// ---------------------- Campaign APIs ---------------------- //

// Create a new campaign
export const createCampaignApi = async (data: CampaignData, token: AuthToken) => {
  try {
    const response = await axios.post(`${BASE_URL}/campaigns`, data, {
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

    const response = await axios.get(`${BASE_URL}/campaigns`, {
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
    const response = await axios.get(`${BASE_URL}/campaigns/${id}`, {
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
    const response = await axios.put(`${BASE_URL}/campaigns/${id}`, data, {
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
    const response = await axios.delete(`${BASE_URL}/campaigns/${id}`, {
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
export const getPostsByCampaignIdApi = async (campaignId: number, token: string) => {
  try {
    const res = await axios.get(`${BASE_URL}/campaigns/${campaignId}/posts`, {
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
    const response = await axios.post(`${BASE_URL}/campaigns/${campaignId}/posts`, data, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error("Create Post API Error:", error.response || error.message);
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
    const response = await axios.put(
      `${BASE_URL}/campaigns/${campaignId}/posts/${postId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Update Post API Error:", error.response || error.message);
    throw error;
  }
};

// ---------------------- Delete Post ---------------------- //

// Delete a post for a specific campaign
export const deletePostForCampaignApi = async (
  campaignId: number,
  postId: number,
  token: AuthToken
) => {
  try {
    const response = await axios.delete(`${BASE_URL}/campaigns/${campaignId}/posts/${postId}`, {
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
    platform: string; // e.g., WHATSAPP, FACEBOOK
    existingContent: string;
  };
  mode: string; // e.g., "generate"
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

/**
 * Generate AI content for a given prompt & platform
 */
export const generateAIContentApi = async (
  data: AIContentRequest,
  token?: AuthToken
): Promise<AIContentResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/ai/generate-content`, data, {
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
  count?: number; // Number of images to generate
}

export interface AIImageResponse {
  success: boolean;
  images?: string[]; 
  imagePrompt: string; 
  message: string;
}

/**
 * Generate images using AI for a given prompt
 */
export const generateAIImageApi = async (
  data: AIImageRequest,
  token?: AuthToken
): Promise<AIImageResponse> => {
  try {
    const response = await axios.post(`${BASE_URL}/ai/generate-image`, data, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("AI Image Generation API Error:", error.response || error.message);
    throw error;
  }
};

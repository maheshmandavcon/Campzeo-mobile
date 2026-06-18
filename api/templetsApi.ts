import https from "./https";

export interface TemplateData {
  name: string;
  description?: string | null;
  platform: string;
  category: string;
  isActive: boolean;
  content: string;
  subject?: string;
  metadata?: string;
  mediaUrls?: string[];
}

export const getTemplatesApi = async (orgId: number, token?: string) => {
  try {
    const response = await https.get(`Templates?organisationId=${orgId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Get Templates API Error:", error.response || error.message);
    throw error;
  }
};

// Create a new template
export const createTemplateApi = async (orgId: number, data: TemplateData, token?: string) => {
  try {
    const response = await https.post(`Templates?organisationId=${orgId}`, data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Create Template API Error:", error.response || error.message);
    throw error;
  }
};

// Delete a template
export const deleteTemplateApi = async (orgId: number, id: number, token?: string) => {
  try {
    const response = await https.delete(`Templates/${id}?organisationId=${orgId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Delete Template API Error:", error.response || error.message);
    throw error;
  }
};
